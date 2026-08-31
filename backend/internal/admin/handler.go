package admin

import (
	"encoding/json"
	"net/http"
	"sync"
	"time"

	"cardflow-backend/internal/database"
	"cardflow-backend/internal/domain"
	"cardflow-backend/internal/middleware"
	"cardflow-backend/pkg/response"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type AdminBusiness struct {
	ID           string   `json:"id"`
	Name         string   `json:"name"`
	Category     string   `json:"category"`
	City         string   `json:"city"`
	Address      string   `json:"address,omitempty"`
	Pincode      string   `json:"pincode,omitempty"`
	Status       string   `json:"status"`       // 'live', 'pending', 'rejected'
	Verification string   `json:"verification"` // 'gst', 'manual', 'pending'
	Listing      string   `json:"listing"`      // 'listed', 'unlisted'
	OwnerName    string   `json:"owner_name"`
	OwnerPhone   string   `json:"owner_phone"`
	Services     []string `json:"services,omitempty"`
}

type AdminUserItem struct {
	ID           string    `json:"id"`
	Phone        string    `json:"phone"`
	Name         string    `json:"name"`
	Role         string    `json:"role"`
	Plan         string    `json:"plan"`
	Status       string    `json:"status"`
	City         string    `json:"city"`
	AccessPeriod string    `json:"access_period"`
	BusinessName string    `json:"business_name,omitempty"`
	CreatedAt    time.Time `json:"created_at"`
}

type VerificationItem struct {
	ID             string    `json:"id"`
	BusinessID     string    `json:"business_id"`
	BusinessName   string    `json:"business_name"`
	EnteredName    string    `json:"entered_name"`
	RegistryName   string    `json:"registry_name"`
	GSTIN          string    `json:"gstin"`
	Method         string    `json:"method"`
	NameMatchScore float64   `json:"name_match_score"`
	City           string    `json:"city"`
	Pincode        string    `json:"pincode"`
	Status         string    `json:"status"` // 'pending', 'approved', 'rejected'
	SubmittedAt    time.Time `json:"submitted_at"`
}

type AdminHandler struct {
	db           *database.DB
	mu           sync.RWMutex
	businesses   []AdminBusiness
	users        []AdminUserItem
	verifyQueue  []VerificationItem
}

func NewAdminHandler(db *database.DB) *AdminHandler {
	now := time.Now()
	return &AdminHandler{
		db: db,
		businesses: []AdminBusiness{
			{
				ID:           "00000000-0000-0000-0000-0000000000b1",
				Name:         "Kovai Precision Tools",
				Category:     "Manufacturing",
				City:         "Coimbatore",
				Address:      "42/A Industrial Estate, Ganapathy, Coimbatore",
				Pincode:      "641004",
				Status:       "live",
				Verification: "gst",
				Listing:      "listed",
				OwnerName:    "Suresh Natarajan",
				OwnerPhone:   "+919876543210",
				Services:     []string{"CNC Milling", "Hydraulic Valves", "Lathe Machining"},
			},
			{
				ID:           "00000000-0000-0000-0000-0000000000b2",
				Name:         "Apex Infotech Solutions",
				Category:     "IT & Software",
				City:         "Coimbatore",
				Address:      "108 Cross Cut Road, Gandhipuram, Coimbatore",
				Pincode:      "641018",
				Status:       "live",
				Verification: "gst",
				Listing:      "listed",
				OwnerName:    "Suresh Natarajan",
				OwnerPhone:   "+919876543210",
				Services:     []string{"Cloud ERP", "React Native Apps", "SaaS Development"},
			},
			{
				ID:           "00000000-0000-0000-0000-0000000000b5",
				Name:         "Raj Engineering Works",
				Category:     "Manufacturing",
				City:         "Coimbatore",
				Address:      "78 Thudiyalur Main Road, Coimbatore",
				Pincode:      "641006",
				Status:       "live",
				Verification: "gst",
				Listing:      "listed",
				OwnerName:    "Raj",
				OwnerPhone:   "+917094310122",
				Services:     []string{"Lathe Turning & Milling", "Laser Sheet Metal Cutting", "Industrial Fabrication"},
			},
			{
				ID:           "00000000-0000-0000-0000-0000000000b6",
				Name:         "Rashiq Trading & Logistics",
				Category:     "Logistics & Transport",
				City:         "Coimbatore",
				Address:      "12 Trichy Road, Singanallur, Coimbatore",
				Pincode:      "641002",
				Status:       "live",
				Verification: "gst",
				Listing:      "listed",
				OwnerName:    "Rashiq",
				OwnerPhone:   "+919042938108",
				Services:     []string{"Full Truckload (FTL)", "Warehousing", "Cold Chain Logistics"},
			},
		},
		users: []AdminUserItem{
			{
				ID:           "00000000-0000-0000-0000-0000000000a1",
				Phone:        "+916382124970",
				Name:         "Ajay",
				Role:         "admin",
				Plan:         "premium",
				Status:       "active",
				City:         "Coimbatore",
				AccessPeriod: "Lifetime Admin Access",
				CreatedAt:    now.AddDate(0, -6, 0),
			},
			{
				ID:           "00000000-0000-0000-0000-0000000000a2",
				Phone:        "+919008722766",
				Name:         "Govardhan",
				Role:         "admin",
				Plan:         "premium",
				Status:       "active",
				City:         "Bengaluru",
				AccessPeriod: "Lifetime Admin Access",
				CreatedAt:    now.AddDate(0, -6, 0),
			},
			{
				ID:           "00000000-0000-0000-0000-0000000000b3",
				Phone:        "+917094310122",
				Name:         "Raj",
				Role:         "owner",
				Plan:         "premium",
				Status:       "active",
				City:         "Coimbatore",
				AccessPeriod: "1 Year Free Premium",
				BusinessName: "Raj Engineering Works",
				CreatedAt:    now.AddDate(0, -3, 0),
			},
			{
				ID:           "00000000-0000-0000-0000-0000000000b4",
				Phone:        "+919042938108",
				Name:         "Rashiq",
				Role:         "owner",
				Plan:         "plus",
				Status:       "active",
				City:         "Coimbatore",
				AccessPeriod: "6 Months Free Plus",
				BusinessName: "Rashiq Trading & Logistics",
				CreatedAt:    now.AddDate(0, -2, 0),
			},
			{
				ID:           "00000000-0000-0000-0000-0000000000u4",
				Phone:        "+919677840181",
				Name:         "Dharani",
				Role:         "user",
				Plan:         "free",
				Status:       "active",
				City:         "Coimbatore",
				AccessPeriod: "Standard Free User",
				CreatedAt:    now.AddDate(0, -1, 0),
			},
			{
				ID:           "00000000-0000-0000-0000-0000000000u5",
				Phone:        "+911234567890",
				Name:         "Ravi Kumar",
				Role:         "user",
				Plan:         "free",
				Status:       "active",
				City:         "Coimbatore",
				AccessPeriod: "Standard Free User",
				CreatedAt:    now.AddDate(0, -1, 0),
			},
			{
				ID:           "00000000-0000-0000-0000-000000000002",
				Phone:        "+919876543210",
				Name:         "Suresh Natarajan",
				Role:         "owner",
				Plan:         "plus",
				Status:       "active",
				City:         "Coimbatore",
				AccessPeriod: "Active Subscriber",
				BusinessName: "Kovai Precision Tools",
				CreatedAt:    now.AddDate(0, -4, 0),
			},
		},
		verifyQueue: []VerificationItem{
			{
				ID:             "kyc-1",
				BusinessID:     "00000000-0000-0000-0000-0000000000b1",
				BusinessName:   "Kovai Precision Tools",
				EnteredName:    "Kovai Precision Tools",
				RegistryName:   "KOVAI PRECISION TOOLS PRIVATE LIMITED",
				GSTIN:          "33AAAAA0000A1Z5",
				Method:         "GSTIN",
				NameMatchScore: 92.5,
				City:           "Coimbatore",
				Pincode:        "641004",
				Status:         "pending",
				SubmittedAt:    now.Add(-2 * time.Hour),
			},
			{
				ID:             "kyc-2",
				BusinessID:     "00000000-0000-0000-0000-0000000000b7",
				BusinessName:   "Sri Lakshmi Fabrics",
				EnteredName:    "Sri Lakshmi Fabrics",
				RegistryName:   "SRI LAKSHMI TEX MILLS LLP",
				GSTIN:          "33CCCCCC2222C3Z7",
				Method:         "GSTIN",
				NameMatchScore: 78.0,
				City:           "Coimbatore",
				Pincode:        "641015",
				Status:         "pending",
				SubmittedAt:    now.Add(-4 * time.Hour),
			},
		},
	}
}

func (h *AdminHandler) GetDashboard(w http.ResponseWriter, r *http.Request) {
	h.mu.RLock()
	totalUsers := len(h.users)
	totalBiz := len(h.businesses)
	pendingCount := 0
	for _, q := range h.verifyQueue {
		if q.Status == "pending" {
			pendingCount++
		}
	}
	h.mu.RUnlock()

	stats := map[string]interface{}{
		"total_users":           1420 + totalUsers,
		"active_businesses":     480 + totalBiz,
		"verified_businesses":   342 + totalBiz,
		"pending_verifications": pendingCount,
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
		},
	}

	response.JSON(w, http.StatusOK, stats)
}

