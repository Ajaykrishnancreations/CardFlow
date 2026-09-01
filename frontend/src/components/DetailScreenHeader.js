import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, Home } from 'lucide-react';
import { colors, spacing, typography } from '../theme';

/** Sticky mobile header with back navigation for detail / stack screens */
export function DetailScreenHeader({ title, subtitle, onBack, onHome, rightAction }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backBtn}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <View style={styles.titleBlock}>
          {title ? (
            <Text style={styles.title} numberOfLines={1}>{title}</Text>
          ) : null}
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
          ) : null}
        </View>
        <View style={styles.rightSlot}>
          {rightAction || null}
          {onHome ? (
            <TouchableOpacity
              onPress={onHome}
              style={styles.homeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Go home"
            >
              <Home size={18} color={colors.primary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgMuted,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    zIndex: 20
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2
  },
  titleBlock: { flex: 1, justifyContent: 'center' },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: typography.titleSmall.fontFamily
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 0
  },
  rightSlot: {
    minWidth: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4
  },
  homeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
