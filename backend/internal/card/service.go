package card

import (
	"context"
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
}

func NewCardService(db *database.DB, s3 *storage.S3Service, ext *extractor.GeminiService) *CardService {
	return &CardService{
		db:          db,
		s3:          s3,
		extractor:   ext,
		memoryVault: make(map[uuid.UUID][]domain.SavedCard),
	}
}

func (s *CardService) GetSavedCards(ctx context.Context, userID uuid.UUID) ([]domain.SavedCard, error) {
	var cards []domain.SavedCard

	if s.db != nil && s.db.Pool != nil {
		rows, err := s.db.Pool.Query(ctx, `
			SELECT id, user_id, COALESCE(person_name, ''), COALESCE(designation, ''), COALESCE(company, ''),
			       website, COALESCE(notes, ''), COALESCE(met_context, ''), private_rating, contact_type::text,
			       extract_status::text, created_at, updated_at
			FROM saved_cards
			WHERE user_id = $1 AND deleted_at IS NULL
			ORDER BY created_at DESC
		`, userID)
		if err == nil {
			defer rows.Close()
			for rows.Next() {
				var c domain.SavedCard
				var contactType, extractStatus string
				err := rows.Scan(
					&c.ID, &c.UserID, &c.PersonName, &c.Designation, &c.Company,
					&c.Website, &c.Notes, &c.MetContext, &c.PrivateRating, &contactType,
					&extractStatus, &c.CreatedAt, &c.UpdatedAt,
				)
				if err == nil {
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
		return memCards, nil
	}

	// Empty initial state for new users
	return []domain.SavedCard{}, nil
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
				notes, met_context, contact_type, extract_status
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'business', 'extracted')
			ON CONFLICT (id) DO UPDATE SET
				person_name = EXCLUDED.person_name,
				company = EXCLUDED.company,
				designation = EXCLUDED.designation,
				website = EXCLUDED.website,
				notes = EXCLUDED.notes
		`, card.ID, userID, card.PersonName, card.Designation, card.Company, card.Website, card.Notes, card.MetContext)
		if err != nil {
			return &card, nil
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
				INSERT INTO tags (id, name, is_system) VALUES ($1, $2, false)
				ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id
			`, tagID, t).Scan(&tagID)

			_, _ = s.db.Pool.Exec(ctx, `
				INSERT INTO saved_card_tags (saved_card_id, tag_id) VALUES ($1, $2)
				ON CONFLICT DO NOTHING
			`, card.ID, tagID)
		}
	}

	return &card, nil
}

func (s *CardService) ProcessOCR(ctx context.Context, userID uuid.UUID, imageKey string) (*extractor.ExtractedCardData, error) {
	return s.extractor.ExtractCardFromImage(ctx, imageKey)
}
