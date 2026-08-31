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
  onAction
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon size={32} color={colors.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="outline"
          size="sm"
          style={styles.actionButton}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
    marginVertical: spacing.xl
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  title: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    textAlign: 'center'
  },
  description: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
    maxWidth: 280
  },
  actionButton: {
    marginTop: spacing.xs
  }
});