func (h *AdminHandler) ListUsers(w http.ResponseWriter, r *http.Request) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"users": h.users,
		"count": len(h.users),
	})
}

func (h *AdminHandler) DeleteUser(w http.ResponseWriter, r *http.Request) {
	adminUser, _ := r.Context().Value(middleware.UserContextKey).(*domain.User)
	id := chi.URLParam(r, "id")

	h.mu.Lock()
	defer h.mu.Unlock()

	var deletedUser *AdminUserItem
	newUsers := make([]AdminUserItem, 0, len(h.users))
	for _, u := range h.users {
		if u.ID == id || u.Phone == id {
			deletedUser = &u
		} else {
			newUsers = append(newUsers, u)
		}
	}
	h.users = newUsers

	if deletedUser != nil {
		h.logAudit(adminUser.ID, "DELETE_USER", "user", uuid.New(), "deleted", "Admin deleted user: "+deletedUser.Name)
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "User deleted successfully",
		"id":      id,
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

	h.mu.Lock()
	durationLabel := "6 Months Free Access"
	if req.Duration == "1_year" {
		durationLabel = "1 Year Free Access"
	} else if req.Duration == "lifetime" {
		durationLabel = "Lifetime Free Access"
	}

	for i, u := range h.users {
		if u.ID == req.UserID || u.Phone == req.Phone {
			h.users[i].Plan = req.Plan
			h.users[i].AccessPeriod = durationLabel
			break
		}
	}
	h.mu.Unlock()

	h.logAudit(adminUser.ID, "GRANT_FREE_ACCESS", "user_subscription", uuid.New(), req.Plan+" ("+req.Duration+")", req.Notes)

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"success":       true,
		"user_id":       req.UserID,
		"phone":         req.Phone,
		"plan":          req.Plan,
		"duration":      req.Duration,
		"access_period": durationLabel,
		"message":       "Free access granted successfully for " + durationLabel,
		"granted_by":    adminUser.Name,
		"granted_at":    time.Now(),
	})
}

