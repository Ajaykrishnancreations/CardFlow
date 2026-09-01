package card

import (
	"context"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"

	"cardflow-backend/internal/database"
	"cardflow-backend/internal/domain"
	"cardflow-backend/internal/extractor"
	"cardflow-backend/internal/storage"
	"github.com/google/uuid"
)

type CardService struct {
	db          *database.DB
	s3          *storage.S3Service
	extractor   *extractor.GeminiService
	vaultMutex  sync.RWMutex
	memoryVault map[uuid.UUID][]domain.SavedCard
	imageMutex   sync.RWMutex
	memoryImages map[string][]byte
}

func NewCardService(db *database.DB, s3 *storage.S3Service, ext *extractor.GeminiService) *CardService {
	return &CardService{
		db:           db,
		s3:           s3,
		extractor:    ext,
		memoryVault:  make(map[uuid.UUID][]domain.SavedCard),
		memoryImages: make(map[string][]byte),
	}
}

func (s *CardService) GetSavedCards(ctx context.Context, userID uuid.UUID) ([]domain.SavedCard, error) {
	cards := make([]domain.SavedCard, 0)

	if s.db != nil && s.db.Pool != nil {
		rows, err := s.db.Pool.Query(ctx, `
			SELECT id, user_id, COALESCE(person_name, ''), COALESCE(designation, ''), COALESCE(company, ''),
			       COALESCE(website, ''), COALESCE(notes, ''), COALESCE(met_context, ''), COALESCE(private_rating, 5),
			       COALESCE(contact_type::text, 'business'), COALESCE(extract_status::text, 'extracted'),
			       COALESCE(gstin, ''), created_at, updated_at
			FROM saved_cards
			WHERE user_id = $1 AND deleted_at IS NULL
			ORDER BY created_at DESC
		`, userID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var c domain.SavedCard
				var contactType, extractStatus, website, gstinVal string
				var rating int16

				scanErr := rows.Scan(
					&c.ID, &c.UserID, &c.PersonName, &c.Designation, &c.Company,
					&website, &c.Notes, &c.MetContext, &rating, &contactType,
					&extractStatus, &gstinVal, &c.CreatedAt, &c.UpdatedAt,
				)
				if scanErr == nil {
					if website != "" {
						c.Website = &website
					}
					c.GSTIN = gstinVal
					rInt := int(rating)
					c.PrivateRating = &rInt
					c.ContactType = contactType
					c.ExtractStatus = extractStatus

					// Fetch phones
					pRows, pErr := s.db.Pool.Query(ctx, `SELECT raw_phone, phone_e164, phone_type, is_whatsapp FROM saved_card_phones WHERE saved_card_id = $1`, c.ID)
					if pErr == nil {
						for pRows.Next() {
							var raw, e164, pType string
							var isWA bool
							if pRows.Scan(&raw, &e164, &pType, &isWA) == nil {
								c.Phones = append(c.Phones, domain.CardPhone{Raw: raw, E164: e164, Type: pType, IsWhatsApp: isWA})
							}
						}
						pRows.Close()
					}

					// Fetch emails
					eRows, eErr := s.db.Pool.Query(ctx, `SELECT email FROM saved_card_emails WHERE saved_card_id = $1`, c.ID)
					if eErr == nil {
						for eRows.Next() {
							var em string
							if eRows.Scan(&em) == nil {
								c.Emails = append(c.Emails, em)
							}
						}
						eRows.Close()
					}

					// Fetch address
					var rawAddr string
					_ = s.db.Pool.QueryRow(ctx, `SELECT raw_address FROM saved_card_addresses WHERE saved_card_id = $1`, c.ID).Scan(&rawAddr)
					c.RawAddress = rawAddr

					// Fetch tags
					tRows, tErr := s.db.Pool.Query(ctx, `
						SELECT t.name FROM tags t
						JOIN saved_card_tags sct ON sct.tag_id = t.id
						WHERE sct.saved_card_id = $1
					`, c.ID)
					if tErr == nil {
						for tRows.Next() {
							var tn string
							if tRows.Scan(&tn) == nil {
								c.Tags = append(c.Tags, tn)
							}
						}
						tRows.Close()
					}

					// Fetch original card image metadata
					var imgKey string
					var hasImageData bool
					_ = s.db.Pool.QueryRow(ctx, `
						SELECT object_key,
						       (image_data IS NOT NULL AND length(image_data) > 0)
						FROM saved_card_images
						WHERE saved_card_id = $1 AND side = 'front'
						ORDER BY created_at DESC LIMIT 1
					`, c.ID).Scan(&imgKey, &hasImageData)
					if imgKey != "" || hasImageData {
						c.OriginalCardImageURL = originalImageAPIPath(c.ID.String(), "front")
						if imgKey != "" {
							c.FrontImageKey = &imgKey
						}
					}

					var backKey string
					var hasBack bool
					_ = s.db.Pool.QueryRow(ctx, `
						SELECT object_key,
						       (image_data IS NOT NULL AND length(image_data) > 0)
						FROM saved_card_images
						WHERE saved_card_id = $1 AND side = 'back'
						ORDER BY created_at DESC LIMIT 1
					`, c.ID).Scan(&backKey, &hasBack)
					if backKey != "" || hasBack {
						c.OriginalBackImageURL = originalImageAPIPath(c.ID.String(), "back")
						if backKey != "" {
							c.BackImageKey = &backKey
						}
					}

					// Parse GSTIN from notes if embedded
					if c.Notes != "" && len(c.Notes) > 7 && c.Notes[:7] == "__GST__" {
						parts := strings.SplitN(c.Notes, "\n", 2)
						c.GSTIN = strings.TrimPrefix(parts[0], "__GST__:")
						if len(parts) > 1 {
							c.Notes = parts[1]
						} else {
							c.Notes = ""
						}
					}

					cards = append(cards, c)
				}
			}
		}
	}

	// Also check in-memory cache
	s.vaultMutex.RLock()
	memCards := s.memoryVault[userID]
	s.vaultMutex.RUnlock()

	// If DB had cards, return them
	if len(cards) > 0 {
		return cards, nil
	}

	if len(memCards) > 0 {
		out := make([]domain.SavedCard, len(memCards))
		for i, c := range memCards {
			out[i] = c
			if s.hasOriginalImage(c.ID, "front") {
				out[i].OriginalCardImageURL = originalImageAPIPath(c.ID.String(), "front")
			}
			if s.hasOriginalImage(c.ID, "back") {
				out[i].OriginalBackImageURL = originalImageAPIPath(c.ID.String(), "back")
			}
		}
		return out, nil
	}

	// Return empty non-nil slice
	return cards, nil
}

