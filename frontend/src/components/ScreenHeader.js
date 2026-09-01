import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft } from 'lucide-react';
import { colors, spacing, typography } from '../theme';

export function ScreenHeader({ title, subtitle, showBack, onBack, rightAction }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {showBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backSpacer} />
        )}
        {rightAction || <View style={styles.backSpacer} />}
      </View>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.divider} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, backgroundColor: colors.bgCard },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  backBtn: { width: 32, height: 32, alignItems: 'flex-start', justifyContent: 'center' },
  backSpacer: { width: 32 },
  title: { ...typography.titleMedium, marginBottom: 4 },
  subtitle: { ...typography.bodyMedium, marginBottom: spacing.md },
  divider: { height: 1, backgroundColor: colors.border, marginTop: spacing.xs }
});
