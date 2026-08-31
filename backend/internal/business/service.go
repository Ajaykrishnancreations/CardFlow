package business

import (
	"context"
	"errors"
	"strings"

	"cardflow-backend/internal/database"
	"cardflow-backend/internal/domain"
	"github.com/google/uuid"
)

type BusinessService struct {
	db *database.DB
}

func NewBusinessService(db *database.DB) *BusinessService {
	return &BusinessService{db: db}
}

type CreateBusinessInput struct {
	Name            string   `json:"name"`
	Description     string   `json:"description"`
	CategoryID      string   `json:"category_id"`
	AddressLine1    string   `json:"address_line1"`
	Locality        string   `json:"locality"`
	City            string   `json:"city"`
	State           string   `json:"state"`
	Pincode         string   `json:"pincode"`
	Latitude        float64  `json:"latitude"`
	Longitude       float64  `json:"longitude"`
	Phone           string   `json:"phone"`
	Email           string   `json:"email"`
	Website         string   `json:"website"`
	GSTIN           string   `json:"gstin"`
	Services        []string `json:"services"`
	YearEstablished int      `json:"year_established"`
}

func (s *BusinessService) GetOwnerBusinesses(ctx context.Context, ownerUserID uuid.UUID) ([]domain.Business, error) {
	if s.db == nil || s.db.Pool == nil {
		// Fallback for DEV mode
		return []domain.Business{
			{
				ID:              uuid.MustParse("00000000-0000-0000-0000-0000000000b1"),
				OwnerUserID:     ownerUserID,
				Name:            "Kovai Precision Tools",
				Slug:            "kovai-precision-tools",
				Description:     "Leading manufacturers of CNC machined precision components.",
				PrimaryCategory: "Manufacturing",
				AddressLine1:    "42, SIDCO Industrial Estate",
				City:            "Coimbatore",
				State:           "Tamil Nadu",
				Pincode:         "641004",
				Status:          "live",
				Verification:    "gst",
				Listing:         "listed",
				ViewsCount:      248,
				EnquiriesCount:  14,
				Services:        []string{"CNC Milling", "Hydraulic Valves"},
				Phones:          []string{"+919443012345"},
			},
			{
				ID:              uuid.MustParse("00000000-0000-0000-0000-0000000000b2"),
				OwnerUserID:     ownerUserID,
				Name:            "Apex Infotech Solutions",
				Slug:            "apex-infotech-solutions",
				Description:     "Enterprise ERP, Cloud Migration, and Custom Apps.",
				PrimaryCategory: "IT & Software",
				AddressLine1:    "105, Cross Cut Road",
				City:            "Coimbatore",
				State:           "Tamil Nadu",
				Pincode:         "641018",
				Status:          "live",
				Verification:    "gst",
				Listing:         "listed",
				ViewsCount:      512,
				EnquiriesCount:  28,
				Services:        []string{"Cloud ERP", "React Native Apps"},
				Phones:          []string{"+919842155678"},
			},
		}, nil
	}

	rows, err := s.db.Pool.Query(ctx, `
		SELECT b.id, b.owner_user_id, b.name, b.slug, COALESCE(b.description, ''), b.primary_category_id,
		       c.name as cat_name, b.address_line1, b.city, b.state, b.pincode,
		       ST_Y(b.location::geometry) as lat, ST_X(b.location::geometry) as lng,
		       b.status::text, b.verification::text, b.listing::text, b.completeness, b.created_at, b.updated_at
		FROM businesses b
		JOIN categories c ON c.id = b.primary_category_id
		WHERE b.owner_user_id = $1 AND b.status != 'removed'
		ORDER BY b.created_at DESC
	`, ownerUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var businesses []domain.Business
	for rows.Next() {
		var b domain.Business
		var catName, status, verif, list string
		err := rows.Scan(
			&b.ID, &b.OwnerUserID, &b.Name, &b.Slug, &b.Description, &b.PrimaryCategoryID,
			&catName, &b.AddressLine1, &b.City, &b.State, &b.Pincode,
			&b.Latitude, &b.Longitude,
			&status, &verif, &list, &b.Completeness, &b.CreatedAt, &b.UpdatedAt,
		)
		if err == nil {
			b.PrimaryCategory = catName
			b.Status = status
			b.Verification = verif
			b.Listing = list
			b.ViewsCount = 120
			b.EnquiriesCount = 8
			businesses = append(businesses, b)
		}
	}

	return businesses, nil
}

func (s *BusinessService) CreateBusiness(ctx context.Context, ownerUserID uuid.UUID, in CreateBusinessInput) (*domain.Business, error) {
	slug := strings.ToLower(strings.ReplaceAll(strings.TrimSpace(in.Name), " ", "-")) + "-" + uuid.New().String()[:4]
	newID := uuid.New()

	catUUID, err := uuid.Parse(in.CategoryID)
	if err != nil {
		// default to manufacturing category
		catUUID = uuid.MustParse("c0000000-0000-0000-0000-000000000001")
	}

	if in.Latitude == 0 && in.Longitude == 0 {
		in.Latitude = 11.0168
		in.Longitude = 76.9558
	}

	if s.db != nil && s.db.Pool != nil {
		_, err := s.db.Pool.Exec(ctx, `
			INSERT INTO businesses (
				id, owner_user_id, name, slug, description, primary_category_id,
				address_line1, locality, city, state, pincode, country,
				location, website, email, gstin, status, verification, listing, completeness
			) VALUES (
				$1, $2, $3, $4, $5, $6,
				$7, $8, $9, $10, $11, 'IN',
				ST_SetSRID(ST_MakePoint($12, $13), 4326)::geography,
				$14, $15, $16, 'live', 'pending', 'listed', 80
			)
		`, newID, ownerUserID, in.Name, slug, in.Description, catUUID,
			in.AddressLine1, in.Locality, in.City, in.State, in.Pincode,
			in.Longitude, in.Latitude,
			in.Website, in.Email, in.GSTIN,
		)
		if err != nil {
			return nil, err
		}

		// Insert digital card
		_, _ = s.db.Pool.Exec(ctx, `
			INSERT INTO digital_cards (business_id, template, brand_color, qr_slug)
			VALUES ($1, 'modern', '#1E40AF', $2)
		`, newID, slug)

		// Insert phone
		if in.Phone != "" {
			_, _ = s.db.Pool.Exec(ctx, `
				INSERT INTO business_phones (business_id, phone, is_whatsapp, otp_verified)
				VALUES ($1, $2, TRUE, TRUE)
			`, newID, in.Phone)
		}
	}

	return &domain.Business{
		ID:                newID,
		OwnerUserID:       ownerUserID,
		Name:              in.Name,
		Slug:              slug,
		Description:       in.Description,
		PrimaryCategoryID: catUUID,
		AddressLine1:      in.AddressLine1,
		City:              in.City,
		State:             in.State,
		Pincode:           in.Pincode,
		Status:            "live",
		Verification:      "pending",
		Listing:           "listed",
		Completeness:      80,
		Services:          in.Services,
	}, nil
}

func (s *BusinessService) VerifyOwnerAccess(ctx context.Context, ownerUserID, businessID uuid.UUID) error {
	if s.db == nil || s.db.Pool == nil {
		return nil
	}

	var count int
	err := s.db.Pool.QueryRow(ctx, `
		SELECT COUNT(1) FROM businesses WHERE id = $1 AND owner_user_id = $2
	`, businessID, ownerUserID).Scan(&count)
	if err != nil || count == 0 {
		return errors.New("access denied: you do not own this business")
	}
	return nil
}
