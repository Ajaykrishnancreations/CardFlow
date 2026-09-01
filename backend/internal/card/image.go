package card

import (
	"encoding/base64"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func decodeDataURL(dataURL string) ([]byte, string, error) {
	if dataURL == "" {
		return nil, "", fmt.Errorf("empty image data")
	}
	contentType := "image/jpeg"
	payload := dataURL

	if strings.HasPrefix(dataURL, "data:") {
		parts := strings.SplitN(dataURL, ",", 2)
		if len(parts) != 2 {
			return nil, "", fmt.Errorf("invalid data URL")
		}
		meta := parts[0]
		payload = parts[1]
		if idx := strings.Index(meta, "image/"); idx >= 0 {
			end := strings.Index(meta[idx:], ";")
			if end > 0 {
				contentType = meta[idx : idx+end]
			} else {
				contentType = strings.TrimPrefix(meta[idx:], "image/")
				if !strings.HasPrefix(contentType, "image/") {
					contentType = "image/" + contentType
				}
			}
		}
		if strings.Contains(meta, "image/png") {
			contentType = "image/png"
		} else if strings.Contains(meta, "image/webp") {
			contentType = "image/webp"
		} else if strings.Contains(meta, "image/jpeg") || strings.Contains(meta, "image/jpg") {
			contentType = "image/jpeg"
		}
	}

	raw, err := base64.StdEncoding.DecodeString(payload)
	if err != nil {
		return nil, "", fmt.Errorf("decode base64: %w", err)
	}
	if len(raw) == 0 {
		return nil, "", fmt.Errorf("empty image bytes")
	}
	return raw, contentType, nil
}

func imageObjectKey(userID, cardID string) string {
	return fmt.Sprintf("cards/%s/original/%s.jpg", userID, cardID)
}

func (s *CardService) localImagePath(userID, cardID string) string {
	base := os.Getenv("CARDFLOW_IMAGE_DIR")
	if base == "" {
		base = "data/card-images"
	}
	return filepath.Join(base, userID, cardID+".jpg")
}

func originalImageAPIPath(cardID string) string {
	return "/api/v1/cards/" + cardID + "/original-image"
}

func extFromContentType(ct string) string {
	switch {
	case strings.Contains(ct, "png"):
		return "png"
	case strings.Contains(ct, "webp"):
		return "webp"
	default:
		return "jpg"
	}
}
