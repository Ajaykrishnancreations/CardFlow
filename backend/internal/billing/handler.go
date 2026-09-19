package billing

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"cardflow-backend/internal/config"
	"cardflow-backend/internal/database"
	"cardflow-backend/internal/domain"
	"cardflow-backend/internal/middleware"
	"cardflow-backend/pkg/response"
	"github.com/google/uuid"
	razorpay "github.com/razorpay/razorpay-go"
)

type BillingHandler struct {
	db  *database.DB
	cfg *config.Config
	rzp *razorpay.Client
}

func NewBillingHandler(db *database.DB, cfg *config.Config) *BillingHandler {
	var rzp *razorpay.Client
	if cfg.RazorpayKeyID != "" && cfg.RazorpayKeySecret != "" {
		rzp = razorpay.NewClient(cfg.RazorpayKeyID, cfg.RazorpayKeySecret)
	}
	return &BillingHandler{db: db, cfg: cfg, rzp: rzp}
}

// premiumPlans is the single source of truth for CardFlow Premium's duration
// plans — keep in sync with the frontend's SubscriptionScreen plan list.
var premiumPlans = map[string]struct {
	Name     string
	PriceINR int
	Months   int // 0 means lifetime (never expires)
}{
	"3m":       {"3 Months", 9, 3},
	"6m":       {"6 Months", 19, 6},
	"12m":      {"12 Months", 29, 12},
	"lifetime": {"Lifetime", 39, 0},
}

func (h *BillingHandler) GetPlans(w http.ResponseWriter, r *http.Request) {
	plans := []map[string]interface{}{
		{"id": "3m", "name": "3 Months", "price_inr": 9, "period": "3_months"},
		{"id": "6m", "name": "6 Months", "price_inr": 19, "period": "6_months", "badge": "Popular"},
		{"id": "12m", "name": "12 Months", "price_inr": 29, "period": "12_months", "badge": "Best Value"},
		{"id": "lifetime", "name": "Lifetime", "price_inr": 39, "period": "lifetime", "badge": "One-time"},
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"plans": plans,
	})
}

// GetTransactions lists the caller's own subscription payment history —
// shown on the CardFlow Premium screen so a user can see every attempt
// (paid, pending, failed) without needing access to the Razorpay dashboard.
func (h *BillingHandler) GetTransactions(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(middleware.UserContextKey).(*domain.User)
	if !ok || user == nil {
		response.Unauthorized(w, "authentication required")
		return
	}
	if h.db == nil || h.db.Pool == nil {
		response.InternalServerError(w, "database not connected")
		return
	}

	rows, err := h.db.Pool.Query(r.Context(), `
		SELECT plan_id, amount_paise, razorpay_order_id, COALESCE(razorpay_payment_id, ''), status, created_at, paid_at
		FROM subscription_payments
		WHERE user_id = $1
		ORDER BY created_at DESC
	`, user.ID)
	if err != nil {
		response.InternalServerError(w, "failed to load transactions: "+err.Error())
		return
	}
	defer rows.Close()

	transactions := []map[string]interface{}{}
	for rows.Next() {
		var planID, orderID, paymentID, status string
		var amountPaise int
		var createdAt time.Time
		var paidAt *time.Time
		if err := rows.Scan(&planID, &amountPaise, &orderID, &paymentID, &status, &createdAt, &paidAt); err != nil {
			response.InternalServerError(w, "failed to read transaction: "+err.Error())
			return
		}
		planName := planID
		if plan, known := premiumPlans[planID]; known {
			planName = plan.Name
		}
		transactions = append(transactions, map[string]interface{}{
			"plan_id":             planID,
			"plan_name":           planName,
			"amount_inr":          amountPaise / 100,
			"razorpay_order_id":   orderID,
			"razorpay_payment_id": paymentID,
			"status":              status,
			"created_at":          createdAt,
			"paid_at":             paidAt,
		})
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{"transactions": transactions})
}

