import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  ShieldAlert,
  Users,
  Building2,
  Camera,
  Inbox,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';

export function AdminDashboardScreen({ onNavigate }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View style={styles.adminTag}>
            <Text style={styles.adminTagText}>IN-APP ADMIN CONSOLE</Text>
          </View>
        </View>
        <Text style={styles.title}>Platform Control Center</Text>
        <Text style={styles.subtitle}>Real-time supply, demand, and compliance metrics.</Text>
      </View>

      {/* Primary KPI Grid */}
      <View style={styles.kpiGrid}>
        <Card style={styles.kpiCard} onPress={() => onNavigate('admin_users')}>
          <View style={[styles.kpiIcon, { backgroundColor: '#EFF6FF' }]}>
            <Users size={20} color={colors.primary} />
          </View>
          <Text style={styles.kpiValue}>1,420</Text>
          <Text style={styles.kpiLabel}>Total Users</Text>
          <Text style={styles.kpiSub}>+48 this week</Text>
        </Card>

        <Card style={styles.kpiCard} onPress={() => onNavigate('admin_businesses')}>
          <View style={[styles.kpiIcon, { backgroundColor: '#ECFDF5' }]}>
            <Building2 size={20} color={colors.verifiedGst} />
          </View>
          <Text style={styles.kpiValue}>310</Text>
          <Text style={styles.kpiLabel}>Verified Listings</Text>
          <Text style={styles.kpiSub}>Coimbatore launch</Text>
        </Card>

        <Card style={styles.kpiCard} onPress={() => onNavigate('admin_kyc')}>
          <View style={[styles.kpiIcon, { backgroundColor: '#FEF3C7' }]}>
            <ShieldAlert size={20} color={colors.warning} />
          </View>
          <Text style={styles.kpiValue}>14</Text>
          <Text style={styles.kpiLabel}>Pending KYC</Text>
          <Text style={[styles.kpiSub, { color: colors.danger }]}>Requires review</Text>
        </Card>

        <Card style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#EEF2FF' }]}>
            <Camera size={20} color={colors.secondary} />
          </View>
          <Text style={styles.kpiValue}>840</Text>
          <Text style={styles.kpiLabel}>Scans Today</Text>
          <Text style={styles.kpiSub}>AI extraction p50: 3.2s</Text>
        </Card>
      </View>

      {/* Urgent Action Banner */}
      <Card style={styles.alertCard} onPress={() => onNavigate('admin_kyc')}>
        <View style={styles.alertHeader}>
          <AlertTriangle size={20} color={colors.warning} />
          <Text style={styles.alertTitle}>14 Business Verifications Pending Review</Text>
        </View>
        <Text style={styles.alertDesc}>
          Businesses with slight trade-name discrepancies or manual document uploads are awaiting admin verification.
        </Text>
        <Button
          title="Open KYC Review Queue"
          onPress={() => onNavigate('admin_kyc')}
          size="sm"
          variant="outline"
          style={{ marginTop: spacing.md, borderColor: '#B45309' }}
        />
      </Card>

      {/* Quick Nav Modules */}
      <Text style={styles.sectionTitle}>Administration Modules</Text>

      <Card style={styles.moduleCard} onPress={() => onNavigate('admin_users')}>
        <Users size={20} color={colors.primary} style={{ marginRight: spacing.md }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.moduleName}>User Directory & Roles</Text>
          <Text style={styles.moduleDesc}>Inspect accounts, ban abusers, view scan quotas</Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </Card>

      <Card style={styles.moduleCard} onPress={() => onNavigate('admin_businesses')}>
        <Building2 size={20} color={colors.verifiedGst} style={{ marginRight: spacing.md }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.moduleName}>Business Listings Management</Text>
          <Text style={styles.moduleDesc}>Delist, suspend, or override search visibility</Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </Card>

      <Card style={styles.moduleCard} onPress={() => onNavigate('admin_settings')}>
        <CheckCircle2 size={20} color={colors.secondary} style={{ marginRight: spacing.md }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.moduleName}>System Settings & Feature Flags</Text>
          <Text style={styles.moduleDesc}>Pre-moderation toggles, sponsored slot limits</Text>
        </View>
        <ChevronRight size={18} color={colors.textMuted} />
      </Card>
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
    marginBottom: spacing.lg
  },
  badgeRow: {
    flexDirection: 'row',
    marginBottom: 4
  },
  adminTag: {
    backgroundColor: '#FEE2E2',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.full
  },
  adminTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5
  },
  title: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    marginTop: 4
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  kpiCard: {
    width: '48.5%',
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  kpiIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  kpiValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary
  },
  kpiLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2
  },
  kpiSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2
  },
  alertCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    padding: spacing.lg,
    marginBottom: spacing.lg
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
    marginLeft: spacing.sm
  },
  alertDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: '#78350F'
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  moduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  moduleName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  moduleDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  }
});