func (s *CardService) CreateSavedCard(ctx context.Context, userID uuid.UUID, card domain.SavedCard) (*domain.SavedCard, error) {
	card.ID = uuid.New()
	card.UserID = userID
	card.CreatedAt = time.Now()
	card.UpdatedAt = time.Now()
	if card.ExtractStatus == "" {
		card.ExtractStatus = "extracted"
	}
	if card.ContactType == "" {
		card.ContactType = "business"
	}

	notesToStore := card.Notes
	if card.GSTIN != "" {
		notesToStore = "__GST__:" + card.GSTIN + "\n" + notesToStore
	}

	var pendingImage []byte
	var pendingContentType string
	if strings.HasPrefix(card.OriginalCardImageURL, "data:") {
		if raw, ct, err := decodeDataURL(card.OriginalCardImageURL); err == nil {
			pendingImage = raw
			pendingContentType = ct
		}
		card.OriginalCardImageURL = ""
	}

	// 1. Save to in-memory user vault
	s.vaultMutex.Lock()
	s.memoryVault[userID] = append([]domain.SavedCard{card}, s.memoryVault[userID]...)
	s.vaultMutex.Unlock()

	// 2. Save to PostgreSQL if connected
	if s.db != nil && s.db.Pool != nil {
		// Ensure user exists in users table to satisfy foreign key
		_, _ = s.db.Pool.Exec(ctx, `
			INSERT INTO users (id, phone, name, city, state, country, role, plan, status, free_scans_remaining)
			VALUES ($1, '+910000000000', 'CardFlow User', 'Coimbatore', 'Tamil Nadu', 'IN', 'user', 'free', 'active', 30)
			ON CONFLICT (id) DO NOTHING
		`, userID)

		_, err := s.db.Pool.Exec(ctx, `
			INSERT INTO saved_cards (
				id, user_id, person_name, designation, company, website,
				notes, met_context, contact_type, extract_status, gstin, source
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'business', 'extracted', NULLIF($9, ''), 'SCANNED')
			ON CONFLICT (id) DO UPDATE SET
				person_name = EXCLUDED.person_name,
				company = EXCLUDED.company,
				designation = EXCLUDED.designation,
				website = EXCLUDED.website,
				notes = EXCLUDED.notes,
				gstin = EXCLUDED.gstin
		`, card.ID, userID, card.PersonName, card.Designation, card.Company, card.Website, notesToStore, card.MetContext, card.GSTIN)
		if err != nil {
			return nil, fmt.Errorf("save card: %w", err)
		}

		// Insert phone numbers
		for _, p := range card.Phones {
			_, _ = s.db.Pool.Exec(ctx, `
				INSERT INTO saved_card_phones (id, saved_card_id, raw_phone, phone_e164, phone_type, is_whatsapp)
				VALUES ($1, $2, $3, $4, $5, $6)
			`, uuid.New(), card.ID, p.Raw, p.E164, p.Type, p.IsWhatsApp)
		}

		// Insert emails
		for _, em := range card.Emails {
			_, _ = s.db.Pool.Exec(ctx, `
				INSERT INTO saved_card_emails (id, saved_card_id, email)
				VALUES ($1, $2, $3)
			`, uuid.New(), card.ID, em)
		}

		// Insert address
		if card.RawAddress != "" {
			_, _ = s.db.Pool.Exec(ctx, `
				INSERT INTO saved_card_addresses (saved_card_id, raw_address)
				VALUES ($1, $2)
				ON CONFLICT (saved_card_id) DO UPDATE SET raw_address = EXCLUDED.raw_address
			`, card.ID, card.RawAddress)
		}

		// Insert tags
		for _, t := range card.Tags {
			tagID := uuid.New()
			_ = s.db.Pool.QueryRow(ctx, `
				INSERT INTO tags (id, user_id, name, kind) VALUES ($1, $2, $3, 'custom')
				ON CONFLICT (user_id, name) DO UPDATE SET name = EXCLUDED.name RETURNING id
			`, tagID, userID, t).Scan(&tagID)

			_, _ = s.db.Pool.Exec(ctx, `
				INSERT INTO saved_card_tags (saved_card_id, tag_id) VALUES ($1, $2)
				ON CONFLICT DO NOTHING
			`, card.ID, tagID)
		}
	}

	if len(pendingImage) > 0 {
		_ = s.persistOriginalImage(ctx, userID, card.ID, pendingImage, pendingContentType, "front")
	}

	if s.hasOriginalImage(card.ID, "front") {
		card.OriginalCardImageURL = originalImageAPIPath(card.ID.String(), "front")
		s.vaultMutex.Lock()
		for i := range s.memoryVault[userID] {
			if s.memoryVault[userID][i].ID == card.ID {
				s.memoryVault[userID][i].OriginalCardImageURL = card.OriginalCardImageURL
				break
			}
		}
		s.vaultMutex.Unlock()
	}

	return &card, nil
}

