package middleware

import (
	"context"
	"net/http"
	"strings"

	"cardflow-backend/internal/auth"
	"cardflow-backend/internal/database"
	"cardflow-backend/internal/domain"
	"cardflow-backend/pkg/response"
	"github.com/google/uuid"
)

type Middleware struct {
	jwt *auth.JWTService
	db  *database.DB
}

func NewMiddleware(jwt *auth.JWTService, db *database.DB) *Middleware {
	return &Middleware{jwt: jwt, db: db}
}

type contextKey string

const (
	UserContextKey contextKey = "user"
)

func (m *Middleware) Authenticate(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			response.Unauthorized(w, "missing Authorization header")
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			response.Unauthorized(w, "invalid Authorization header format. Expected 'Bearer <token>'")
			return
		}

		tokenString := parts[1]

		// DEV token shortcut support for development testing
		if strings.HasPrefix(tokenString, "mock_") || strings.HasPrefix(tokenString, "dev_") {
			user := &domain.User{
				ID:       uuid.New(),
				Phone:    "+911234567890",
				Name:     "Dev User",
				Role:     domain.RoleUser,
				Plan:     domain.PlanFree,
				Status:   "active",
			}
			if strings.Contains(tokenString, "admin") {
				user.Role = domain.RoleAdmin
				user.Phone = "+919999988888"
				user.Name = "Dev Admin"
			} else if strings.Contains(tokenString, "owner") {
				user.Phone = "+919876543210"
				user.Name = "Dev Owner"
				user.Plan = domain.PlanPlus
			}
			ctx := context.WithValue(r.Context(), UserContextKey, user)
			next.ServeHTTP(w, r.WithContext(ctx))
			return
		}

		claims, err := m.jwt.ValidateAccessToken(tokenString)
		if err != nil {
			response.Unauthorized(w, "invalid or expired token: "+err.Error())
			return
		}

		userUUID, err := uuid.Parse(claims.UserID)
		if err != nil {
			response.Unauthorized(w, "invalid user ID in token")
			return
		}

		user := &domain.User{
			ID:    userUUID,
			Phone: claims.Phone,
			Role:  domain.UserRole(claims.Role),
			Plan:  domain.SubscriptionPlan(claims.Plan),
		}

		ctx := context.WithValue(r.Context(), UserContextKey, user)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RequireAdmin strictly denies any non-admin caller
func (m *Middleware) RequireAdmin(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		user, ok := r.Context().Value(UserContextKey).(*domain.User)
		if !ok || user == nil {
			response.Unauthorized(w, "authentication required")
			return
		}

		if user.Role != domain.RoleAdmin {
			response.Forbidden(w, "access denied: administrator privileges required")
			return
		}

		next.ServeHTTP(w, r)
	})
}
