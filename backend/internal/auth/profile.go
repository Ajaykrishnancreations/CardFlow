package auth

import (
	"context"
	"fmt"
	"time"

	"cardflow-backend/internal/domain"
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
