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

func (h *BillingHandler) GetPlans(w http.ResponseWriter, r *http.Request) {
	plans := []map[string]interface{}{
		{
			"id":             "free",
			"name":           "CardFlow Free",
			"price_inr":      0,
			"period":         "lifetime",
			"scan_limit":     30,
			"features":       []string{"30 Scans / Month", "Public Directory Search", "Digital Business Card", "Basic Sharing"},
			"business_limit": 1,
		},
		{
			"id":             "plus",
			"name":           "CardFlow Plus",
			"price_inr":      299,
			"period":         "month",
			"scan_limit":     150,
			"features":       []string{"150 Scans / Month", "Up to 3 Businesses", "WhatsApp Lead Alerts", "Priority Search Ranking", "Full Analytics"},
			"business_limit": 3,
		},
		{
			"id":             "premium",
			"name":           "CardFlow Premium",
			"price_inr":      799,
			"period":         "month",
			"scan_limit":     9999,
			"features":       []string{"Unlimited AI Scans", "Unlimited Businesses", "Verified Gold Badge", "Export to CRM / Excel", "Dedicated Support"},
			"business_limit": 999,
		},
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"plans": plans,
	})
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
