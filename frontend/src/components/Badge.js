import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShieldCheck, CheckCircle2, Building2 } from 'lucide-react';
import { colors, radii, spacing } from '../theme';

export function Badge({
  type = 'default', // 'gst' | 'pan' | 'id' | 'success' | 'warning' | 'danger' | 'info' | 'default'
  label,
  showIcon = true,
  style,
  textStyle
}) {
  const getBadgeConfig = () => {
    switch (type) {
      case 'gst':
        return {
          bg: colors.verifiedGstBg,
          text: colors.verifiedGst,
          border: colors.verifiedGst,
          Icon: Building2,
          defaultLabel: 'GST Verified'
        };
      case 'pan':
        return {
          bg: colors.verifiedGstBg,
          text: colors.verifiedGst,
          border: colors.verifiedGst,
          Icon: ShieldCheck,
          defaultLabel: 'PAN Verified'
        };
      case 'id':
        return {
          bg: colors.verifiedIdBg,
          text: colors.verifiedId,
          border: colors.verifiedId,
          Icon: CheckCircle2,
          defaultLabel: 'ID Verified'
        };
      case 'success':
        return {
          bg: colors.successLight,
          text: colors.success,
          border: colors.success,
          Icon: CheckCircle2,
          defaultLabel: 'Active'
        };
      case 'warning':
        return {
          bg: colors.warningLight,
          text: colors.warning,
          border: colors.warning,
          Icon: null,
          defaultLabel: 'Pending'
        };
      case 'danger':
        return {
          bg: colors.dangerLight,
          text: colors.danger,
          border: colors.danger,
          Icon: null,
          defaultLabel: 'Suspended'
        };
      case 'default':
      default:
        return {
          bg: colors.bgMuted,
          text: colors.textSecondary,
          border: colors.border,
          Icon: null,
          defaultLabel: 'Standard'
        };
    }
  };

  const config = getBadgeConfig();
  const IconComponent = config.Icon;
  const displayLabel = label || config.defaultLabel;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: config.bg, borderColor: config.border },
        style
      ]}
    >
      {showIcon && IconComponent && (
        <IconComponent size={12} color={config.text} style={styles.icon} />
      )}
      <Text style={[styles.text, { color: config.text }, textStyle]}>
        {displayLabel}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    alignSelf: 'flex-start'
  },
  icon: {
    marginRight: 4
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2
  }
});