func (s *CardService) hasOriginalImage(cardID uuid.UUID, side string) bool {
	side = normalizeSide(side)
	s.imageMutex.RLock()
	_, ok := s.memoryImages[imageMemKey(cardID, side)]
	s.imageMutex.RUnlock()
	if ok {
		return true
	}
	if s.db != nil && s.db.Pool != nil {
		var exists bool
		_ = s.db.Pool.QueryRow(context.Background(), `
			SELECT EXISTS(
				SELECT 1 FROM saved_card_images
				WHERE saved_card_id = $1 AND side = $2
				  AND (
				    (image_data IS NOT NULL AND length(image_data) > 0)
				    OR object_key <> ''
				  )
			)
		`, cardID, side).Scan(&exists)
		if exists {
			return true
		}
	}
	return false
}

func (s *CardService) persistOriginalImage(ctx context.Context, userID, cardID uuid.UUID, data []byte, contentType, side string) error {
	if len(data) == 0 {
		return fmt.Errorf("empty image")
	}
	if contentType == "" {
		contentType = "image/jpeg"
	}
	side = normalizeSide(side)

	objectKey := imageObjectKey(userID.String(), cardID.String(), side)

	s.imageMutex.Lock()
	s.memoryImages[imageMemKey(cardID, side)] = append([]byte(nil), data...)
	s.imageMutex.Unlock()

	localPath := s.localImagePath(userID.String(), cardID.String(), side)
	if err := os.MkdirAll(filepath.Dir(localPath), 0o755); err == nil {
		_ = os.WriteFile(localPath, data, 0o644)
	}

	if s.db != nil && s.db.Pool != nil {
		_, _ = s.db.Pool.Exec(ctx, `
			DELETE FROM saved_card_images WHERE saved_card_id = $1 AND side = $2
		`, cardID, side)
		_, err := s.db.Pool.Exec(ctx, `
			INSERT INTO saved_card_images (id, saved_card_id, side, object_key, bytes, image_data, content_type)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
		`, uuid.New(), cardID, side, objectKey, len(data), data, contentType)
		if err != nil {
			_, err2 := s.db.Pool.Exec(ctx, `
				INSERT INTO saved_card_images (id, saved_card_id, side, object_key, bytes)
				VALUES ($1, $2, $3, $4, $5)
			`, uuid.New(), cardID, side, objectKey, len(data))
			if err2 != nil {
				return fmt.Errorf("save image to database: %w", err)
			}
		}
	}

	if s.s3 != nil {
		if err := s.s3.PutObject(ctx, objectKey, data, contentType); err != nil {
			slog.Warn("S3 put skipped; image already stored in database", "error", err)
		}
	}
	return nil
}