func (h *AdminHandler) ListBusinesses(w http.ResponseWriter, r *http.Request) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"businesses": h.businesses,
		"count":      len(h.businesses),
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
		Pincode        string   `json:"pincode"`
		Services       []string `json:"services"`
		FreeAccessPlan string   `json:"free_access_plan"` // '6_months', '1_year', 'lifetime'
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request", err.Error())
		return
	}

	newBizID := uuid.New().String()
	newBiz := AdminBusiness{
		ID:           newBizID,
		Name:         req.BusinessName,
		Category:     req.Category,
		City:         req.City,
		Address:      req.Address,
		Pincode:      req.Pincode,
		Status:       "live",
		Verification: "gst",
		Listing:      "listed",
		OwnerName:    req.OwnerName,
		OwnerPhone:   req.OwnerPhone,
		Services:     req.Services,
	}
	if newBiz.Pincode == "" {
		newBiz.Pincode = "641004"
	}

	h.mu.Lock()
	h.businesses = append([]AdminBusiness{newBiz}, h.businesses...)

	// Also add / update owner user in admin users
	newUser := AdminUserItem{
		ID:           "usr-" + uuid.New().String()[:8],
		Phone:        req.OwnerPhone,
		Name:         req.OwnerName,
		Role:         "owner",
		Plan:         "premium",
		Status:       "active",
		City:         req.City,
		AccessPeriod: req.FreeAccessPlan + " Free Access",
		BusinessName: req.BusinessName,
		CreatedAt:    time.Now(),
	}
	h.users = append([]AdminUserItem{newUser}, h.users...)
	h.mu.Unlock()

	h.logAudit(adminUser.ID, "ADMIN_CREATE_BUSINESS", "business", uuid.New(), req.BusinessName, "Created with "+req.FreeAccessPlan+" access")

	response.JSON(w, http.StatusCreated, map[string]interface{}{
		"business":          newBiz,
		"business_id":       newBizID,
		"business_name":     req.BusinessName,
		"owner_name":        req.OwnerName,
		"owner_phone":       req.OwnerPhone,
		"category":          req.Category,
		"city":              req.City,
		"status":            "live",
		"verification":      "gst",
		"listing":           "listed",
		"free_access_grant": req.FreeAccessPlan,
		"message":           "Business manually registered and activated with " + req.FreeAccessPlan + " free access!",
	})
}

