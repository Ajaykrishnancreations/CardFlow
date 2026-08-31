package auth

import (
	"context"
	"crypto/rand"
	"crypto/sha1"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
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
	cfg   *config.Config
	db    *database.DB
	redis *database.RedisClient
	jwt   *JWTService
}

func NewAuthService(db *database.DB, redis *database.RedisClient, jwt *JWTService, cfg *config.Config) *AuthService {
	return &AuthService{
		cfg:   cfg,
		db:    db,
		redis: redis,
		jwt:   jwt,
	}
}

// RequestOTP sends a 6-digit OTP code to the provided phone number
func (s *AuthService) RequestOTP(ctx context.Context, rawPhone string) (string, error) {
	phone, ok := validator.NormalizePhone(rawPhone)
	if !ok {
		return "", errors.New("invalid phone number. Format must be E.164 (e.g., +919876543210)")
	}

	// DEV / Mock SMS Mode
	if !s.cfg.IsProduction() && (s.cfg.DevMockSMS || s.isDevTestAccount(phone)) {
		otpCode := "123456"
		return otpCode, nil
	}

	// Production Flow: Check Rate Limits
	if s.redis != nil && s.redis.Client != nil {
		reqCountKey := fmt.Sprintf("otp_rate:%s", phone)
		count, err := s.redis.Client.Incr(ctx, reqCountKey).Result()
		if err == nil && count == 1 {
			s.redis.Client.Expire(ctx, reqCountKey, 10*time.Minute)
		}
		if count > 5 {
			return "", errors.New("too many OTP requests. Please wait 10 minutes")
		}

		otpCode := s.generate6DigitCode()
		otpHash := s.hashOTP(otpCode)

		otpKey := fmt.Sprintf("otp:%s", phone)
		err = s.redis.Client.HSet(ctx, otpKey, map[string]interface{}{
			"hash":     otpHash,
			"attempts": 0,
		}).Err()
		if err != nil {
			return "", fmt.Errorf("failed to save OTP: %w", err)
		}
		s.redis.Client.Expire(ctx, otpKey, 5*time.Minute)

		return otpCode, nil
	}

	return "123456", nil
}

func (s *AuthService) SendOTP(ctx context.Context, rawPhone, deviceID, platform string) (map[string]interface{}, error) {
	code, err := s.RequestOTP(ctx, rawPhone)
	if err != nil {
		return nil, err
	}
	res := map[string]interface{}{
		"success": true,
		"message": "OTP sent successfully",
	}
	if !s.cfg.IsProduction() {
		res["otp_preview"] = code
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

	// DEV / Mock SMS Mode (Strictly guarded against production)
	if !s.cfg.IsProduction() && (s.cfg.DevMockSMS || s.isDevTestAccount(phone)) {
		if code == "123456" {
			isValid = true
		} else {
			return nil, errors.New("invalid test OTP. For testing, use 123456")
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

// GetDeterministicUserID returns a constant, stable UUID for a given phone number
func GetDeterministicUserID(phone string) uuid.UUID {
	p := strings.TrimPrefix(phone, "+91")
	switch p {
	case "6382124970":
		return uuid.MustParse("00000000-0000-0000-0000-0000000000a1")
	case "9008722766":
		return uuid.MustParse("00000000-0000-0000-0000-0000000000a2")
	case "9999988888":
		return uuid.MustParse("00000000-0000-0000-0000-0000000000a3")
	case "7094310122":
		return uuid.MustParse("00000000-0000-0000-0000-0000000000b1")
	case "9042938108":
		return uuid.MustParse("00000000-0000-0000-0000-0000000000b2")
	case "9876543210":
		return uuid.MustParse("00000000-0000-0000-0000-000000000002")
	case "9677840181":
		return uuid.MustParse("00000000-0000-0000-0000-0000000000u1")
	case "1234567890":
		return uuid.MustParse("00000000-0000-0000-0000-0000000000u2")
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

		if (p == "6382124970" || p == "9008722766" || p == "9999988888") && !s.cfg.IsProduction() {
			defaultRole = domain.RoleAdmin
			defaultPlan = domain.PlanPremium
			if p == "6382124970" {
				defaultName = "Ajay"
			} else if p == "9008722766" {
				defaultName = "Govardhan"
			}
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

	return nil, false, err
}

func (s *AuthService) isDevTestAccount(phone string) bool {
	p := strings.TrimPrefix(phone, "+91")
	return p == "6382124970" || p == "9008722766" || p == "9999988888" ||
		p == "7094310122" || p == "9042938108" || p == "9876543210" ||
		p == "9677840181" || p == "1234567890"
}

func (s *AuthService) isBrandNewFallbackNumber(phone string) bool {
	p := strings.TrimPrefix(phone, "+91")
	return !(p == "6382124970" || p == "9008722766" || p == "9999988888" ||
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

	// Admin accounts
	if p == "6382124970" {
		role = domain.RoleAdmin
		plan = domain.PlanPremium
		name = "Ajay"
	} else if p == "9008722766" {
		role = domain.RoleAdmin
		plan = domain.PlanPremium
		name = "Govardhan"
	} else if p == "9999988888" {
		role = domain.RoleAdmin
		plan = domain.PlanPremium
		name = "Admin Supervisor"
	// Business Owner accounts
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
	// Normal User accounts
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
