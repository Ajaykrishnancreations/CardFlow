import React, { useState, useEffect } from 'react';
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
  TrendingUp,
  Sparkles,
  LifeBuoy
} from 'lucide-react';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';

export function AdminDashboardScreen({ onNavigate }) {
  const { token } = useAuth();
  const [stats, setStats] = useState({
    total_users: 1420,
    active_businesses: 480,
    verified_businesses: 342,
    pending_verifications: 12,
    total_cards_scanned: 18540,
    active_subscriptions: 184,
    mrr_inr: 74200
  });

  useEffect(() => {
    const fetchStats = async () => {
      const data = await apiClient.getAdminDashboard(token);
      if (data) {
        setStats((prev) => ({ ...prev, ...data }));
      }
    };
    fetchStats();
  }, [token]);

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
          <Text style={styles.kpiValue}>{stats.total_users || 1420}</Text>
          <Text style={styles.kpiLabel}>Total Users</Text>
          <Text style={styles.kpiSub}>+48 this week</Text>
        </Card>

        <Card style={styles.kpiCard} onPress={() => onNavigate('admin_businesses')}>
          <View style={[styles.kpiIcon, { backgroundColor: '#ECFDF5' }]}>
            <Building2 size={20} color={colors.verifiedGst} />
          </View>
          <Text style={styles.kpiValue}>{stats.verified_businesses || 342}</Text>
          <Text style={styles.kpiLabel}>Verified Listings</Text>
          <Text style={styles.kpiSub}>Coimbatore launch</Text>
        </Card>

        <Card style={styles.kpiCard} onPress={() => onNavigate('admin_kyc')}>
          <View style={[styles.kpiIcon, { backgroundColor: '#FEF3C7' }]}>
            <ShieldAlert size={20} color={colors.warning} />
          </View>
          <Text style={styles.kpiValue}>{stats.pending_verifications || 12}</Text>
          <Text style={styles.kpiLabel}>Pending KYC</Text>
          <Text style={[styles.kpiSub, { color: colors.danger }]}>Requires review</Text>
        </Card>

        <Card style={styles.kpiCard}>
          <View style={[styles.kpiIcon, { backgroundColor: '#F5F3FF' }]}>
            <Camera size={20} color={colors.accentPurple} />
          </View>
          <Text style={styles.kpiValue}>{stats.total_cards_scanned || 18540}</Text>
          <Text style={styles.kpiLabel}>Scans Total</Text>
          <Text style={styles.kpiSub}>AI extraction p50: 3.2s</Text>
        </Card>
      </View>

      {/* Compliance & Approvals Banner */}
      <Card style={styles.alertBanner} onPress={() => onNavigate('admin_kyc')}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={styles.alertIconWrap}>
            <AlertTriangle size={18} color="#D97706" />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.alertTitle}>12 Verification Requests in Queue</Text>
            <Text style={styles.alertSub}>3 GSTIN mismatched names, 9 automated score &gt; 95%</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </View>
      </Card>

      {/* Quick Admin Actions */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>QUICK ADMIN ACTIONS</Text>
      </View>

      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.8}
          onPress={() => onNavigate('admin_users')}
        >
          <Users size={22} color={colors.primary} />
          <Text style={styles.actionCardTitle}>Manage Users</Text>
          <Text style={styles.actionCardSub}>Grant Free Access & Subscriptions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.8}
          onPress={() => onNavigate('admin_businesses')}
        >
          <Building2 size={22} color={colors.verifiedGst} />
          <Text style={styles.actionCardTitle}>Listings Directory</Text>
          <Text style={styles.actionCardSub}>Moderate shops & verification</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.8}
          onPress={() => onNavigate('admin_support')}
        >
          <LifeBuoy size={22} color={colors.accentPurple} />
          <Text style={styles.actionCardTitle}>Support & Tickets</Text>
          <Text style={styles.actionCardSub}>Resolve user & owner requests</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: spacing.xs
  },
  adminTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.xs
  },
  adminTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.danger,
    letterSpacing: 0.5
  },
  title: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    marginTop: 4
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: 2
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg
  },
  kpiCard: {
    width: 'calc(50% - 6px)',
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    padding: spacing.md,
    cursor: 'pointer'
  },
  kpiIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm
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
    fontWeight: '700',
    color: colors.primary,
    marginTop: 4
  },
  alertBanner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    padding: spacing.md,
    marginBottom: spacing.lg,
    cursor: 'pointer'
  },
  alertIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center'
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E'
  },
  alertSub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 1
  },
  sectionHeader: {
    marginBottom: spacing.sm
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5
  },
  quickGrid: {
    flexDirection: 'row',
    gap: spacing.sm
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    cursor: 'pointer'
  },
  actionCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.sm
  },
  actionCardSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  }
});
