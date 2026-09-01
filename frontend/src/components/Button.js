import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, radii, spacing, typography } from '../theme';

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  style,
  textStyle
}) {
  const getContainerStyle = () => {
    switch (variant) {
      case 'secondary': return styles.secondary;
      case 'outline': return styles.outline;
      case 'ghost': return styles.ghost;
      case 'danger': return styles.danger;
      default: return styles.primary;
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'outline': return styles.outlineText;
      case 'ghost': return styles.ghostText;
      case 'danger': return styles.dangerText;
      default: return styles.primaryText;
    }
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'sm': return styles.sizeSm;
      case 'lg': return styles.sizeLg;
      default: return styles.sizeMd;
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, getContainerStyle(), getSizeStyle(), (disabled || loading) && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variant === 'outline' ? colors.primary : '#FFFFFF'} />
      ) : (
        <>
          {Icon && <Icon size={size === 'sm' ? 16 : 18} color={getTextStyle().color} style={styles.icon} />}
          <Text style={[styles.text, getTextStyle(), textStyle]}>{title}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.button,
    cursor: 'pointer',
    userSelect: 'none'
  },
  sizeSm: { paddingVertical: 8, paddingHorizontal: 14 },
  sizeMd: { paddingVertical: 12, paddingHorizontal: 18 },
  sizeLg: { paddingVertical: 14, paddingHorizontal: 22, width: '100%' },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.primaryLight },
  outline: { backgroundColor: 'transparent', borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: colors.dangerLight },
  disabled: { opacity: 0.45, cursor: 'not-allowed' },
  text: { ...typography.button, fontSize: 14 },
  primaryText: { color: '#FFFFFF' },
  outlineText: { color: colors.primary },
  ghostText: { color: colors.primary },
  dangerText: { color: colors.danger },
  icon: { marginRight: spacing.sm }
});
