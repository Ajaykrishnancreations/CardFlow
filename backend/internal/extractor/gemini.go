package extractor

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"cardflow-backend/internal/config"
)

type ExtractedCardData struct {
	PersonName     string              `json:"person_name"`
	Designation    string              `json:"designation"`
	Company        string              `json:"company"`
	Website        string              `json:"website"`
	Phones         []ExtractedPhone    `json:"phones"`
	Emails         []string            `json:"emails"`
	RawAddress     string              `json:"raw_address"`
	StructuredAddr *StructuredAddress  `json:"structured_address,omitempty"`
	Tags           []string            `json:"tags"`
	Confidences    map[string]float64  `json:"confidences"`
	LatencyMs      int                 `json:"latency_ms"`
}

type ExtractedPhone struct {
	Raw        string  `json:"raw"`
	E164       string  `json:"e164"`
	Type       string  `json:"type"`
	Usage      string  `json:"usage"`
	IsWhatsApp bool    `json:"is_whatsapp"`
	Confidence float64 `json:"confidence"`
}

type StructuredAddress struct {
	Building string `json:"building,omitempty"`
	Street   string `json:"street,omitempty"`
	Locality string `json:"locality,omitempty"`
	City     string `json:"city,omitempty"`
	District string `json:"district,omitempty"`
	State    string `json:"state,omitempty"`
	Pincode  string `json:"pincode,omitempty"`
	Country  string `json:"country,omitempty"`
}

type GeminiService struct {
	cfg *config.Config
}

func NewGeminiService(cfg *config.Config) *GeminiService {
	return &GeminiService{cfg: cfg}
}

// ExtractCardFromImage processes a business card image and returns structured data with confidence scores
func (g *GeminiService) ExtractCardFromImage(ctx context.Context, imageObjectKey string) (*ExtractedCardData, error) {
	startTime := time.Now()

	// If DevMock or Vertex credentials not configured, use robust mock extraction
	if g.cfg.DevMockGemini || g.cfg.GCPServiceAccountJSON == "" {
		slog.Info("Running Gemini Flash Lite OCR Extractor (Dev Mock)", "imageKey", imageObjectKey)
		time.Sleep(200 * time.Millisecond) // Simulate AI vision processing latency

		latency := int(time.Since(startTime).Milliseconds())
		return &ExtractedCardData{
			PersonName:  "R. Rajesh Kumar",
			Designation: "Managing Director",
			Company:     "Coimbatore Precision Works Pvt Ltd",
			Website:     "https://coimbatoreprecision.com",
			Phones: []ExtractedPhone{
				{
					Raw:        "+91 98421 98765",
					E164:       "+919842198765",
					Type:       "work",
					Usage:      "official",
					IsWhatsApp: true,
					Confidence: 0.98,
				},
				{
					Raw:        "0422-2589631",
					E164:       "+914222589631",
					Type:       "landline",
					Usage:      "office",
					IsWhatsApp: false,
					Confidence: 0.92,
				},
			},
			Emails:     []string{"rajesh@coimbatoreprecision.com", "sales@coimbatoreprecision.com"},
			RawAddress: "124/B, SF No. 45, SIDCO Industrial Estate, Kurichi, Coimbatore, Tamil Nadu 641021",
			StructuredAddr: &StructuredAddress{
				Building: "124/B, SF No. 45",
				Street:   "SIDCO Industrial Estate",
				Locality: "Kurichi",
				City:     "Coimbatore",
				District: "Coimbatore",
				State:    "Tamil Nadu",
				Pincode:  "641021",
				Country:  "IN",
			},
			Tags: []string{"Manufacturing", "Industrial", "Coimbatore"},
			Confidences: map[string]float64{
				"person_name":  0.96,
				"designation":  0.94,
				"company":      0.99,
				"phones":       0.95,
				"emails":       0.98,
				"raw_address":  0.91,
			},
			LatencyMs: latency,
		}, nil
	}

	// Production Vertex AI / Gemini Vision invocation would go here
	return nil, fmt.Errorf("vertex AI provider not configured")
}

func (g *GeminiService) PromptTemplate() string {
	return `Analyze this business card image and output strictly valid JSON conforming to CardFlow OCR schema.`
}

func ParseJSONResponse(raw string) (*ExtractedCardData, error) {
	clean := strings.TrimPrefix(raw, "```json")
	clean = strings.TrimPrefix(clean, "```")
	clean = strings.TrimSuffix(clean, "```")
	clean = strings.TrimSpace(clean)

	var data ExtractedCardData
	if err := json.Unmarshal([]byte(clean), &data); err != nil {
		return nil, err
	}
	return &data, nil
}
