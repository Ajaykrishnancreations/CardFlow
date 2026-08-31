import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ArrowLeft, MapPin, Bell, Shield, Briefcase, UserCheck, LogOut } from 'lucide-react';
import { colors, radii, spacing, typography } from '../theme';
import { useAuth } from '../context/AuthContext';

export function Header({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction,
  showLocation = false,
  locationText = 'Coimbatore, TN'
}) {
  const { user, role, logout } = useAuth();

  const getRoleBadge = () => {
    if (role === 'admin') {
      return {
        label: 'ADMIN',
        bg: '#FEE2E2',
        color: '#DC2626',
        Icon: Shield
      };
    }
    if (role === 'owner') {
      return {
        label: 'BUSINESS OWNER',
        bg: '#EFF6FF',
        color: '#2563EB',
        Icon: Briefcase
      };
    }
    return {
      label: 'USER',
      bg: '#F1F5F9',
      color: '#475569',
      Icon: UserCheck
    };
  };

  const roleConfig = getRoleBadge();
  const RoleIcon = roleConfig.Icon;

  return (
    <View style={styles.header}>
      <View style={styles.topRow}>
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
              <ArrowLeft size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          {showLocation ? (
            <View style={styles.locationChip}>
              <MapPin size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.locationText}>{locationText}</Text>
            </View>
          ) : (
            <View>
              <Text style={styles.title}>{title}</Text>
              {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
          )}
        </View>

        <View style={styles.rightContainer}>
          {user && (
            <View style={[styles.roleBadge, { backgroundColor: roleConfig.bg }]}>
              <RoleIcon size={12} color={roleConfig.color} style={{ marginRight: 4 }} />
              <Text style={[styles.roleText, { color: roleConfig.color }]}>{roleConfig.label}</Text>
            </View>
          )}
          {rightAction ? (
            rightAction
          ) : user ? (
            <TouchableOpacity onPress={logout} title="Logout" style={styles.iconButton} activeOpacity={0.7}>
              <LogOut size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    zIndex: 10
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
    borderRadius: radii.sm
  },
  title: {
    ...typography.titleSmall,
    color: colors.textPrimary
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary
  },
  locationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.full,
    marginRight: spacing.sm
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  iconButton: {
    padding: spacing.xs,
    borderRadius: radii.full,
    backgroundColor: colors.bgMuted,
    marginLeft: spacing.xs
  }
});
