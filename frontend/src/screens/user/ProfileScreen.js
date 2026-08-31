import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  User,
  ShieldCheck,
  CreditCard,
  Sparkles,
  ChevronRight,
  LogOut,
  Building2,
  FileText,
  HelpCircle,
  Briefcase,
  LifeBuoy
} from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { SupportModal } from '../../components/SupportModal';
import { useAuth } from '../../context/AuthContext';

export function ProfileScreen({ onSwitchToOwner }) {
  const { user, role, logout } = useAuth();
  const [showSupportModal, setShowSupportModal] = useState(false);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* User Header Profile */}
      <Card style={styles.headerCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name ? user.name[0] : 'U'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.userName}>{user?.name || 'CardFlow User'}</Text>
              {user?.isIdVerified && <Badge type="id" label="ID Verified" style={{ marginLeft: 6 }} />}
            </View>
            <Text style={styles.userPhone}>+91 {user?.phone || '1234567890'}</Text>
            <Text style={styles.userCity}>{user?.city || 'Coimbatore'}, {user?.state || 'Tamil Nadu'}</Text>
          </View>
        </View>
      </Card>

      {/* Allowance & Contact Credits Ledger */}
      <Card style={styles.creditsCard}>
        <View style={styles.creditsHeader}>
          <Sparkles size={18} color={colors.primary} />
          <Text style={styles.creditsTitle}>Scan Allowance & Credits</Text>
        </View>

        <View style={styles.creditsStatsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{user?.freeScansRemaining || 28}</Text>
            <Text style={styles.statLabel}>Free Scans Left</Text>
            <Text style={styles.statSub}>Resets monthly (30/mo)</Text>
          </View>

          <View style={[styles.statBox, { borderLeftWidth: 1, borderLeftColor: colors.border }]}>
            <Text style={styles.statVal}>{user?.credits || 10}</Text>
            <Text style={styles.statLabel}>Contact Credits</Text>
            <Text style={styles.statSub}>For structured parsing</Text>
          </View>
        </View>
      </Card>

      {/* Become Business Owner CTA if user is not already an owner */}
      {role === 'user' && (
        <Card style={styles.ownerCtaCard}>
          <View style={styles.ownerCtaHeader}>
            <Briefcase size={20} color={colors.primary} />
            <Text style={styles.ownerCtaTitle}>Are you a Business Owner?</Text>
          </View>
          <Text style={styles.ownerCtaDesc}>
            Create your digital business listing, verify via GSTIN, get discovered by local customers, and manage enquiries.
          </Text>
          <Button
            title="Switch to Business Owner Mode"
            onPress={onSwitchToOwner}
            variant="primary"
            size="md"
            style={{ marginTop: spacing.md }}
          />
        </Card>
      )}

      {/* Settings & Links */}
      <Card style={styles.menuCard}>
        <TouchableOpacity style={styles.menuItem} onPress={() => alert('DPDP Data Export initiated. Your data copy will be prepared.')}>
          <FileText size={18} color={colors.textSecondary} style={{ marginRight: spacing.md }} />
          <Text style={styles.menuText}>Export My Data (DPDP Act)</Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => setShowSupportModal(true)}>
          <LifeBuoy size={18} color={colors.primary} style={{ marginRight: spacing.md }} />
          <Text style={[styles.menuText, { color: colors.primary, fontWeight: '700' }]}>Help & Support Center</Text>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]} onPress={logout}>
          <LogOut size={18} color={colors.danger} style={{ marginRight: spacing.md }} />
          <Text style={[styles.menuText, { color: colors.danger }]}>Log Out</Text>
        </TouchableOpacity>
      </Card>

      {/* 24/7 In-App Support Modal */}
      <SupportModal
        visible={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />
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
  headerCard: {
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  userPhone: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  userCity: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1
  },
  creditsCard: {
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  creditsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  creditsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: spacing.sm
  },
  creditsStatsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm
  },
  statVal: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: 2
  },
  statSub: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2
  },
  ownerCtaCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  ownerCtaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  ownerCtaTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primaryDark,
    marginLeft: spacing.sm
  },
  ownerCtaDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 4
  },
  menuCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: spacing.md
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  menuText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    flex: 1
  }
});