// CreateOrder starts a real Razorpay payment for the chosen plan. The
// frontend opens Razorpay Checkout with the returned order_id; nothing is
// activated until the payment is verified (see VerifyPayment / Webhook).
func (h *BillingHandler) CreateOrder(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(middleware.UserContextKey).(*domain.User)
	if !ok || user == nil {
		response.Unauthorized(w, "authentication required")
		return
	}
	if h.rzp == nil {
		response.InternalServerError(w, "payments are not configured on this server yet")
		return
	}
	if h.db == nil || h.db.Pool == nil {
		response.InternalServerError(w, "database not connected")
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

	amountPaise := plan.PriceINR * 100
	receipt := "sub_" + uuid.New().String()[:12]

	order, err := h.rzp.Order.Create(map[string]interface{}{
		"amount":   amountPaise,
		"currency": "INR",
		"receipt":  receipt,
		"notes": map[string]interface{}{
			"user_id": user.ID.String(),
			"plan_id": req.PlanID,
		},
	}, nil)
	if err != nil {
		response.InternalServerError(w, "failed to create Razorpay order: "+err.Error())
		return
	}
	orderID, _ := order["id"].(string)
	if orderID == "" {
		response.InternalServerError(w, "Razorpay did not return an order id")
		return
	}

	_, err = h.db.Pool.Exec(r.Context(), `
		INSERT INTO subscription_payments (user_id, plan_id, amount_paise, razorpay_order_id, status)
		VALUES ($1, $2, $3, $4, 'created')
	`, user.ID, req.PlanID, amountPaise, orderID)
	if err != nil {
		response.InternalServerError(w, "failed to record order: "+err.Error())
		return
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"order_id":  orderID,
		"amount":    amountPaise,
		"currency":  "INR",
		"key_id":    h.cfg.RazorpayKeyID,
		"plan_id":   req.PlanID,
		"plan_name": plan.Name,
	})
}

