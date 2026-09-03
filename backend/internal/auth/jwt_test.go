package auth

import (
	"context"
	"testing"

	"cardflow-backend/internal/config"
	"cardflow-backend/internal/domain"
	"github.com/google/uuid"
)

func TestJWTGenerationAndValidation(t *testing.T) {
	cfg := &config.Config{
		JWTPrivateKey:      "test-secret-key-for-unit-testing-32-bytes",
		JWTIssuer:          "cardflow.test",
		JWTAccessExpiryMin: 15,
	}

	jwtSvc := NewJWTService(cfg)

	user := &domain.User{
		ID:    uuid.New(),
		Phone: "+919876543210",
		Role:  domain.RoleUser,
		Plan:  domain.PlanPlus,
	}

	pair, err := jwtSvc.GenerateTokenPair(user, "dev-device-123")
	if err != nil {
		t.Fatalf("Failed to generate token pair: %v", err)
	}

	if pair.AccessToken == "" || pair.RefreshToken == "" {
		t.Fatal("Expected non-empty token pair")
	}

	claims, err := jwtSvc.ValidateAccessToken(pair.AccessToken)
	if err != nil {
		t.Fatalf("Failed to validate access token: %v", err)
	}

	if claims.UserID != user.ID.String() {
		t.Errorf("Expected UserID %s, got %s", user.ID.String(), claims.UserID)
	}
	if claims.Role != string(domain.RoleUser) {
		t.Errorf("Expected Role %s, got %s", domain.RoleUser, claims.Role)
	}
}

func TestGeneratedOTPOnly(t *testing.T) {
	cfg := &config.Config{
		Env:           "development",
		JWTPrivateKey: "secret",
		DevMockSMS:    true,
	}
	authSvc := NewAuthService(nil, nil, NewJWTService(cfg), cfg)

	preview, err := authSvc.RequestOTP(context.Background(), "9876543210")
	if err != nil {
		t.Fatalf("RequestOTP failed: %v", err)
	}
	if len(preview) != 6 {
		t.Fatalf("expected 6-digit OTP preview, got %q", preview)
	}

	// Fixed 123456 must not succeed when it is not the generated code
	if preview != "123456" {
		_, errFixed := authSvc.VerifyOTP(context.Background(), "9876543210", "123456", "device1", "web", "")
		if errFixed == nil {
			t.Fatal("SECURITY FAILURE: fixed OTP 123456 must not succeed")
		}
		// Request again because failed verify does not consume; still same store entry
	}

	pair, err := authSvc.VerifyOTP(context.Background(), "9876543210", preview, "device1", "web", "")
	if err != nil {
		t.Fatalf("Expected generated OTP to succeed: %v", err)
	}
	if pair.User.Phone != "+919876543210" {
		t.Errorf("Expected phone +919876543210, got %s", pair.User.Phone)
	}
}