func (s *CardService) GetOriginalImage(ctx context.Context, userID, cardID uuid.UUID, side string) ([]byte, string, error) {
	side = normalizeSide(side)
	s.imageMutex.RLock()
	if data, ok := s.memoryImages[imageMemKey(cardID, side)]; ok {
		s.imageMutex.RUnlock()
		return data, "image/jpeg", nil
	}
	s.imageMutex.RUnlock()

	if s.db != nil && s.db.Pool != nil {
		var imageData []byte
		var contentType string
		var objectKey string
		err := s.db.Pool.QueryRow(ctx, `
			SELECT image_data, COALESCE(NULLIF(content_type, ''), 'image/jpeg'), object_key
			FROM saved_card_images
			WHERE saved_card_id = $1 AND side = $2
			ORDER BY created_at DESC LIMIT 1
		`, cardID, side).Scan(&imageData, &contentType, &objectKey)
		if err == nil && len(imageData) > 0 {
			if contentType == "" {
				contentType = "image/jpeg"
			}
			return imageData, contentType, nil
		}
		if err == nil && objectKey != "" && s.s3 != nil {
			if bytes, ct, s3err := s.s3.GetObject(ctx, objectKey); s3err == nil && len(bytes) > 0 {
				return bytes, ct, nil
			}
		}
	}

	localPath := s.localImagePath(userID.String(), cardID.String(), side)
	if data, err := os.ReadFile(localPath); err == nil && len(data) > 0 {
		return data, "image/jpeg", nil
	}

	return nil, "", fmt.Errorf("image not found")
}

