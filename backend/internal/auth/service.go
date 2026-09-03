package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"log/slog"
	"math/big"
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

// RequestOTP sends a 6-digit OTP code to the provided phone number
func (s *AuthService) RequestOTP(ctx context.Context, rawPhone string) (string, error) {
	phone, ok := validator.NormalizePhone(rawPhone)
	if !ok {
		return "", errors.New("invalid phone number. Format must be E.164 (e.g., +919876543210)")
	}

	var otpCode string

	// Always generate a fresh 6-digit OTP (no fixed 123456)
	otpCode = s.generate6DigitCode()

	// Store in memory map for fast and robust verification
	s.otpMutex.Lock()
	if s.otpStore == nil {
		s.otpStore = make(map[string]string)
	}
	s.otpStore[phone] = otpCode
	s.otpMutex.Unlock()

	// Store in Redis if connected
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
	res := map[string]interface{}{
		"success":     true,
		"message":     "OTP sent successfully",
		"otp_preview": code,
	}
	return res, nil
}

// VerifyOTP validates the code, resolves the user role, and issues JWT tokens
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

	// 1. Memory OTP store check (generated OTP for this session)
	s.otpMutex.RLock()
	storedCode, exists := s.otpStore[phone]
	s.otpMutex.RUnlock()

	if exists && storedCode == code {
		isValid = true
		s.otpMutex.Lock()
		delete(s.otpStore, phone)
		s.otpMutex.Unlock()
	}

	// 2. Redis OTP store check
	if !isValid && s.redis != nil && s.redis.Client != nil {
		otpKey := fmt.Sprintf("otp:%s", phone)
		data, err := s.redis.Client.HGetAll(ctx, otpKey).Result()
		if err == nil && len(data) > 0 {
			storedHash := data["hash"]
			storedPlain := data["code"]
			if storedPlain == code || storedHash == s.hashOTP(code) {
				isValid = true
				s.redis.Client.Del(ctx, otpKey)
			}
		}
	}

	if !isValid {
		return nil, errors.New("invalid OTP code. Please enter the 6-digit code")
	}

	// Resolve or create user in PostgreSQL / memory
	user, isNewUser, err := s.resolveUser(ctx, phone)
	if err != nil || user == nil {
		user = s.createFallbackDevUser(phone)
		isNewUser = s.isBrandNewFallbackNumber(phone)
	}

	// Register device push token if provided
	if deviceID != "" && s.db != nil && s.db.Pool != nil {
		_, _ = s.db.Pool.Exec(ctx, `
			INSERT INTO devices (user_id, platform, device_id, push_token, last_seen)
			VALUES ($1, $2, $3, $4, NOW())
			ON CONFLICT (user_id, device_id)
			DO UPDATE SET push_token = COALESCE(EXCLUDED.push_token, devices.push_token), last_seen = NOW()
		`, user.ID, platform, deviceID, pushToken)
	}

	// Issue JWT token pair
	tokenPair, err := s.jwt.GenerateTokenPair(user, deviceID)
	if err != nil {
		return nil, err
	}
	tokenPair.IsNewUser = isNewUser

	return tokenPair, nil
}

// GetDeterministicUserID returns a constant, stable UUID for a given phone number
func GetDeterministicUserID(phone string) uuid.UUID {
	p := strings.TrimPrefix(phone, "+91")
	switch p {
	case "6382124970":
		return uuid.MustParse("00000000-0000-0000-0000-0000000000a1")
	case "9999988888":
		return uuid.MustParse("00000000-0000-0000-0000-0000000000a3")
	case "7094310122":
		return uuid.MustParse("00000000-0000-0000-0000-0000000000b1")
	case "9042938108":
		return uuid.MustParse("00000000-0000-0000-0000-0000000000b2")
	case "9876543210":
		return uuid.MustParse("00000000-0000-0000-0000-000000000002")
	case "9677840181":
		return uuid.MustParse("00000000-0000-0000-0000-0000000000a4")
	case "1234567890":
		return uuid.MustParse("00000000-0000-0000-0000-0000000000a5")
	default:
		h := sha1.New()
		h.Write([]byte(phone))
		u, _ := uuid.FromBytes(h.Sum(nil)[:16])
		return u
	}
}

