package admin

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"cardflow-backend/internal/domain"
	"cardflow-backend/internal/middleware"
	"github.com/google/uuid"
)

func TestAdminAuthorizationMiddleware(t *testing.T) {
	appMiddleware := middleware.NewMiddleware(nil, nil)

	handlerToTest := appMiddleware.RequireAdmin(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ADMIN_GRANTED"))
	}))

	// Case 1: Normal User calling Admin endpoint -> Must get 403 Forbidden
	normalUser := &domain.User{
		ID:    uuid.New(),
		Phone: "+911234567890",
		Role:  domain.RoleUser,
	}

	reqUser := httptest.NewRequest("GET", "/api/v1/admin/dashboard", nil)
	reqUser = reqUser.WithContext(context.WithValue(reqUser.Context(), middleware.UserContextKey, normalUser))
	wUser := httptest.NewRecorder()

	handlerToTest.ServeHTTP(wUser, reqUser)
	if wUser.Code != http.StatusForbidden {
		t.Errorf("Expected 403 Forbidden for normal user, got %d", wUser.Code)
	}

	// Case 2: Admin User calling Admin endpoint -> Must get 200 OK
	adminUser := &domain.User{
		ID:    uuid.New(),
		Phone: "+919999988888",
		Role:  domain.RoleAdmin,
	}

	reqAdmin := httptest.NewRequest("GET", "/api/v1/admin/dashboard", nil)
	reqAdmin = reqAdmin.WithContext(context.WithValue(reqAdmin.Context(), middleware.UserContextKey, adminUser))
	wAdmin := httptest.NewRecorder()

	handlerToTest.ServeHTTP(wAdmin, reqAdmin)
	if wAdmin.Code != http.StatusOK {
		t.Errorf("Expected 200 OK for admin user, got %d", wAdmin.Code)
	}
}
