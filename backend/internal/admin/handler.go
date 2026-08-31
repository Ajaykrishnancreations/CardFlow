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
				"target":     "Raj Engineering Works",
				"admin":      "Ajay",
				"created_at": time.Now().Add(-15 * time.Minute),
			},
			{
				"id":         uuid.New(),
				"action":     "FREE_ACCESS_GRANTED",
				"target":     "Rashiq Trading (1 Year Free)",
				"admin":      "Govardhan",
				"created_at": time.Now().Add(-45 * time.Minute),
			},
			{
				"id":         uuid.New(),
				"action":     "BUSINESS_REGISTERED",
				"target":     "Kovai Precision Tools",
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
			"id":             "00000000-0000-0000-0000-0000000000a1",
			"phone":          "+916382124970",
			"name":           "Ajay",
			"role":           "admin",
			"plan":           "premium",
			"status":         "active",
			"city":           "Coimbatore",
			"access_period":  "Lifetime Admin Access",
			"created_at":     time.Now().AddDate(0, -6, 0),
		},
		{
			"id":             "00000000-0000-0000-0000-0000000000a2",
			"phone":          "+919008722766",
			"name":           "Govardhan",
			"role":           "admin",
			"plan":           "premium",
			"status":         "active",
			"city":           "Bengaluru",
			"access_period":  "Lifetime Admin Access",
			"created_at":     time.Now().AddDate(0, -6, 0),
		},
		{
			"id":             "00000000-0000-0000-0000-0000000000b3",
			"phone":          "+917094310122",
			"name":           "Raj",
			"role":           "user",
			"plan":           "premium",
			"status":         "active",
			"city":           "Coimbatore",
			"access_period":  "1 Year Free Premium",
			"business_name":  "Raj Engineering Works",
			"created_at":     time.Now().AddDate(0, -3, 0),
		},
		{
			"id":             "00000000-0000-0000-0000-0000000000b4",
			"phone":          "+919042938108",
			"name":           "Rashiq",
			"role":           "user",
			"plan":           "plus",
			"status":         "active",
			"city":           "Coimbatore",
			"access_period":  "6 Months Free Plus",
			"business_name":  "Rashiq Trading & Logistics",
			"created_at":     time.Now().AddDate(0, -2, 0),
		},
		{
			"id":             "00000000-0000-0000-0000-0000000000u4",
			"phone":          "+919677840181",
			"name":           "Dharani",
			"role":           "user",
			"plan":           "free",
			"status":         "active",
			"city":           "Coimbatore",
			"access_period":  "Standard Free User",
			"created_at":     time.Now().AddDate(0, -1, 0),
		},
		{
			"id":             "00000000-0000-0000-0000-000000000002",
			"phone":          "+919876543210",
			"name":           "Suresh Natarajan",
			"role":           "user",
			"plan":           "plus",
			"status":         "active",
			"city":           "Coimbatore",
			"access_period":  "Active Subscriber",
			"business_name":  "Kovai Precision Tools",
			"created_at":     time.Now().AddDate(0, -4, 0),
		},
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"users": users,
		"count": len(users),
	})
}

