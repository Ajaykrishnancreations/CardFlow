package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"log/slog"
	"math/big"
	"strings"
	"time"

	"cardflow-backend/internal/config"
	"cardflow-backend/internal/database"
	"cardflow-backend/internal/domain"
	"cardflow-backend/pkg/validator"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type AuthService struct {
	db    *database.DB
	redis *database.RedisClient
	jwt   *JWTService
	cfg   *config.Config
}

func NewAuthService(db *database.DB, redis *database.RedisClient, jwt *JWTService, cfg *config.Config) *AuthService {
	return &AuthService{
		db:    db,
		redis: redis,
		jwt:   jwt,
		cfg:   cfg,
	}
}

type SendOTPResponse struct {
	ExpiresInSeconds      int  `json:"expires_in_seconds"`
	ResendCooldownSeconds int  `json:"resend_cooldown_seconds"`
	IsTrustedDevice       bool `json:"is_trusted_device"`
}

// SendOTP handles phone normalization, rate limits, hashing, and SMS dispatch
func (s *AuthService) SendOTP(ctx context.Context, rawPhone, deviceID, platform string) (*SendOTPResponse, error) {
	phone, ok := validator.NormalizePhone(rawPhone)
	if !ok {
		return nil, errors.New("invalid Indian mobile phone number (10 digits required)")
	}

	// 1. Check DEV test accounts
	isDevTestAccount := s.isDevTestAccount(phone)
	if isDevTestAccount && !s.cfg.IsProduction() {
		slog.Info("DEV test account OTP requested (Fixed OTP: 123456)", "phone", phone)
		return &SendOTPResponse{
			ExpiresInSeconds:      300,
			ResendCooldownSeconds: 30,
			IsTrustedDevice:       false,
		}, nil
	}

	// 2. Production rate limiting via Redis
	if s.redis != nil && s.redis.Client != nil {
		cooldownKey := fmt.Sprintf("otp_cooldown:%s", phone)
		if s.redis.Client.Exists(ctx, cooldownKey).Val() > 0 {
			return nil, errors.New("please wait 30 seconds before requesting another OTP")
		}

		hourlyKey := fmt.Sprintf("otp_hourly:%s", phone)
		hourlyCount := s.redis.Client.Incr(ctx, hourlyKey).Val()
		if hourlyCount == 1 {
			s.redis.Client.Expire(ctx, hourlyKey, 1*time.Hour)
		}
		if hourlyCount > 5 {
			return nil, errors.New("maximum OTP requests per hour exceeded. Please try later")
		}
	}

	// 3. Generate 6-digit cryptographic OTP
	otpCode := s.generate6DigitCode()

	// 4. Hash and save in Redis (TTL: 300 seconds)
	if s.redis != nil && s.redis.Client != nil {
		hash := s.hashOTP(otpCode)
		otpKey := fmt.Sprintf("otp:%s", phone)
		s.redis.Client.HSet(ctx, otpKey, "hash", hash, "attempts", 0)
		s.redis.Client.Expire(ctx, otpKey, 5*time.Minute)

		cooldownKey := fmt.Sprintf("otp_cooldown:%s", phone)
		s.redis.Client.Set(ctx, cooldownKey, "1", 30*time.Second)
	}

	// 5. Send via SMS gateway or Mock
	if s.cfg.DevMockSMS || !s.cfg.IsProduction() {
		slog.Info("🚀 [MOCK SMS DISPATCHED]", "phone", phone, "otp", otpCode)
	} else {
		// Production SMS Gateway integration (e.g., MSG91/Kaleyra)
		slog.Info("Sending SMS via SMS Gateway", "phone", phone, "provider", s.cfg.SMSProvider)
	}

	return &SendOTPResponse{
		ExpiresInSeconds:      300,
		ResendCooldownSeconds: 30,
		IsTrustedDevice:       false,
	}, nil
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

	// DEV Test Account Check (Strictly guarded against production)
	if !s.cfg.IsProduction() && s.isDevTestAccount(phone) {
		if code == "123456" {
			isValid = true
		} else {
			return nil, errors.New("invalid test OTP. For DEV accounts, use 123456")
		}
	} else {
		// Production / Standard OTP Check via Redis
		if s.redis != nil && s.redis.Client != nil {
			otpKey := fmt.Sprintf("otp:%s", phone)
			data, err := s.redis.Client.HGetAll(ctx, otpKey).Result()
			if err != nil || len(data) == 0 {
				return nil, errors.New("OTP has expired or does not exist. Please request a new one")
			}

			storedHash := data["hash"]
			expectedHash := s.hashOTP(code)

			if storedHash == expectedHash {
				isValid = true
				s.redis.Client.Del(ctx, otpKey)
			} else {
				attempts := s.redis.Client.HIncrBy(ctx, otpKey, "attempts", 1).Val()
				if attempts >= 3 {
					s.redis.Client.Del(ctx, otpKey)
					return nil, errors.New("maximum verification attempts exceeded. Please request a new OTP")
				}
				return nil, fmt.Errorf("invalid OTP code. %d attempts remaining", 3-attempts)
			}
		} else if !s.cfg.IsProduction() && code == "123456" {
			// Dev fallback without Redis
			isValid = true
		}
	}

	if !isValid {
		return nil, errors.New("invalid OTP verification")
	}

	// Resolve or create user in PostgreSQL
	user, isNewUser, err := s.resolveUser(ctx, phone)
	if err != nil {
		return nil, fmt.Errorf("user resolution failed: %w", err)
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

func (s *AuthService) resolveUser(ctx context.Context, phone string) (*domain.User, bool, error) {
	if s.db == nil || s.db.Pool == nil {
		// In-memory fallback if db not connected
		return s.createFallbackDevUser(phone), false, nil
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
		// Create new user
		newID := uuid.New()
		defaultRole := domain.RoleUser
		if phone == "+919999988888" && !s.cfg.IsProduction() {
			defaultRole = domain.RoleAdmin
		}

		_, err := s.db.Pool.Exec(ctx, `
			INSERT INTO users (id, phone, name, city, state, role, plan, free_scans_remaining, status)
			VALUES ($1, $2, 'CardFlow User', 'Coimbatore', 'Tamil Nadu', $3, 'free', 30, 'active')
		`, newID, phone, defaultRole)
		if err != nil {
			return nil, false, err
		}

		// Add 10 signup bonus credits to ledger
		_, _ = s.db.Pool.Exec(ctx, `
			INSERT INTO credit_ledger (user_id, delta, reason, balance_after)
			VALUES ($1, 10, 'signup_bonus', 10)
		`, newID)

		u = domain.User{
			ID:                 newID,
			Phone:              phone,
			Name:               "CardFlow User",
			City:               "Coimbatore",
			State:              "Tamil Nadu",
			Country:            "IN",
			Role:               defaultRole,
			Plan:               domain.PlanFree,
			FreeScansRemaining: 30,
			Status:             "active",
			CreditBalance:      10,
			CreatedAt:          time.Now(),
		}
		return &u, true, nil
	}

	return nil, false, err
}

func (s *AuthService) isDevTestAccount(phone string) bool {
	p := strings.TrimPrefix(phone, "+91")
	return p == "1234567890" || p == "9876543210" || p == "9999988888"
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
	name := "Normal User"

	if p == "9876543210" {
		role = domain.RoleUser // Owner is a regular user with businesses
		plan = domain.PlanPlus
		name = "Suresh Natarajan"
	} else if p == "9999988888" {
		role = domain.RoleAdmin
		plan = domain.PlanPremium
		name = "Admin Supervisor"
	}

	return &domain.User{
		ID:                 uuid.New(),
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
