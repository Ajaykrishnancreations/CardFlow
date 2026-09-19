package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log/slog"
	"math/big"
	"net/http"
	"net/url"
	"strings"
	"sync"
	"time"

	"cardflow-backend/internal/config"
	"cardflow-backend/internal/database"
	"cardflow-backend/internal/domain"
	"cardflow-backend/pkg/validator"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type AuthService struct {
	cfg      *config.Config
	db       *database.DB
	redis    *database.RedisClient
	jwt      *JWTService
	otpMutex sync.RWMutex
	otpStore map[string]string
}

func NewAuthService(db *database.DB, redis *database.RedisClient, jwt *JWTService, cfg *config.Config) *AuthService {
	return &AuthService{
		cfg:      cfg,
		db:       db,
		redis:    redis,
		jwt:      jwt,
		otpStore: make(map[string]string),
	}
}

// RequestOTP generates and stores a fresh 6-digit OTP for the phone number.
func (s *AuthService) RequestOTP(ctx context.Context, rawPhone string) (string, error) {
	phone, ok := validator.NormalizePhone(rawPhone)
	if !ok {
		return "", errors.New("invalid phone number. Format must be E.164 (e.g., +919876543210)")
	}

	otpCode := s.generate6DigitCode()

	s.otpMutex.Lock()
	if s.otpStore == nil {
		s.otpStore = make(map[string]string)
	}
	s.otpStore[phone] = otpCode
	s.otpMutex.Unlock()

	if s.redis != nil && s.redis.Client != nil {
		otpHash := s.hashOTP(otpCode)
		otpKey := fmt.Sprintf("otp:%s", phone)
		_ = s.redis.Client.HSet(ctx, otpKey, map[string]interface{}{
			"hash":     otpHash,
			"code":     otpCode,
			"attempts": 0,
		}).Err()
		_ = s.redis.Client.Expire(ctx, otpKey, 5*time.Minute).Err()
	}

	slog.Info("🚀 [OTP DISPATCHED]", "phone", phone, "otp", otpCode)
	return otpCode, nil
}

func (s *AuthService) SendOTP(ctx context.Context, rawPhone, deviceID, platform string) (map[string]interface{}, error) {
	code, err := s.RequestOTP(ctx, rawPhone)
	if err != nil {
		return nil, err
	}

	phone, _ := validator.NormalizePhone(rawPhone)
	if s.cfg.SMSProvider == "fast2sms" && s.cfg.SMSAuthKey != "" {
		if sendErr := s.sendSMSViaFast2SMS(ctx, phone, code); sendErr != nil {
			slog.Error("Fast2SMS send failed", "phone", phone, "error", sendErr)
			return nil, fmt.Errorf("could not send OTP SMS — please try again")
		}
		return map[string]interface{}{
			"success": true,
			"message": "OTP sent successfully",
		}, nil
	}

	// No real SMS provider configured — dev/local fallback echoes the code
	// so testing doesn't need a phone at all. Never do this once a provider
	// is set, or the OTP would be pointless as a security check.
	return map[string]interface{}{
		"success":     true,
		"message":     "OTP sent successfully",
		"otp_preview": code,
	}, nil
}

// sendSMSViaFast2SMS delivers the OTP through Fast2SMS's "Quick" route
// (route=q) — the one that doesn't require a DLT-registered sender ID or
// content template, at the cost of using their shared/generic sender
// instead of a custom branded one.
func (s *AuthService) sendSMSViaFast2SMS(ctx context.Context, e164Phone, code string) error {
	digits := strings.TrimPrefix(e164Phone, "+91")
	message := fmt.Sprintf("Your CardFlow OTP is %s. Valid for 5 minutes. Do not share this with anyone.", code)

	reqURL := fmt.Sprintf(
		"https://www.fast2sms.com/dev/bulkV2?authorization=%s&route=q&message=%s&language=english&flash=0&numbers=%s",
		url.QueryEscape(s.cfg.SMSAuthKey),
		url.QueryEscape(message),
		url.QueryEscape(digits),
	)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, reqURL, nil)
	if err != nil {
		return err
	}

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}

	var result struct {
		Return  bool        `json:"return"`
		Message interface{} `json:"message"`
	}
	if err := json.Unmarshal(body, &result); err != nil {
		return fmt.Errorf("unexpected Fast2SMS response: %s", string(body))
	}
	if !result.Return {
		return fmt.Errorf("fast2sms rejected the request: %v", result.Message)
	}
	return nil
}

