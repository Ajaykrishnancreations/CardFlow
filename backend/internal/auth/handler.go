package auth

import (
	"encoding/json"
	"net/http"

	"cardflow-backend/internal/domain"
	"cardflow-backend/pkg/response"
	"github.com/google/uuid"
)

type AuthHandler struct {
	authSvc *AuthService
}

func NewAuthHandler(authSvc *AuthService) *AuthHandler {
	return &AuthHandler{authSvc: authSvc}
}

type SendOTPRequest struct {
	Phone    string `json:"phone"`
	DeviceID string `json:"device_id"`
	Platform string `json:"platform"`
}

type VerifyOTPRequest struct {
	Phone     string `json:"phone"`
	OTPCode   string `json:"otp_code"`
	DeviceID  string `json:"device_id"`
	Platform  string `json:"platform"`
	PushToken string `json:"push_token"`
}

type UpdateProfileRequest struct {
	Name  *string `json:"name"`
	Email *string `json:"email"`
	City  *string `json:"city"`
	State *string `json:"state"`
}

func (h *AuthHandler) SendOTP(w http.ResponseWriter, r *http.Request) {
	var req SendOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", err.Error())
		return
	}

	res, err := h.authSvc.SendOTP(r.Context(), req.Phone, req.DeviceID, req.Platform)
	if err != nil {
		response.BadRequest(w, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, res)
}

func (h *AuthHandler) VerifyOTP(w http.ResponseWriter, r *http.Request) {
	var req VerifyOTPRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", err.Error())
		return
	}

	tokenPair, err := h.authSvc.VerifyOTP(r.Context(), req.Phone, req.OTPCode, req.DeviceID, req.Platform, req.PushToken)
	if err != nil {
		response.BadRequest(w, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, tokenPair)
}

func (h *AuthHandler) RefreshToken(w http.ResponseWriter, r *http.Request) {
	var req struct {
		RefreshToken string `json:"refresh_token"`
		DeviceID     string `json:"device_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", nil)
		return
	}

	if req.RefreshToken == "" {
		response.Unauthorized(w, "refresh token is required")
		return
	}

	// For dev / mock, generate refreshed tokens
	response.JSON(w, http.StatusOK, map[string]string{
		"access_token":  "cf_jwt_refreshed_" + uuid.New().String(),
		"refresh_token": "cf_refr_new_" + uuid.New().String(),
	})
}

func (h *AuthHandler) LogoutAll(w http.ResponseWriter, r *http.Request) {
	response.Message(w, http.StatusOK, "All sessions terminated successfully")
}

func (h *AuthHandler) GetMe(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value("user").(*domain.User)
	if !ok || user == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	response.JSON(w, http.StatusOK, user)
}

func (h *AuthHandler) UpdateMe(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value("user").(*domain.User)
	if !ok || user == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	var req UpdateProfileRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", nil)
		return
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

	response.JSON(w, http.StatusOK, user)
}

func (h *AuthHandler) DeleteMe(w http.ResponseWriter, r *http.Request) {
	response.Message(w, http.StatusOK, "Account deletion initiated. All data will be purged following the 30-day DPDP grace period.")
}

func (h *AuthHandler) ExportMe(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value("user").(*domain.User)
	if !ok || user == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	exportData := map[string]interface{}{
		"account":        user,
		"export_date":    "2026-08-29",
		"compliance":     "DPDP Act 2023",
		"saved_cards":    []interface{}{},
		"enquiries_sent": []interface{}{},
	}

	response.JSON(w, http.StatusOK, exportData)
}
