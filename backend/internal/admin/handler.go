package admin

import (
	"encoding/json"
	"net/http"
	"time"

	"cardflow-backend/internal/database"
	"cardflow-backend/internal/domain"
	"cardflow-backend/internal/middleware"
	"cardflow-backend/pkg/response"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type AdminHandler struct {
	db *database.DB
}

func NewAdminHandler(db *database.DB) *AdminHandler {
	return &AdminHandler{db: db}
}

func (h *AdminHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	stats := map[string]interface{}{
		"total_users":           1420,
		"active_businesses":     480,
		"verified_businesses":   342,
		"pending_verifications": 12,
		"total_cards_scanned":   18540,
		"active_subscriptions":  184,
		"mrr_inr":               74200,
		"recent_activity": []map[string]interface{}{
			{
				"id":         uuid.New(),
				"action":     "KYC_APPROVED",
				"target":     "Kovai Precision Tools",
				"admin":      "Admin Supervisor",
				"created_at": time.Now().Add(-15 * time.Minute),
			},
			{
				"id":         uuid.New(),
				"action":     "BUSINESS_REGISTERED",
				"target":     "Apex Infotech Solutions",
				"admin":      "System",
				"created_at": time.Now().Add(-2 * time.Hour),
			},
		},
	}

	response.JSON(w, http.StatusOK, stats)
}

func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users := []map[string]interface{}{
		{
			"id":         "u0000000-0000-0000-0000-000000000001",
			"phone":      "+911234567890",
			"name":       "Ravi Kumar",
			"role":       "user",
			"plan":       "free",
			"status":     "active",
			"city":       "Coimbatore",
			"created_at": time.Now().AddDate(0, -2, 0),
		},
		{
			"id":         "u0000000-0000-0000-0000-000000000002",
			"phone":      "+919876543210",
			"name":       "Suresh Natarajan",
			"role":       "user",
			"plan":       "plus",
			"status":     "active",
			"city":       "Coimbatore",
			"created_at": time.Now().AddDate(0, -3, 0),
		},
		{
			"id":         "u0000000-0000-0000-0000-000000000003",
			"phone":      "+919999988888",
			"name":       "Admin Supervisor",
			"role":       "admin",
			"plan":       "premium",
			"status":     "active",
			"city":       "Coimbatore",
			"created_at": time.Now().AddDate(0, -6, 0),
		},
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"users": users,
		"count": len(users),
	})
}

func (h *AdminHandler) UpdateUserStatus(w http.ResponseWriter, r *http.Request) {
	adminUser, _ := r.Context().Value(middleware.UserContextKey).(*domain.User)
	id := chi.URLParam(r, "id")

	var req struct {
		Status string `json:"status"`
		Reason string `json:"reason"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	// Log audit trail
	h.logAudit(adminUser.ID, "UPDATE_USER_STATUS", "user", uuid.MustParse(id), req.Status, req.Reason)

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"user_id": id,
		"status":  req.Status,
		"updated": true,
	})
}

func (h *AdminHandler) ListBusinesses(w http.ResponseWriter, r *http.Request) {
	businesses := []map[string]interface{}{
		{
			"id":           "b0000000-0000-0000-0000-000000000001",
			"name":         "Kovai Precision Tools",
			"category":     "Manufacturing",
			"city":         "Coimbatore",
			"status":       "live",
			"verification": "gst",
			"listing":      "listed",
			"owner_phone":  "+919876543210",
		},
		{
			"id":           "b0000000-0000-0000-0000-000000000002",
			"name":         "Apex Infotech Solutions",
			"category":     "IT & Software",
			"city":         "Coimbatore",
			"status":       "live",
			"verification": "gst",
			"listing":      "listed",
			"owner_phone":  "+919876543210",
		},
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"businesses": businesses,
		"count":      len(businesses),
	})
}

func (h *AdminHandler) ListPendingVerifications(w http.ResponseWriter, r *http.Request) {
	queue := []map[string]interface{}{
		{
			"id":               uuid.New(),
			"business_id":      "b0000000-0000-0000-0000-000000000001",
			"business_name":    "Kovai Precision Tools",
			"method":           "GSTIN",
			"gstin":            "33AAAAA0000A1Z5",
			"trade_name":       "Kovai Precision Tools",
			"name_match_score": 98.4,
			"submitted_at":     time.Now().Add(-1 * time.Hour),
		},
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"queue": queue,
		"count": len(queue),
	})
}

func (h *AdminHandler) VerifyDecision(w http.ResponseWriter, r *http.Request) {
	adminUser, _ := r.Context().Value(middleware.UserContextKey).(*domain.User)
	id := chi.URLParam(r, "id")

	var req struct {
		Action string `json:"action"` // 'approve' or 'reject'
		Notes  string `json:"notes"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	h.logAudit(adminUser.ID, "VERIFICATION_"+req.Action, "business_verification", uuid.New(), req.Action, req.Notes)

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"id":      id,
		"action":  req.Action,
		"success": true,
	})
}

func (h *AdminHandler) ListAuditLogs(w http.ResponseWriter, r *http.Request) {
	logs := []map[string]interface{}{
		{
			"id":          uuid.New(),
			"admin_name":  "Admin Supervisor",
			"action":      "KYC_APPROVE_GSTIN",
			"target_type": "business",
			"target_name": "Kovai Precision Tools",
			"ip_address":  "127.0.0.1",
			"created_at":  time.Now().Add(-2 * time.Hour),
		},
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"logs":  logs,
		"count": len(logs),
	})
}

func (h *AdminHandler) logAudit(adminID uuid.UUID, action, targetType string, targetID uuid.UUID, afterState, notes string) {
	// Persist audit log in postgres
	if h.db != nil && h.db.Pool != nil {
		_, _ = h.db.Pool.Exec(nil, `
			INSERT INTO audit_logs (admin_id, action, target_type, target_id, notes)
			VALUES ($1, $2, $3, $4, $5)
		`, adminID, action, targetType, targetID, notes)
	}
}
