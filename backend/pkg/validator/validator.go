package validator

import (
	"regexp"
	"strings"
)

var (
	phoneRegex = regexp.MustCompile(`^(\+91)?[6-9]\d{9}$`)
	gstinRegex = regexp.MustCompile(`^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`)
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
)

func NormalizePhone(phone string) (string, bool) {
	cleaned := strings.ReplaceAll(phone, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	cleaned = strings.TrimSpace(cleaned)

	if !phoneRegex.MatchString(cleaned) {
		return "", false
	}

	if !strings.HasPrefix(cleaned, "+91") {
		cleaned = "+91" + cleaned
	}
	return cleaned, true
}

func IsValidGSTIN(gstin string) bool {
	clean := strings.ToUpper(strings.TrimSpace(gstin))
	return gstinRegex.MatchString(clean)
}

func IsValidEmail(email string) bool {
	return emailRegex.MatchString(strings.TrimSpace(email))
}

func SanitizeText(s string) string {
	return strings.TrimSpace(s)
}
