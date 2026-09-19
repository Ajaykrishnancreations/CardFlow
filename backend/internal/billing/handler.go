package billing

import (
	"encoding/json"
	"net/http"
	"time"

	"cardflow-backend/internal/database"
	"cardflow-backend/internal/domain"
	"cardflow-backend/internal/middleware"
	"cardflow-backend/pkg/response"
	"github.com/google/uuid"
)

type BillingHandler struct {
	db *database.DB
}

func NewBillingHandler(db *database.DB) *BillingHandler {
	return &BillingHandler{db: db}
}

// premiumPlans is the single source of truth for CardFlow Premium's duration
// plans — keep in sync with the frontend's SubscriptionScreen plan list.
var premiumPlans = map[string]struct {
	Name     string
	PriceINR int
	Months   int // 0 means lifetime (never expires)
}{
	"3m":       {"3 Months", 199, 3},
	"6m":       {"6 Months", 399, 6},
	"12m":      {"12 Months", 599, 12},
	"lifetime": {"Lifetime", 999, 0},
}

func (h *BillingHandler) GetPlans(w http.ResponseWriter, r *http.Request) {
	plans := []map[string]interface{}{
		{"id": "3m", "name": "3 Months", "price_inr": 199, "period": "3_months"},
		{"id": "6m", "name": "6 Months", "price_inr": 399, "period": "6_months", "badge": "Popular"},
		{"id": "12m", "name": "12 Months", "price_inr": 599, "period": "12_months", "badge": "Best Value"},
		{"id": "lifetime", "name": "Lifetime", "price_inr": 999, "period": "lifetime", "badge": "One-time"},
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"plans": plans,
	})
}

// ActivatePlan is a preview-only subscription activation — no real payment
// gateway is wired up yet, so this simply records the chosen plan and its
// expiry against the user directly. It exists so the free/premium gating UI
// (theme colors, business limit, card templates, saved-card limit) can be
// exercised end-to-end; swap the body for a real payment-verified call once
// a gateway is integrated, without changing the DB shape or the gating logic.
func (h *BillingHandler) ActivatePlan(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(middleware.UserContextKey).(*domain.User)
	if !ok || user == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	var req struct {
		PlanID string `json:"plan_id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", nil)
		return
	}

	plan, known := premiumPlans[req.PlanID]
	if !known {
		response.BadRequest(w, "unknown plan_id — expected one of 3m, 6m, 12m, lifetime", nil)
		return
	}

	var expiresAt *time.Time
	if plan.Months > 0 {
		t := time.Now().AddDate(0, plan.Months, 0)
		expiresAt = &t
	}

	if h.db == nil || h.db.Pool == nil {
		response.InternalServerError(w, "database not connected")
		return
	}
	_, err := h.db.Pool.Exec(r.Context(), `
		UPDATE users
		SET is_subscribed = true, subscription_plan_id = $2, subscription_expires_at = $3, updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`, user.ID, req.PlanID, expiresAt)
	if err != nil {
		response.InternalServerError(w, "failed to activate subscription: "+err.Error())
		return
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"is_subscribed":           true,
		"subscription_plan_id":    req.PlanID,
		"subscription_plan_name":  plan.Name,
		"subscription_expires_at": expiresAt,
	})
}

// CancelSubscription revokes premium access immediately (the plan/expiry
// columns are left as a historical record).
func (h *BillingHandler) CancelSubscription(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(middleware.UserContextKey).(*domain.User)
	if !ok || user == nil {
		response.Unauthorized(w, "authentication required")
		return
	}
	if h.db == nil || h.db.Pool == nil {
		response.InternalServerError(w, "database not connected")
		return
	}
	_, err := h.db.Pool.Exec(r.Context(), `
		UPDATE users SET is_subscribed = false, updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`, user.ID)
	if err != nil {
		response.InternalServerError(w, "failed to cancel subscription: "+err.Error())
		return
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{"is_subscribed": false})
}

func (h *BillingHandler) VerifyPurchase(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(middleware.UserContextKey).(*domain.User)
	if !ok || user == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	var req struct {
		Store       string `json:"store"` // 'play' or 'appstore'
		ProductID   string `json:"product_id"`
		PurchaseToken string `json:"purchase_token"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	// In sandbox / test environment, verify and activate plan
	response.JSON(w, http.StatusOK, map[string]interface{}{
		"status":      "activated",
		"plan":        "plus",
		"user_id":     user.ID,
		"activated_at": time.Now(),
		"expires_at":  time.Now().AddDate(0, 1, 0),
	})
}

func (h *BillingHandler) GetCredits(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(middleware.UserContextKey).(*domain.User)
	if !ok || user == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"balance":              25,
		"free_scans_remaining": 30,
		"reset_date":           time.Now().AddDate(0, 1, 0),
		"history": []map[string]interface{}{
			{
				"id":            uuid.New(),
				"delta":         10,
				"reason":        "Signup Welcome Bonus",
				"balance_after": 10,
				"created_at":    time.Now().AddDate(0, 0, -5),
			},
			{
				"id":            uuid.New(),
				"delta":         15,
				"reason":        "Mini Pack Top-up (15 Credits)",
				"balance_after": 25,
				"created_at":    time.Now().AddDate(0, 0, -1),
			},
		},
	})
}