func (s *AuthService) resolveUser(ctx context.Context, phone string) (*domain.User, bool, error) {
	if s.db == nil || s.db.Pool == nil {
		// In-memory fallback if db not connected
		return s.createFallbackDevUser(phone), s.isBrandNewFallbackNumber(phone), nil
	}

	var u domain.User
	var roleStr, planStr string
	err := s.db.Pool.QueryRow(ctx, `
		SELECT id, phone, COALESCE(name, ''), email, photo_url, COALESCE(city, ''), COALESCE(state, ''), country,
		       role::text, plan::text, free_scans_remaining, free_scans_reset_at, status::text, created_at, updated_at
		FROM users
		WHERE phone = $1 AND deleted_at IS NULL
	`, phone).Scan(
		&u.ID, &u.Phone, &u.Name, &u.Email, &u.PhotoURL, &u.City, &u.State, &u.Country,
		&roleStr, &planStr, &u.FreeScansRemaining, &u.FreeScansResetAt, &u.Status, &u.CreatedAt, &u.UpdatedAt,
	)

	if err == nil {
		u.Role = domain.UserRole(roleStr)
		u.Plan = domain.SubscriptionPlan(planStr)

		// Check if ID verified
		var kycStatus string
		_ = s.db.Pool.QueryRow(ctx, `SELECT aadhaar_status::text FROM user_kyc WHERE user_id = $1`, u.ID).Scan(&kycStatus)
		u.IsIDVerified = kycStatus == "verified"

		// Update last login
		_, _ = s.db.Pool.Exec(ctx, `UPDATE users SET last_login_at = NOW() WHERE id = $1`, u.ID)
		return &u, false, nil
	}

	if errors.Is(err, pgx.ErrNoRows) {
		// Create new user with deterministic stable UUID
		newID := GetDeterministicUserID(phone)
		defaultRole := domain.RoleUser
		defaultPlan := domain.PlanFree
		defaultName := "CardFlow User"
		p := strings.TrimPrefix(phone, "+91")

		if p == "6382124970" {
			defaultRole = domain.RoleAdmin
			defaultPlan = domain.PlanPremium
			defaultName = "Ajay"
		} else if p == "7094310122" {
			defaultName = "Raj"
			defaultPlan = domain.PlanPremium
		} else if p == "9042938108" {
			defaultName = "Rashiq"
			defaultPlan = domain.PlanPlus
		} else if p == "9677840181" {
			defaultName = "Dharani"
		}

		_, err := s.db.Pool.Exec(ctx, `
			INSERT INTO users (id, phone, name, city, state, role, plan, free_scans_remaining, status)
			VALUES ($1, $2, $3, 'Coimbatore', 'Tamil Nadu', $4, $5, 30, 'active')
			ON CONFLICT (id) DO UPDATE SET phone = EXCLUDED.phone, name = EXCLUDED.name
		`, newID, phone, defaultName, defaultRole, defaultPlan)
		if err != nil {
			return s.createFallbackDevUser(phone), s.isBrandNewFallbackNumber(phone), nil
		}

		// Add 10 signup bonus credits to ledger
		_, _ = s.db.Pool.Exec(ctx, `
			INSERT INTO credit_ledger (user_id, delta, reason, balance_after)
			VALUES ($1, 10, 'signup_bonus', 10)
		`, newID)

		u = domain.User{
			ID:                 newID,
			Phone:              phone,
			Name:               defaultName,
			City:               "Coimbatore",
			State:              "Tamil Nadu",
			Country:            "IN",
			Role:               defaultRole,
			Plan:               defaultPlan,
			FreeScansRemaining: 30,
			Status:             "active",
			CreditBalance:      10,
			CreatedAt:          time.Now(),
		}
		return &u, true, nil
	}

	return s.createFallbackDevUser(phone), s.isBrandNewFallbackNumber(phone), nil
}

func (s *AuthService) isDevTestAccount(phone string) bool {
	p := strings.TrimPrefix(phone, "+91")
	return p == "6382124970" ||
		p == "7094310122" || p == "9042938108" || p == "9876543210" ||
		p == "9677840181" || p == "1234567890"
}

func (s *AuthService) isBrandNewFallbackNumber(phone string) bool {
	p := strings.TrimPrefix(phone, "+91")
	return !(p == "6382124970" ||
		p == "7094310122" || p == "9042938108" || p == "9876543210" ||
		p == "9677840181" || p == "1234567890")
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

func (s *AuthService) createFallbackDevUser(phone string) *domain.User {
	p := strings.TrimPrefix(phone, "+91")
	role := domain.RoleUser
	plan := domain.PlanFree
	name := "CardFlow User"

	// Only Ajay is admin; everyone else starts as a normal user
	if p == "6382124970" {
		role = domain.RoleAdmin
		plan = domain.PlanPremium
		name = "Ajay"
	} else if p == "7094310122" {
		role = domain.RoleUser
		plan = domain.PlanPremium
		name = "Raj"
	} else if p == "9042938108" {
		role = domain.RoleUser
		plan = domain.PlanPlus
		name = "Rashiq"
	} else if p == "9876543210" {
		role = domain.RoleUser
		plan = domain.PlanPlus
		name = "Suresh Natarajan"
	} else if p == "9677840181" {
		role = domain.RoleUser
		plan = domain.PlanFree
		name = "Dharani"
	} else if p == "1234567890" {
		role = domain.RoleUser
		plan = domain.PlanFree
		name = "Ravi Kumar"
	}

	return &domain.User{
		ID:                 GetDeterministicUserID(phone),
		Phone:              phone,
		Name:               name,
		City:               "Coimbatore",
		State:              "Tamil Nadu",
		Country:            "IN",
		Role:               role,
		Plan:               plan,
		FreeScansRemaining: 30,
		Status:             "active",
		IsIDVerified:       true,
		CreditBalance:      10,
		CreatedAt:          time.Now(),
	}
}