func (h *AdminHandler) UpdateBusiness(w http.ResponseWriter, r *http.Request) {
	adminUser, _ := r.Context().Value(middleware.UserContextKey).(*domain.User)
	id := chi.URLParam(r, "id")

	var req AdminBusiness
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		response.BadRequest(w, "invalid request", err.Error())
		return
	}

	h.mu.Lock()
	defer h.mu.Unlock()

	for i, b := range h.businesses {
		if b.ID == id {
			if req.Name != "" {
				h.businesses[i].Name = req.Name
			}
			if req.Category != "" {
				h.businesses[i].Category = req.Category
			}
			if req.City != "" {
				h.businesses[i].City = req.City
			}
			if req.Address != "" {
				h.businesses[i].Address = req.Address
			}
			if req.Pincode != "" {
				h.businesses[i].Pincode = req.Pincode
			}
			if req.Status != "" {
				h.businesses[i].Status = req.Status
			}
			if req.Verification != "" {
				h.businesses[i].Verification = req.Verification
			}
			if req.Listing != "" {
				h.businesses[i].Listing = req.Listing
			}
			if req.OwnerName != "" {
				h.businesses[i].OwnerName = req.OwnerName
			}
			if req.OwnerPhone != "" {
				h.businesses[i].OwnerPhone = req.OwnerPhone
			}
			if len(req.Services) > 0 {
				h.businesses[i].Services = req.Services
			}

			h.logAudit(adminUser.ID, "UPDATE_BUSINESS", "business", uuid.New(), "updated", "Admin updated business: "+h.businesses[i].Name)

			response.JSON(w, http.StatusOK, map[string]interface{}{
				"success":  true,
				"message":  "Business updated successfully",
				"business": h.businesses[i],
			})
			return
		}
	}

	response.NotFound(w, "business listing not found")
}

func (h *AdminHandler) DeleteBusiness(w http.ResponseWriter, r *http.Request) {
	adminUser, _ := r.Context().Value(middleware.UserContextKey).(*domain.User)
	id := chi.URLParam(r, "id")

	h.mu.Lock()
	defer h.mu.Unlock()

	var deletedBiz *AdminBusiness
	newBizList := make([]AdminBusiness, 0, len(h.businesses))
	for _, b := range h.businesses {
		if b.ID == id {
			deletedBiz = &b
		} else {
			newBizList = append(newBizList, b)
		}
	}
	h.businesses = newBizList

	if deletedBiz != nil {
		h.logAudit(adminUser.ID, "DELETE_BUSINESS", "business", uuid.New(), "deleted", "Admin deleted business: "+deletedBiz.Name)
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"success": true,
		"message": "Business deleted successfully",
		"id":      id,
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

	h.mu.Lock()
	for i, u := range h.users {
		if u.ID == id || u.Phone == id {
			h.users[i].Status = req.Status
			break
		}
	}
	h.mu.Unlock()

	h.logAudit(adminUser.ID, "UPDATE_USER_STATUS", "user", uuid.New(), req.Status, req.Reason)

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"user_id": id,
		"status":  req.Status,
		"updated": true,
	})
}

func (h *AdminHandler) ListPendingVerifications(w http.ResponseWriter, r *http.Request) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	var pending []VerificationItem
	for _, q := range h.verifyQueue {
		if q.Status == "pending" {
			pending = append(pending, q)
		}
	}
	if pending == nil {
		pending = []VerificationItem{}
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"queue": pending,
		"count": len(pending),
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

	h.mu.Lock()
	for i, q := range h.verifyQueue {
		if q.ID == id {
			if req.Action == "approve" {
				h.verifyQueue[i].Status = "approved"
				// Update business in listing
				for j, b := range h.businesses {
					if b.ID == q.BusinessID || b.Name == q.BusinessName {
						h.businesses[j].Status = "live"
						h.businesses[j].Verification = "gst"
						h.businesses[j].Listing = "listed"
					}
				}
			} else {
				h.verifyQueue[i].Status = "rejected"
			}
			break
		}
	}
	h.mu.Unlock()

	h.logAudit(adminUser.ID, "VERIFICATION_"+req.Action, "business_verification", uuid.New(), req.Action, req.Notes)

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"id":      id,
		"action":  req.Action,
		"success": true,
		"message": "Verification decision processed: " + req.Action,
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