// VerifyOTP validates the generated OTP, loads/creates the user from PostgreSQL, and issues JWTs.
func (s *AuthService) VerifyOTP(ctx context.Context, rawPhone, otpCode, deviceID, platform, pushToken string) (*TokenPair, error) {
	phone, ok := validator.NormalizePhone(rawPhone)
	if !ok {
		return nil, errors.New("invalid phone number format")
	}

	code := strings.TrimSpace(otpCode)
	if len(code) != 6 {
		return nil, errors.New("OTP must be 6 digits")
	}

	isValid := false

	s.otpMutex.RLock()
	storedCode, exists := s.otpStore[phone]
	s.otpMutex.RUnlock()
	if exists && storedCode == code {
		isValid = true
		s.otpMutex.Lock()
		delete(s.otpStore, phone)
		s.otpMutex.Unlock()
	}

	if !isValid && s.redis != nil && s.redis.Client != nil {
		otpKey := fmt.Sprintf("otp:%s", phone)
		data, err := s.redis.Client.HGetAll(ctx, otpKey).Result()
		if err == nil && len(data) > 0 {
			if data["code"] == code || data["hash"] == s.hashOTP(code) {
				isValid = true
				s.redis.Client.Del(ctx, otpKey)
			}
		}
	}

	if !isValid {
		return nil, errors.New("invalid OTP code. Please enter the 6-digit code")
	}

	user, isNewUser, err := s.resolveUser(ctx, phone)
	if err != nil || user == nil {
		return nil, errors.New("database unavailable — cannot sign in without PostgreSQL")
	}

	if deviceID != "" && s.db != nil && s.db.Pool != nil {
		_, _ = s.db.Pool.Exec(ctx, `
			INSERT INTO devices (user_id, platform, device_id, push_token, last_seen)
			VALUES ($1, $2, $3, $4, NOW())
			ON CONFLICT (user_id, device_id)
			DO UPDATE SET push_token = COALESCE(EXCLUDED.push_token, devices.push_token), last_seen = NOW()
		`, user.ID, platform, deviceID, pushToken)
	}

	tokenPair, err := s.jwt.GenerateTokenPair(user, deviceID)
	if err != nil {
		return nil, err
	}
	tokenPair.IsNewUser = isNewUser
	return tokenPair, nil
}

func (s *AuthService) resolveUser(ctx context.Context, phone string) (*domain.User, bool, error) {
	if s.db == nil || s.db.Pool == nil {
		return nil, false, errors.New("postgresql not connected")
	}

	var u domain.User
	var roleStr, planStr string
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, phone, COALESCE(name, ''), email, photo_url, COALESCE(city, ''), COALESCE(state, ''), country,
		       role::text, plan::text, free_scans_remaining, free_scans_reset_at, status::text, created_at, updated_at,
		       is_subscribed, subscription_plan_id, subscription_expires_at
		FROM users
		WHERE phone = $1 AND deleted_at IS NULL
	`, phone).Scan(
		&u.ID, &u.Phone, &u.Name, &u.Email, &u.PhotoURL, &u.City, &u.State, &u.Country,
		&roleStr, &planStr, &u.FreeScansRemaining, &u.FreeScansResetAt, &u.Status, &u.CreatedAt, &u.UpdatedAt,
		&u.IsSubscribed, &u.SubscriptionPlanID, &u.SubscriptionExpiresAt,
	)

	if err == nil {
		u.Role = domain.UserRole(roleStr)
		u.Plan = domain.SubscriptionPlan(planStr)

		var kycStatus string
		_ = s.db.Pool.QueryRow(ctx, `SELECT aadhaar_status::text FROM user_kyc WHERE user_id = $1`, u.ID).Scan(&kycStatus)
		u.IsIDVerified = kycStatus == "verified"

		_, _ = s.db.Pool.Exec(ctx, `UPDATE users SET last_login_at = NOW() WHERE id = $1`, u.ID)
		return &u, false, nil
	}

	if !errors.Is(err, pgx.ErrNoRows) {
		return nil, false, err
	}

	// New signup — role/plan/name come only from DB defaults (admin is set via SQL, not code)
	newID := uuid.New()
	_, err = s.db.Pool.Exec(ctx, `
		INSERT INTO users (id, phone, name, city, state, role, plan, free_scans_remaining, status)
		VALUES ($1, $2, 'CardFlow User', 'Coimbatore', 'Tamil Nadu', 'user', 'free', 30, 'active')
		ON CONFLICT (phone) DO NOTHING
	`, newID, phone)
	if err != nil {
		return nil, false, err
	}

	err = s.db.Pool.QueryRow(ctx, `
		SELECT id, phone, COALESCE(name, ''), email, photo_url, COALESCE(city, ''), COALESCE(state, ''), country,
		       role::text, plan::text, free_scans_remaining, free_scans_reset_at, status::text, created_at, updated_at,
		       is_subscribed, subscription_plan_id, subscription_expires_at
		FROM users
		WHERE phone = $1 AND deleted_at IS NULL
	`, phone).Scan(
		&u.ID, &u.Phone, &u.Name, &u.Email, &u.PhotoURL, &u.City, &u.State, &u.Country,
		&roleStr, &planStr, &u.FreeScansRemaining, &u.FreeScansResetAt, &u.Status, &u.CreatedAt, &u.UpdatedAt,
		&u.IsSubscribed, &u.SubscriptionPlanID, &u.SubscriptionExpiresAt,
	)
	if err != nil {
		return nil, false, err
	}
	u.Role = domain.UserRole(roleStr)
	u.Plan = domain.SubscriptionPlan(planStr)

	_, _ = s.db.Pool.Exec(ctx, `
		INSERT INTO credit_ledger (user_id, delta, reason, balance_after)
		VALUES ($1, 10, 'signup_bonus', 10)
	`, u.ID)

	u.CreditBalance = 10
	isNew := u.ID == newID || u.Name == "CardFlow User"
	return &u, isNew, nil
}

func (s *AuthService) generate6DigitCode() string {
	n, _ := rand.Int(rand.Reader, big.NewInt(900000))
	return fmt.Sprintf("%06d", n.Int64()+100000)
}

func (s *AuthService) hashOTP(code string) string {
	h := sha256.New()
	h.Write([]byte(code + "cf_salt_2026"))
	return hex.EncodeToString(h.Sum(nil))
}
