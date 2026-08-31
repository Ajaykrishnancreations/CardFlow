package validator

import "testing"

func TestNormalizePhone(t *testing.T) {
	tests := []struct {
		input    string
		expected string
		valid    bool
	}{
		{"9876543210", "+919876543210", true},
		{"+91 98765 43210", "+919876543210", true},
		{"12345", "", false},
		{"abcdefghij", "", false},
		{"9999988888", "+919999988888", true},
	}

	for _, tt := range tests {
		res, ok := NormalizePhone(tt.input)
		if ok != tt.valid {
			t.Errorf("NormalizePhone(%s) valid = %v, want %v", tt.input, ok, tt.valid)
		}
		if ok && res != tt.expected {
			t.Errorf("NormalizePhone(%s) = %s, want %s", tt.input, res, tt.expected)
		}
	}
}

func TestIsValidGSTIN(t *testing.T) {
	validGSTIN := "33AAAAA0000A1Z5"
	if !IsValidGSTIN(validGSTIN) {
		t.Errorf("Expected GSTIN %s to be valid", validGSTIN)
	}

	invalidGSTIN := "INVALID_GST"
	if IsValidGSTIN(invalidGSTIN) {
		t.Errorf("Expected GSTIN %s to be invalid", invalidGSTIN)
	}
}
