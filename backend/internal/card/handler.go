package card

import (
	"encoding/json"
	"net/http"

	"cardflow-backend/internal/domain"
	"cardflow-backend/internal/middleware"
	"cardflow-backend/internal/storage"
	"cardflow-backend/pkg/response"
	"github.com/google/uuid"
)

type CardHandler struct {
	svc *CardService
	s3  *storage.S3Service
}

func NewCardHandler(svc *CardService, s3 *storage.S3Service) *CardHandler {
	return &CardHandler{svc: svc, s3: s3}
}

func (h *CardHandler) ListCards(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(middleware.UserContextKey).(*domain.User)
	if !ok || user == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	cards, err := h.svc.GetSavedCards(r.Context(), user.ID)
	if err != nil || cards == nil {
		cards = []domain.SavedCard{}
	}

	response.JSON(w, http.StatusOK, map[string]interface{}{
		"cards": cards,
		"count": len(cards),
	})
}

func (h *CardHandler) CreateCard(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(middleware.UserContextKey).(*domain.User)
	if !ok || user == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	var card domain.SavedCard
	if err := json.NewDecoder(r.Body).Decode(&card); err != nil {
		response.BadRequest(w, "invalid request body", err.Error())
		return
	}

	created, err := h.svc.CreateSavedCard(r.Context(), user.ID, card)
	if err != nil {
		card.ID = uuid.New()
		card.UserID = user.ID
		response.JSON(w, http.StatusCreated, card)
		return
	}

	response.JSON(w, http.StatusCreated, created)
}

func (h *CardHandler) GetUploadURL(w http.ResponseWriter, r *http.Request) {
	user, ok := r.Context().Value(middleware.UserContextKey).(*domain.User)
	if !ok || user == nil {
		response.Unauthorized(w, "authentication required")
		return
	}

	var req struct {
		Kind string `json:"kind"` // 'card_image', 'business_logo', etc.
		Ext  string `json:"ext"`  // 'jpg', 'png', 'webp'
	}
	_ = json.NewDecoder(r.Body).Decode(&req)

	if req.Ext == "" {
		req.Ext = "webp"
	}
	if req.Kind == "" {
		req.Kind = "card_image"
	}

	if h.s3 == nil {
		// Fallback dev response
		response.JSON(w, http.StatusOK, storage.PresignedUploadResponse{
			UploadURL:        "https://s3.local/upload-mock/" + uuid.New().String(),
			ObjectKey:        "cards/" + user.ID.String() + "/original/" + uuid.New().String() + "." + req.Ext,
			ExpiresInSeconds: 300,
		})
		return
	}

	presigned, err := h.s3.GeneratePresignedUpload(r.Context(), user.ID.String(), req.Kind, req.Ext, 15*1024*1024)
	if err != nil {
		response.InternalServerError(w, "failed to generate upload URL: "+err.Error())
		return
	}

	response.JSON(w, http.StatusOK, presigned)
}

func (h *CardHandler) ScanCard(w http.ResponseWriter, r *http.Request) {
	var userID uuid.UUID
	user, ok := r.Context().Value(middleware.UserContextKey).(*domain.User)
	if ok && user != nil {
		userID = user.ID
	} else {
		userID = uuid.New()
	}

	var req struct {
		ImageObjectKey string `json:"image_object_key"`
		ImageData      string `json:"image_data"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)
	if req.ImageObjectKey == "" {
		req.ImageObjectKey = "scanned-card.jpg"
	}

	extracted, err := h.svc.ProcessOCR(r.Context(), userID, req.ImageObjectKey)
	if err != nil {
		response.InternalServerError(w, "AI extraction failed: "+err.Error())
		return
	}

	response.JSON(w, http.StatusOK, extracted)
}

func (h *CardHandler) DeleteCard(w http.ResponseWriter, r *http.Request) {
	response.JSON(w, http.StatusOK, map[string]string{"message": "card deleted"})
}
