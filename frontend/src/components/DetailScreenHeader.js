import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react';
import { colors, spacing, typography } from '../theme';

/** Sticky mobile header with back navigation for detail / stack screens */
export function DetailScreenHeader({ title, subtitle, onBack, rightAction }) {
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
        <View style={styles.rightSlot}>{rightAction || null}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.bgMuted,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    zIndex: 20
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs
  },
  titleBlock: { flex: 1, justifyContent: 'center' },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: typography.titleSmall.fontFamily
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 1
  },
  rightSlot: { width: 44, alignItems: 'flex-end', justifyContent: 'center' }
});