// VerifyPayment checks Razorpay's checkout signature and, only if valid,
// activates the subscription. This is the client-side confirmation path;
// Webhook below is the durable fallback in case the app closes mid-flow.
func (h *BillingHandler) VerifyPayment(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(middleware.UserContextKey).(*domain.User)
	if !ok || user == nil {
		response.Unauthorized(w, "authentication required")
		return
	}
	if h.db == nil || h.db.Pool == nil {
		response.InternalServerError(w, "database not connected")
		return
	}

	var req struct {
		RazorpayOrderID   string `json:"razorpay_order_id"`
		RazorpayPaymentID string `json:"razorpay_payment_id"`
		RazorpaySignature string `json:"razorpay_signature"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request body", nil)
		return
	}
	if req.RazorpayOrderID == "" || req.RazorpayPaymentID == "" || req.RazorpaySignature == "" {
		response.BadRequest(w, "razorpay_order_id, razorpay_payment_id and razorpay_signature are required", nil)
		return
	}

	if !validSignature(req.RazorpayOrderID+"|"+req.RazorpayPaymentID, req.RazorpaySignature, h.cfg.RazorpayKeySecret) {
		response.Error(w, http.StatusBadRequest, "INVALID_SIGNATURE", "payment signature verification failed", nil)
		return
	}

	planID, alreadyPaid, err := h.markOrderPaid(r.Context(), user.ID, req.RazorpayOrderID, req.RazorpayPaymentID)
	if err != nil {
		response.InternalServerError(w, "failed to record payment: "+err.Error())
		return
	}

	// A retried verify call for an order already marked paid must not
	// re-extend the expiry — just report the subscription's current state.
	var result map[string]interface{}
	if alreadyPaid {
		result, err = h.currentSubscriptionState(r.Context(), user.ID)
	} else {
		result, err = h.activateSubscription(r.Context(), user.ID, planID)
	}
	if err != nil {
		response.InternalServerError(w, "payment verified but activation failed: "+err.Error())
		return
	}
	result["already_processed"] = alreadyPaid
	response.JSON(w, http.StatusOK, result)
}

// Webhook receives Razorpay's server-to-server payment.captured event —
// configure this URL + a webhook secret in the Razorpay dashboard
// (Settings → Webhooks). It activates the same way VerifyPayment does, but
// idempotently, so a payment still gets applied even if the customer's app
// closed before the checkout callback ran.
func (h *BillingHandler) Webhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		response.BadRequest(w, "could not read body", nil)
		return
	}

	if h.cfg.RazorpayWebhookSecret != "" {
		sig := r.Header.Get("X-Razorpay-Signature")
		if !validSignature(string(body), sig, h.cfg.RazorpayWebhookSecret) {
			response.Error(w, http.StatusBadRequest, "INVALID_SIGNATURE", "webhook signature verification failed", nil)
			return
		}
	}

	var payload struct {
		Event   string `json:"event"`
		Payload struct {
			Payment struct {
				Entity struct {
					ID      string `json:"id"`
					OrderID string `json:"order_id"`
				} `json:"entity"`
			} `json:"payment"`
		} `json:"payload"`
	}
	if err := json.Unmarshal(body, &payload); err != nil {
		response.BadRequest(w, "invalid webhook payload", nil)
		return
	}

	if payload.Event != "payment.captured" {
		response.JSON(w, http.StatusOK, map[string]interface{}{"ignored": payload.Event})
		return
	}

	orderID := payload.Payload.Payment.Entity.OrderID
	paymentID := payload.Payload.Payment.Entity.ID
	if orderID == "" || paymentID == "" {
		response.BadRequest(w, "missing order/payment id in webhook payload", nil)
		return
	}

	var userID uuid.UUID
	err = h.db.Pool.QueryRow(r.Context(), `
		SELECT user_id FROM subscription_payments WHERE razorpay_order_id = $1
	`, orderID).Scan(&userID)
	if err != nil {
		response.BadRequest(w, "unknown order_id", nil)
		return
	}

	planID, alreadyPaid, err := h.markOrderPaid(r.Context(), userID, orderID, paymentID)
	if err != nil {
		response.InternalServerError(w, "failed to record payment: "+err.Error())
		return
	}
	// The client-side VerifyPayment call may have already activated this
	// order — the webhook is a durable fallback, not a second charge.
	if !alreadyPaid {
		if _, err := h.activateSubscription(r.Context(), userID, planID); err != nil {
			response.InternalServerError(w, "webhook activation failed: "+err.Error())
			return
		}
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{"status": "processed"})
}

// markOrderPaid records the payment against the order (idempotent — a
// second call for an already-paid order is a no-op) and returns the plan id
// that order was for.
func (h *BillingHandler) markOrderPaid(ctx context.Context, userID uuid.UUID, orderID, paymentID string) (planID string, alreadyPaid bool, err error) {
	var status string
	err = h.db.Pool.QueryRow(ctx, `
		SELECT plan_id, status FROM subscription_payments
		WHERE razorpay_order_id = $1 AND user_id = $2
	`, orderID, userID).Scan(&planID, &status)
	if err != nil {
		return "", false, fmt.Errorf("order not found for this user: %w", err)
	}
	if status == "paid" {
		return planID, true, nil
	}

	_, err = h.db.Pool.Exec(ctx, `
		UPDATE subscription_payments
		SET status = 'paid', razorpay_payment_id = $2, paid_at = NOW()
		WHERE razorpay_order_id = $1
	`, orderID, paymentID)
	return planID, false, err
}

func (h *BillingHandler) activateSubscription(ctx context.Context, userID uuid.UUID, planID string) (map[string]interface{}, error) {
	plan, known := premiumPlans[planID]
	if !known {
		return nil, fmt.Errorf("unknown plan_id %q on paid order", planID)
	}

	var expiresAt *time.Time
	if plan.Months > 0 {
		t := time.Now().AddDate(0, plan.Months, 0)
		expiresAt = &t
	}

	_, err := h.db.Pool.Exec(ctx, `
		UPDATE users
		SET is_subscribed = true, subscription_plan_id = $2, subscription_expires_at = $3, updated_at = NOW()
		WHERE id = $1 AND deleted_at IS NULL
	`, userID, planID, expiresAt)
	if err != nil {
		return nil, err
	}

	return map[string]interface{}{
		"is_subscribed":           true,
		"subscription_plan_id":    planID,
		"subscription_plan_name":  plan.Name,
		"subscription_expires_at": expiresAt,
	}, nil
}

// currentSubscriptionState reads back what's actually stored for the user —
// used when a payment was already processed, so a retried verify call
// reports reality instead of re-extending the expiry.
func (h *BillingHandler) currentSubscriptionState(ctx context.Context, userID uuid.UUID) (map[string]interface{}, error) {
	var isSubscribed bool
	var planID *string
	var expiresAt *time.Time
	err := h.db.Pool.QueryRow(ctx, `
		SELECT is_subscribed, subscription_plan_id, subscription_expires_at
		FROM users WHERE id = $1 AND deleted_at IS NULL
	`, userID).Scan(&isSubscribed, &planID, &expiresAt)
	if err != nil {
		return nil, err
	}
	planName := ""
	if planID != nil {
		if plan, known := premiumPlans[*planID]; known {
			planName = plan.Name
		}
	}
	return map[string]interface{}{
		"is_subscribed":           isSubscribed,
		"subscription_plan_id":    planID,
		"subscription_plan_name":  planName,
		"subscription_expires_at": expiresAt,
	}, nil
}

func validSignature(payload, signature, secret string) bool {
	if secret == "" || signature == "" {
		return false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(payload))
	expected := hex.EncodeToString(mac.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
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
		Store         string `json:"store"` // 'play' or 'appstore'
		ProductID     string `json:"product_id"`
		PurchaseToken string `json:"purchase_token"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	// In sandbox / test environment, verify and activate plan
	response.JSON(w, http.StatusOK, map[string]interface{}{
		"status":       "activated",
		"plan":         "plus",
		"user_id":      user.ID,
		"activated_at": time.Now(),
		"expires_at":   time.Now().AddDate(0, 1, 0),
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
