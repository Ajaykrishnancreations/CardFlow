package auth

import (
	"context"
	"fmt"
	"strings"
	"time"

	"cardflow-backend/internal/domain"
	"cardflow-backend/pkg/validator"
	"github.com/google/uuid"
)

func (s *AuthService) UpdateUserProfile(ctx context.Context, user *domain.User, req UpdateProfileRequest) (*domain.User, error) {
	if user == nil {
		return nil, fmt.Errorf("user required")
	}

	if req.Name != nil {
		user.Name = *req.Name
	}
	if req.Email != nil {
		user.Email = req.Email
	}
	if req.City != nil {
		user.City = *req.City
	}
	if req.State != nil {
		user.State = *req.State
	}
	user.UpdatedAt = time.Now()

	if s.db != nil && s.db.Pool != nil {
		_, err := s.db.Pool.Exec(ctx, `
			UPDATE users
			SET name = $2, email = $3, city = $4, state = $5, updated_at = NOW()
			WHERE id = $1 AND deleted_at IS NULL
		`, user.ID, user.Name, user.Email, user.City, user.State)
		if err != nil {
			return nil, err
		}
	}

	return user, nil
}

// ChangePhone updates the caller's own mobile number after verifying an OTP
// sent to the new number — unlike VerifyOTP (login), this never resolves or
// creates a different account; it only ever touches the caller's own row.
func (s *AuthService) ChangePhone(ctx context.Context, user *domain.User, rawPhone, otpCode string) (*domain.User, error) {
	if user == nil {
		return nil, fmt.Errorf("user required")
	}

	phone, ok := validator.NormalizePhone(rawPhone)
	if !ok {
		return nil, fmt.Errorf("invalid phone number format")
	}

	code := strings.TrimSpace(otpCode)
	if len(code) != 6 {
		return nil, fmt.Errorf("OTP must be 6 digits")
	}
	if !s.validateOTP(ctx, phone, code) {
		return nil, fmt.Errorf("invalid OTP code. Please enter the 6-digit code")
	}

	if s.db != nil && s.db.Pool != nil {
		var existingID uuid.UUID
		err := s.db.Pool.QueryRow(ctx, `SELECT id FROM users WHERE phone = $1 AND deleted_at IS NULL`, phone).Scan(&existingID)
		if err == nil && existingID != user.ID {
			return nil, fmt.Errorf("this mobile number is already linked to another account")
		}

		if _, err := s.db.Pool.Exec(ctx, `
			UPDATE users SET phone = $2, updated_at = NOW() WHERE id = $1 AND deleted_at IS NULL
		`, user.ID, phone); err != nil {
			return nil, err
		}
	}

	user.Phone = phone
	user.UpdatedAt = time.Now()
	return user, nil
}
