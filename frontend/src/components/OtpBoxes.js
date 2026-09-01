import React, { useRef, useEffect } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme';

export function OtpBoxes({ value = '', onChange, onComplete, length = 6, autoFocus = false }) {
  const refs = useRef([]);
  const completedRef = useRef('');

  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => refs.current[0]?.focus?.(), 120);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (value.length === length && onComplete && completedRef.current !== value) {
      completedRef.current = value;
      onComplete(value);
    }
    if (value.length < length) completedRef.current = '';
  }, [value, length, onComplete]);

  const handleChange = (text, index) => {
    const cleaned = String(text).replace(/[^0-9]/g, '');
    // Paste full code into any box
    if (cleaned.length > 1) {
      const joined = cleaned.slice(0, length);
      onChange(joined);
      const focusIdx = Math.min(joined.length, length - 1);
      setTimeout(() => refs.current[focusIdx]?.focus?.(), 0);
      return;
    }
    const digit = cleaned.slice(-1);
    const next = digits.slice();
    next[index] = digit;
    const joined = next.join('').replace(/\s/g, '');
    onChange(joined);

    if (digit && index < length - 1) {
      refs.current[index + 1]?.focus?.();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.nativeEvent?.key === 'Backspace' && !digits[index] && index > 0) {
      refs.current[index - 1]?.focus?.();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((d, i) => (
        <TextInput
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={(e) => handleKeyDown(e, i)}
          keyboardType="numeric"
          maxLength={6}
          autoComplete="one-time-code"
          textContentType="oneTimeCode"
          style={[styles.box, d ? styles.boxFilled : null, i === value.length ? styles.boxActive : null]}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginVertical: spacing.lg
  },
  box: {
    width: 44,
    height: 52,
    borderRadius: radii.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: colors.textPrimary,
    outlineStyle: 'none'
  },
  boxFilled: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight
  },
  boxActive: {
    borderColor: colors.primary,
    borderWidth: 1.5
  }
});
