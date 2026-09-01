import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Building2,
  QrCode,
  Share2,
  Inbox,
  BarChart3,
  ShieldCheck,
  CreditCard,
  ChevronDown,
  Plus,
  Eye,
  Phone,
  MessageSquare,
  Sparkles,
  ExternalLink,
  LifeBuoy
} from 'lucide-react';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { mockBusinesses } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

export function OwnerDashboardScreen({ onNavigate, onShowQr, onShareCard }) {
  const { user, activeBusinessId, switchActiveBusiness } = useAuth();

  // Find active business or fallback
  const activeBiz = mockBusinesses.find((b) => b.id === activeBusinessId) || mockBusinesses[0];
  const ownerBusinesses = mockBusinesses.filter((b) => user?.ownedBusinessIds?.includes(b.id) || b.ownerPhone === user?.phone);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Multi-Business Switcher Bar */}
      <Card style={styles.switcherCard}>
        <View style={styles.switcherTop}>
          <Text style={styles.switcherLabel}>ACTIVE BUSINESS</Text>
          <TouchableOpacity onPress={() => onNavigate('owner_businesses')}>
            <Text style={styles.manageAllText}>Manage All ({ownerBusinesses.length || 2})</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.switcherRow}>
          <View style={styles.bizIconBadge}>
            <Building2 size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.activeBizName}>{activeBiz.name}</Text>
            <Text style={styles.activeBizCategory}>{activeBiz.category} • {activeBiz.city}</Text>
          </View>
          <Badge type="gst" label="GST Verified" />
        </View>

        {/* Business Selector Pills */}
        <View style={styles.pillsRow}>
          {ownerBusinesses.map((b) => (
            <TouchableOpacity
              key={b.id}
              onPress={() => switchActiveBusiness(b.id)}
              style={[styles.pill, activeBiz.id === b.id && styles.pillActive]}
            >
              <Text style={[styles.pillText, activeBiz.id === b.id && styles.pillTextActive]}>
                {b.name}
              </Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.addBizPill}
            onPress={() => onNavigate('owner_businesses')}
          >
            <Plus size={14} color={colors.primary} style={{ marginRight: 2 }} />
            <Text style={styles.addBizText}>Add Biz</Text>
          </TouchableOpacity>
        </View>
      </Card>

      {/* KPI Stats Row */}
      <View style={styles.statsRow}>
        <Card style={styles.statCard}>
          <Eye size={18} color={colors.primary} />
          <Text style={styles.statNumber}>{activeBiz.viewsCount || 284}</Text>
          <Text style={styles.statLabel}>Profile Views</Text>
        </Card>

        <Card style={styles.statCard} onPress={() => onNavigate('owner_enquiries')}>
          <Inbox size={18} color={colors.secondary} />
          <Text style={styles.statNumber}>{activeBiz.enquiriesCount || 14}</Text>
          <Text style={styles.statLabel}>New Leads</Text>
        </Card>

        <Card style={styles.statCard} onPress={() => onNavigate('owner_analytics')}>
          <BarChart3 size={18} color={colors.verifiedGst} />
          <Text style={styles.statNumber}>82%</Text>
          <Text style={styles.statLabel}>Response Rate</Text>
        </Card>
      </View>

      {/* Quick Business Actions Grid */}
      <Text style={styles.sectionHeader}>Business Toolkit</Text>
      <View style={styles.gridContainer}>
        <TouchableOpacity
          style={styles.gridItem}
          activeOpacity={0.8}
          onPress={onShowQr}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <QrCode size={22} color={colors.primary} />
          </View>
          <Text style={styles.gridTitle}>QR Code</Text>
          <Text style={styles.gridSub}>Counter display & scans</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          activeOpacity={0.8}
          onPress={onShareCard}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
            <Share2 size={22} color={colors.warning} />
          </View>
          <Text style={styles.gridTitle}>Share Card</Text>
          <Text style={styles.gridSub}>WhatsApp, SMS, Email</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          activeOpacity={0.8}
          onPress={() => onNavigate('owner_enquiries')}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#FEE2E2' }]}>
            <Inbox size={22} color={colors.danger} />
          </View>
          <Text style={styles.gridTitle}>Enquiries</Text>
          <Text style={styles.gridSub}>Manage customer leads</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          activeOpacity={0.8}
          onPress={() => onNavigate('owner_analytics')}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#ECFDF5' }]}>
            <BarChart3 size={22} color={colors.verifiedGst} />
          </View>
          <Text style={styles.gridTitle}>Analytics</Text>
          <Text style={styles.gridSub}>Call & WhatsApp clicks</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridItem}
          activeOpacity={0.8}
          onPress={() => onNavigate?.('user_support')}
        >
          <View style={[styles.gridIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <LifeBuoy size={22} color={colors.primary} />
          </View>
          <Text style={styles.gridTitle}>Support Service</Text>
          <Text style={styles.gridSub}>Request help & resolution</Text>
        </TouchableOpacity>
      </View>

      {/* Subscription Status Card */}
      <Card style={styles.subCard}>
        <View style={styles.subHeader}>
          <Sparkles size={18} color={colors.primary} />
          <Text style={styles.subTitle}>Plan: Business Plus (₹199/mo)</Text>
        </View>
        <Text style={styles.subDesc}>
          Your plan includes up to 2 verified businesses, unlimited customer enquiries, and full analytics.
        </Text>
        <Button
          title="Manage Subscription"
          variant="outline"
          size="sm"
          style={{ marginTop: spacing.md }}
          onPress={() => alert('Subscription Tier: Business Plus (Active until Sept 2026).')}
        />
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
  switcherCard: {
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  switcherTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  switcherLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textMuted,
    letterSpacing: 0.5
  },
  manageAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  switcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  bizIconBadge: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  activeBizName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  activeBizCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm
  },
  pill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    backgroundColor: colors.bgMuted,
    marginRight: spacing.xs,
    marginBottom: 4
  },
  pillActive: {
    backgroundColor: colors.primary
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  pillTextActive: {
    color: '#FFFFFF'
  },
  addBizPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    marginBottom: 4
  },
  addBizText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    marginHorizontal: 3
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginTop: 4
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  sectionHeader: {
    ...typography.titleSmall,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    marginTop: spacing.xs
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  gridItem: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm
  },
  gridIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm
  },
  gridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  gridSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  },
  subCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  subTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    marginLeft: spacing.sm
  },
  subDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary
  }
});
