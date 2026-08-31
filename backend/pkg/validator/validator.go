package validator

import (
	"regexp"
	"strings"
)

var (
	// Matches standard Indian numbers with optional +91 and 10 digits, or 10-digit test/standard mobile numbers
	phoneRegex = regexp.MustCompile(`^(\+91)?[1-9]\d{9}$`)
	gstinRegex = regexp.MustCompile(`^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$`)
	emailRegex = regexp.MustCompile(`^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`)
)

func NormalizePhone(phone string) (string, bool) {
	cleaned := strings.ReplaceAll(phone, " ", "")
	cleaned = strings.ReplaceAll(cleaned, "-", "")
	cleaned = strings.ReplaceAll(cleaned, "(", "")
	cleaned = strings.ReplaceAll(cleaned, ")", "")
	cleaned = strings.TrimSpace(cleaned)

	// Strip leading 0 if entered (e.g. 09876543210 -> 9876543210)
	if len(cleaned) == 11 && strings.HasPrefix(cleaned, "0") {
		cleaned = cleaned[1:]
	}

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