func (h *AdminHandler) GrantFreeAccess(w http.ResponseWriter, r *http.Request) {
	adminUser, _ := r.Context().Value(middleware.UserContextKey).(*domain.User)

	var req struct {
		UserID   string `json:"user_id"`
		Phone    string `json:"phone"`
		Plan     string `json:"plan"`     // 'plus' or 'premium'
		Duration string `json:"duration"` // '6_months', '1_year', 'lifetime'
		Notes    string `json:"notes"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request", err.Error())
		return
	}

	h.logAudit(adminUser.ID, "GRANT_FREE_ACCESS", "user_subscription", uuid.New(), req.Plan+" ("+req.Duration+")", req.Notes)

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"success":       true,
		"user_id":       req.UserID,
		"phone":         req.Phone,
		"plan":          req.Plan,
		"duration":      req.Duration,
		"message":       "Free access granted successfully for " + req.Duration,
		"granted_by":    adminUser.Name,
		"granted_at":    time.Now(),
	})
}

func (h *AdminHandler) CreateBusinessManual(w http.ResponseWriter, r *http.Request) {
	adminUser, _ := r.Context().Value(middleware.UserContextKey).(*domain.User)

	var req struct {
		OwnerPhone     string   `json:"owner_phone"`
		OwnerName      string   `json:"owner_name"`
		BusinessName   string   `json:"business_name"`
		Category       string   `json:"category"`
		City           string   `json:"city"`
		Address        string   `json:"address"`
		Services       []string `json:"services"`
		FreeAccessPlan string   `json:"free_access_plan"` // '6_months', '1_year', 'lifetime'
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request", err.Error())
		return
	}

	newBizID := uuid.New()
	h.logAudit(adminUser.ID, "ADMIN_CREATE_BUSINESS", "business", newBizID, req.BusinessName, "Created with "+req.FreeAccessPlan+" access")

	response.JSON(w, http.StatusCreated, map[string]interface{}{
		"business_id":       newBizID,
		"business_name":     req.BusinessName,
		"owner_name":        req.OwnerName,
		"owner_phone":       req.OwnerPhone,
		"category":          req.Category,
		"city":              req.City,
		"status":            "live",
		"verification":      "manual",
		"listing":           "listed",
		"free_access_grant": req.FreeAccessPlan,
		"message":           "Business manually registered and activated with " + req.FreeAccessPlan + " free access!",
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
			"id":           "00000000-0000-0000-0000-0000000000b1",
			"name":         "Kovai Precision Tools",
			"category":     "Manufacturing",
			"city":         "Coimbatore",
			"status":       "live",
			"verification": "gst",
			"listing":      "listed",
			"owner_name":   "Suresh Natarajan",
			"owner_phone":  "+919876543210",
		},
		{
			"id":           "00000000-0000-0000-0000-0000000000b5",
			"name":         "Raj Engineering Works",
			"category":     "Manufacturing",
			"city":         "Coimbatore",
			"status":       "live",
			"verification": "gst",
			"listing":      "listed",
			"owner_name":   "Raj",
			"owner_phone":  "+917094310122",
		},
		{
			"id":           "00000000-0000-0000-0000-0000000000b6",
			"name":         "Rashiq Trading & Logistics",
			"category":     "Logistics & Transport",
			"city":         "Coimbatore",
			"status":       "live",
			"verification": "gst",
			"listing":      "listed",
			"owner_name":   "Rashiq",
			"owner_phone":  "+919042938108",
		},
		{
			"id":           "00000000-0000-0000-0000-0000000000b2",
			"name":         "Apex Infotech Solutions",
			"category":     "IT & Software",
			"city":         "Coimbatore",
			"status":       "live",
			"verification": "gst",
			"listing":      "listed",
			"owner_name":   "Suresh Natarajan",
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
			"business_id":      "00000000-0000-0000-0000-0000000000b5",
			"business_name":    "Raj Engineering Works",
			"method":           "GSTIN",
			"gstin":            "33CCCCC2222C3Z7",
			"trade_name":       "Raj Engineering",
			"name_match_score": 99.0,
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
			"admin_name":  "Ajay",
			"action":      "GRANT_FREE_ACCESS",
			"target_type": "user_subscription",
			"target_name": "Raj (1 Year Free)",
			"ip_address":  "127.0.0.1",
			"created_at":  time.Now().Add(-15 * time.Minute),
		},
		{
			"id":          uuid.New(),
			"admin_name":  "Govardhan",
			"action":      "ADMIN_CREATE_BUSINESS",
			"target_type": "business",
			"target_name": "Rashiq Trading & Logistics",
			"ip_address":  "127.0.0.1",
			"created_at":  time.Now().Add(-45 * time.Minute),
		},
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"logs":  logs,
		"count": len(logs),
	})
}

func (h *AdminHandler) logAudit(adminID uuid.UUID, action, targetType string, targetID uuid.UUID, afterState, notes string) {
	if h.db != nil && h.db.Pool != nil {
		_, _ = h.db.Pool.Exec(nil, `
			INSERT INTO audit_logs (admin_id, action, target_type, target_id, notes)
			VALUES ($1, $2, $3, $4, $5)
		`, adminID, action, targetType, targetID, notes)
	}
}
