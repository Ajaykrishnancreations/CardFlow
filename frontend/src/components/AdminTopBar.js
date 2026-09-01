import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Shield } from 'lucide-react';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';

/** Sticky admin header — identity only; logout lives on Profile tab */
export function AdminTopBar() {
  const { user } = useAuth();

  return (
    <View style={styles.wrap}>
      <View style={styles.iconBadge}>
        <Shield size={16} color={colors.primary} strokeWidth={2.2} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.roleLabel}>In-App Admin Console</Text>
        <Text style={styles.name} numberOfLines={1}>{user?.name || 'Administrator'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 52,
    zIndex: 20
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  roleLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  name: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: 1
  }
});
