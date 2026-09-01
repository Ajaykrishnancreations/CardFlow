import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LogOut, Shield } from 'lucide-react';
import { colors, spacing } from '../theme';
import { useAuth } from '../context/AuthContext';

/** Sticky admin header with identity + logout — shown on all admin tabs */
export function AdminTopBar() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.wrap}>
      <View style={styles.left}>
        <View style={styles.iconBadge}>
          <Shield size={16} color={colors.primary} strokeWidth={2.2} />
        </View>
        <View>
          <Text style={styles.roleLabel}>Admin</Text>
          <Text style={styles.name} numberOfLines={1}>{user?.name || 'Administrator'}</Text>
        </View>
      </View>
      <TouchableOpacity
        onPress={logout}
        style={styles.logoutBtn}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Logout"
      >
        <LogOut size={16} color={colors.danger} strokeWidth={2.2} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 52,
    zIndex: 20
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm
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
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2'
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.danger
  }
});
