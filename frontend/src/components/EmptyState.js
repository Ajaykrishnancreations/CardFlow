import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PackageOpen } from 'lucide-react';
import { colors, spacing, typography } from '../theme';
import { Button } from './Button';

export function EmptyState({
  icon: Icon = PackageOpen,
  title = 'No items found',
  description = 'There is nothing here yet.',
  actionTitle,
  onAction,
  compact = false
}) {
  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={[styles.iconCircle, compact && styles.iconCircleCompact]}>
        <Icon size={compact ? 22 : 32} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={[styles.description, compact && styles.descriptionCompact]}>{description}</Text>
      {actionTitle && onAction ? (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={styles.actionButton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginVertical: spacing.md
  },
  containerCompact: {
    paddingVertical: spacing.lg,
    marginVertical: spacing.sm
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm
  },
  iconCircleCompact: {
    width: 44,
    height: 44,
    borderRadius: 22
  },
  title: {
    ...typography.titleSmall,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: 4,
    textAlign: 'center'
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    maxWidth: 280
  },
  descriptionCompact: {
    marginBottom: 0
  },
  actionButton: {
    marginTop: spacing.xs
  }
});