func (s *CardService) UpdateSavedCard(ctx context.Context, userID, cardID uuid.UUID, patch domain.SavedCard) (*domain.SavedCard, error) {
	if !s.CardBelongsToUser(ctx, userID, cardID) {
		return nil, fmt.Errorf("card not found")
	}

	if s.db != nil && s.db.Pool != nil {
		notesToStore := patch.Notes
		if patch.GSTIN != "" {
			notesToStore = "__GST__:" + patch.GSTIN + "\n" + notesToStore
		}
		_, err := s.db.Pool.Exec(ctx, `
			UPDATE saved_cards SET
				person_name = COALESCE(NULLIF($2, ''), person_name),
				designation = $3,
				company = COALESCE(NULLIF($4, ''), company),
				website = $5,
				notes = $6,
				gstin = NULLIF($7, ''),
				updated_at = NOW()
			WHERE id = $1 AND user_id = $8 AND deleted_at IS NULL
		`, cardID, patch.PersonName, patch.Designation, patch.Company, patch.Website, notesToStore, patch.GSTIN, userID)
		if err != nil {
			return nil, err
		}
		if patch.RawAddress != "" {
			_, _ = s.db.Pool.Exec(ctx, `
				INSERT INTO saved_card_addresses (saved_card_id, raw_address)
				VALUES ($1, $2)
				ON CONFLICT (saved_card_id) DO UPDATE SET raw_address = EXCLUDED.raw_address
			`, cardID, patch.RawAddress)
		}
		if len(patch.Phones) > 0 {
			_, _ = s.db.Pool.Exec(ctx, `DELETE FROM saved_card_phones WHERE saved_card_id = $1`, cardID)
			for _, p := range patch.Phones {
				_, _ = s.db.Pool.Exec(ctx, `
					INSERT INTO saved_card_phones (id, saved_card_id, raw_phone, phone_e164, phone_type, is_whatsapp)
					VALUES ($1, $2, $3, $4, $5, $6)
				`, uuid.New(), cardID, p.Raw, p.E164, p.Type, p.IsWhatsApp)
			}
		}
		if len(patch.Emails) > 0 {
			_, _ = s.db.Pool.Exec(ctx, `DELETE FROM saved_card_emails WHERE saved_card_id = $1`, cardID)
			for _, em := range patch.Emails {
				_, _ = s.db.Pool.Exec(ctx, `
					INSERT INTO saved_card_emails (id, saved_card_id, email) VALUES ($1, $2, $3)
				`, uuid.New(), cardID, em)
			}
		}
	}

	s.vaultMutex.Lock()
	for i := range s.memoryVault[userID] {
		if s.memoryVault[userID][i].ID == cardID {
			c := s.memoryVault[userID][i]
			if patch.PersonName != "" {
				c.PersonName = patch.PersonName
			}
			c.Designation = patch.Designation
			if patch.Company != "" {
				c.Company = patch.Company
			}
			c.Website = patch.Website
			c.GSTIN = patch.GSTIN
			if patch.RawAddress != "" {
				c.RawAddress = patch.RawAddress
			}
			if len(patch.Phones) > 0 {
				c.Phones = patch.Phones
			}
			if len(patch.Emails) > 0 {
				c.Emails = patch.Emails
			}
			c.UpdatedAt = time.Now()
			s.memoryVault[userID][i] = c
			break
		}
	}
	s.vaultMutex.Unlock()

	cards, _ := s.GetSavedCards(ctx, userID)
	for i := range cards {
		if cards[i].ID == cardID {
			return &cards[i], nil
		}
	}
	patch.ID = cardID
	patch.UserID = userID
	return &patch, nil
}

func (s *CardService) CardBelongsToUser(ctx context.Context, userID, cardID uuid.UUID) bool {
	s.vaultMutex.RLock()
	for _, c := range s.memoryVault[userID] {
		if c.ID == cardID {
			s.vaultMutex.RUnlock()
			return true
		}
	}
	s.vaultMutex.RUnlock()

	if s.db != nil && s.db.Pool != nil {
		var owner uuid.UUID
		err := s.db.Pool.QueryRow(ctx, `
			SELECT user_id FROM saved_cards WHERE id = $1 AND deleted_at IS NULL
		`, cardID).Scan(&owner)
		return err == nil && owner == userID
	}
	return false
}

func (s *CardService) ProcessOCR(ctx context.Context, userID uuid.UUID, imageKey string) (*extractor.ExtractedCardData, error) {
	return s.extractor.ExtractCardFromImage(ctx, imageKey)
}
