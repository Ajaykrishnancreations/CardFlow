import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScanLine, Building2, ChevronRight, Store, Plus } from 'lucide-react';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { useAuth } from '../../context/AuthContext';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export function DashboardScreen({ onNavigate, onSelectCard }) {
  const { user, savedCards, myBusinesses } = useAuth();

  const firstName = (user?.name || 'User').split(' ')[0];
  const cardCount = savedCards?.length || 0;
  const hasCards = cardCount > 0;
  const hasBusinesses = (myBusinesses?.length || 0) > 0;
  const recentCards = hasCards ? savedCards.slice(0, 3) : [];

  const tagline = hasBusinesses
    ? 'Hope your business is going great today.'
    : hasCards
      ? 'Keep growing your professional network.'
      : 'Scan, save and never lose a business card again.';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.greeting}>{hasCards ? `Hey ${firstName}! 👋` : `${getGreeting()}, ${firstName} 👋`}</Text>
      <Text style={styles.tagline}>{tagline}</Text>

      {hasCards && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{cardCount}</Text>
            <Text style={styles.statLabel}>Saved Cards</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{new Set(savedCards.map((c) => c.company).filter(Boolean)).size}</Text>
            <Text style={styles.statLabel}>Businesses</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{Math.min(cardCount, 12)}</Text>
            <Text style={styles.statLabel}>New Contacts</Text>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.scanBlock} activeOpacity={0.9} onPress={() => onNavigate('user_scan')}>
        <View style={[styles.scanCircle, shadows.scan]}>
          <ScanLine size={30} color="#FFFFFF" strokeWidth={2} />
        </View>
        <Text style={styles.scanTitle}>SCAN CARD</Text>
        <Text style={styles.scanSub}>Tap to scan</Text>
      </TouchableOpacity>

      {!hasCards && (
        <View style={styles.emptyBlock}>
          <Text style={styles.emptyTitle}>Your network starts here</Text>
          <Text style={styles.emptySub}>Scan your first business card and keep your contacts safe.</Text>
          <TouchableOpacity onPress={() => onNavigate('user_search')}>
            <Text style={styles.browseLink}>Browse Businesses →</Text>
          </TouchableOpacity>
        </View>
      )}

      {hasCards && (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Recent Cards</Text>
            <TouchableOpacity onPress={() => onNavigate('user_vault')}>
              <Text style={styles.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>
          {recentCards.map((card, i) => (
            <TouchableOpacity key={card.id || i} style={styles.recentRow} onPress={() => onSelectCard && onSelectCard(card)}>
              <View>
                <Text style={styles.recentName}>{card.person_name || card.personName || 'Contact'}</Text>
                <Text style={styles.recentCo}>{card.company || 'Business'}</Text>
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {hasBusinesses && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Businesses</Text>
          {myBusinesses.map((biz) => (
            <TouchableOpacity key={biz.id} style={styles.bizRow} onPress={() => onNavigate('user_my_business')}>
              <Store size={18} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Text style={styles.bizName}>{biz.name || biz.business_name}</Text>
                <Text style={styles.bizMeta}>{biz.city}{biz.gstin ? ` · GST: ${biz.gstin}` : ''}</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.addBiz} onPress={() => onNavigate('user_my_business')}>
            <Plus size={16} color={colors.primary} />
            <Text style={styles.addBizText}>Add Another Business</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.connectBlock}>
        <Building2 size={20} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={styles.connectTitle}>{hasBusinesses ? 'Connect with New Businesses' : 'Browse & Connect'}</Text>
          <Text style={styles.connectSub}>Discover businesses and connect with new business owners.</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.connectBtn} onPress={() => onNavigate('user_search')}>
        <Text style={styles.connectBtnText}>Browse Businesses →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMuted },
  content: { padding: spacing.xxl, paddingBottom: spacing.xxxl },
  greeting: { ...typography.titleMedium, marginBottom: 6 },
  tagline: { ...typography.bodyMedium, marginBottom: spacing.xl, lineHeight: 22 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 22, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  scanBlock: { alignItems: 'center', marginBottom: spacing.xl },
  scanCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  scanTitle: { fontSize: 14, fontWeight: '800', color: colors.primary, letterSpacing: 1.2 },
  scanSub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  emptyBlock: { alignItems: 'center', marginBottom: spacing.xl, paddingHorizontal: spacing.lg },
  emptyTitle: { ...typography.titleSmall, marginBottom: 6, textAlign: 'center' },
  emptySub: { ...typography.bodyMedium, textAlign: 'center', marginBottom: spacing.md },
  browseLink: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  section: { marginBottom: spacing.lg },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, fontFamily: typography.titleSmall.fontFamily },
  viewAll: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xs
  },
  recentName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  recentCo: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  bizRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xs
  },
  bizName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  bizMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  addBiz: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginTop: spacing.xs
  },
  addBizText: { color: colors.primary, fontWeight: '700', marginLeft: 6, fontSize: 13 },
  connectBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.sm
  },
  connectTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  connectSub: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
  connectBtn: {
    backgroundColor: colors.primaryLight,
    borderRadius: radii.pill,
    paddingVertical: 12,
    alignItems: 'center'
  },
  connectBtnText: { color: colors.primary, fontWeight: '700', fontSize: 14 }
});
