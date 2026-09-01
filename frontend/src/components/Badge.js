import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Check } from 'lucide-react';
import { colors, radii, spacing } from '../theme';

/**
 * Soft status badge. Prefer type="gst" only when verification === 'gst'.
 * type="gstPending" for registered-but-not-verified.
 */
export function Badge({
  type = 'default',
  label,
  showIcon = true,
  style,
  textStyle
}) {
  const config = (() => {
    switch (type) {
      case 'gst':
        return {
          bg: 'rgba(184, 148, 69, 0.12)',
          text: colors.gold,
          border: 'transparent',
          borderWidth: 0,
          Icon: Check,
          defaultLabel: 'GST Verified'
        };
      case 'gstPending':
        return {
          bg: colors.bgMutedDark,
          text: colors.textSecondary,
          border: 'transparent',
          borderWidth: 0,
          Icon: null,
          defaultLabel: 'GST not verified'
        };
      case 'success':
        return {
          bg: colors.successLight,
          text: colors.success,
          border: 'transparent',
          borderWidth: 0,
          Icon: Check,
          defaultLabel: 'Active'
        };
      case 'warning':
        return {
          bg: colors.warningLight,
          text: colors.warning,
          border: 'transparent',
          borderWidth: 0,
          Icon: null,
          defaultLabel: 'Pending'
        };
      case 'danger':
        return {
          bg: colors.dangerLight,
          text: colors.danger,
          border: 'transparent',
          borderWidth: 0,
          Icon: null,
          defaultLabel: 'Suspended'
        };
      default:
        return {
          bg: colors.bgMutedDark,
          text: colors.textSecondary,
          border: 'transparent',
          borderWidth: 0,
          Icon: null,
          defaultLabel: 'Standard'
        };
    }
  })();

  const IconComponent = config.Icon;
  const displayLabel = label || config.defaultLabel;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
          borderWidth: config.borderWidth
        },
        style
      ]}
    >
      {showIcon && IconComponent ? (
        <IconComponent size={11} color={config.text} strokeWidth={2.5} style={styles.icon} />
      ) : null}
      <Text style={[styles.text, { color: config.text }, textStyle]}>{displayLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.badge,
    alignSelf: 'flex-start'
  },
  icon: { marginRight: 4 },
  text: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.15
  }
});
