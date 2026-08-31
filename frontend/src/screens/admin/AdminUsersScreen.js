import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { Users, Search, ShieldCheck, UserX, UserCheck, MoreVertical } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';

const mockUsers = [
  { id: 'usr-1', name: 'Ravi Kumar', phone: '1234567890', role: 'user', plan: 'free', city: 'Coimbatore', isIdVerified: true, status: 'active' },
  { id: 'usr-2', name: 'Suresh Natarajan', phone: '9876543210', role: 'owner', plan: 'plus', city: 'Coimbatore', isIdVerified: true, status: 'active' },
  { id: 'usr-3', name: 'Admin Supervisor', phone: '9999988888', role: 'admin', plan: 'premium', city: 'Coimbatore', isIdVerified: true, status: 'active' },
  { id: 'usr-4', name: 'Karthik Raja', phone: '9843211223', role: 'user', plan: 'free', city: 'Tirupur', isIdVerified: false, status: 'active' }
];

export function AdminUsersScreen() {
  const [search, setSearch] = useState('');

  const filtered = mockUsers.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search)
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>User Management</Text>
        <Text style={styles.subtitle}>View accounts, roles, verification status, and plan tiers.</Text>
      </View>

      <View style={styles.searchWrap}>
        <Search size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search user by name or phone..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>

      {filtered.map((u) => (
        <Card key={u.id} style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{u.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.userName}>{u.name}</Text>
                {u.isIdVerified && <Badge type="id" label="ID Verified" style={{ marginLeft: 6 }} />}
              </View>
              <Text style={styles.phoneText}>+91 {u.phone} • {u.city}</Text>
              <View style={styles.tagsRow}>
                <View style={[styles.roleChip, u.role === 'admin' ? styles.roleAdmin : u.role === 'owner' ? styles.roleOwner : styles.roleUser]}>
                  <Text style={styles.roleChipText}>{u.role.toUpperCase()}</Text>
                </View>
                <View style={styles.planChip}>
                  <Text style={styles.planChipText}>PLAN: {u.plan.toUpperCase()}</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  header: {
    marginBottom: spacing.md
  },
  title: {
    ...typography.titleMedium,
    color: colors.textPrimary
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.md
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    outlineStyle: 'none'
  },
  userCard: {
    marginBottom: spacing.sm,
    padding: spacing.md
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  phoneText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1
  },
  tagsRow: {
    flexDirection: 'row',
    marginTop: 4
  },
  roleChip: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.xs,
    marginRight: 6
  },
  roleAdmin: { backgroundColor: '#FEE2E2' },
  roleOwner: { backgroundColor: '#EFF6FF' },
  roleUser: { backgroundColor: '#F1F5F9' },
  roleChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textPrimary
  },
  planChip: {
    backgroundColor: colors.bgMuted,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.xs
  },
  planChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.textSecondary
  }
});
