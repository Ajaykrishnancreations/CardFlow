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

func TestDevTestAccountGuard(t *testing.T) {
	cfgDev := &config.Config{
		Env:           "development",
		JWTPrivateKey: "secret",
	}
	authSvcDev := NewAuthService(nil, nil, NewJWTService(cfgDev), cfgDev)

	// In DEV, fixed OTP 123456 must succeed
	pairDev, err := authSvcDev.VerifyOTP(context.Background(), "9876543210", "123456", "device1", "web", "")
	if err != nil {
		t.Fatalf("Expected dev OTP to succeed in development: %v", err)
	}
	if pairDev.User.Phone != "+919876543210" {
		t.Errorf("Expected phone +919876543210, got %s", pairDev.User.Phone)
	}

	// In PRODUCTION, fixed OTP must FAIL (Dev test account guard)
	cfgProd := &config.Config{
		Env:           "production",
		JWTPrivateKey: "secret",
	}
	authSvcProd := NewAuthService(nil, nil, NewJWTService(cfgProd), cfgProd)
	_, errProd := authSvcProd.VerifyOTP(context.Background(), "9876543210", "123456", "device1", "web", "")
	if errProd == nil {
		t.Fatal("SECURITY FAILURE: Fixed dev OTP must NEVER succeed when ENV=production")
	}
	t.Logf("Verified dev OTP was rejected in production: %v", errProd)
}
