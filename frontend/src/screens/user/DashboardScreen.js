import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScanLine, ChevronRight, Store, User } from 'lucide-react';
import { colors, spacing, typography, shadows, radii } from '../../theme';
import { useAuth } from '../../context/AuthContext';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/**
 * Compact home. Bottom-nav SCAN is the primary scan CTA —
 * dashboard only hints at scanning, no duplicate "Scan Card →" buttons.
 */
export function DashboardScreen({ onNavigate, onOpenProfile, onSelectCard, onSelectBusiness }) {
  const { user, savedCards, myBusinesses } = useAuth();

  const firstName = (user?.name || 'User').split(' ')[0];
  const cardCount = savedCards?.length || 0;
  const hasCards = cardCount > 0;
  const hasBusinesses = (myBusinesses?.length || 0) > 0;
  const recentCards = hasCards ? savedCards.slice(0, 2) : [];
  const shownBiz = hasBusinesses ? myBusinesses.slice(0, 2) : [];

  const tagline = hasBusinesses
    ? 'Hope your business is going great today.'
    : hasCards
      ? 'Your network, in one place.'
      : 'Your business connections, safe in one place.';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.topRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.greeting}>{`${getGreeting()}, ${firstName}`}</Text>
          <Text style={styles.tagline}>{tagline}</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => (onOpenProfile ? onOpenProfile() : onNavigate?.('user_profile'))}
          accessibilityLabel="Open profile"
        >
          <User size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.scanHint}>
        <View style={[styles.scanCircle, shadows.scan]}>
          <ScanLine size={22} color="#FFFFFF" strokeWidth={2} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.scanTitle}>SCAN CARD</Text>
          <Text style={styles.scanSub}>Use the Scan button below to capture a business card.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Recent Cards</Text>
          {hasCards ? (
            <TouchableOpacity onPress={() => onNavigate('user_vault')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          ) : null}
        </View>
        {!hasCards ? (
          <Text style={styles.emptySub}>No cards yet. Capture one with Scan.</Text>
        ) : (
          recentCards.map((card, i) => (
            <TouchableOpacity key={card.id || i} style={styles.row} onPress={() => onSelectCard?.(card)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{card.person_name || card.personName || 'Contact'}</Text>
                <Text style={styles.rowMeta}>{card.company || 'Business'}</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))
        )}
      </View>

      {hasBusinesses ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Your Businesses</Text>
            <TouchableOpacity onPress={() => onNavigate('user_my_business')}>
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          {shownBiz.map((biz) => (
            <TouchableOpacity key={biz.id} style={styles.row} onPress={() => onSelectBusiness?.(biz)}>
              <Store size={16} color={colors.primary} style={{ marginRight: spacing.sm }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{biz.name || biz.business_name}</Text>
                <Text style={styles.rowMeta}>{biz.city || 'India'}</Text>
              </View>
              <ChevronRight size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <TouchableOpacity style={styles.discover} onPress={() => onNavigate('user_search')}>
        <Text style={styles.discoverTitle}>Discover Businesses</Text>
        <Text style={styles.link}>Browse →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMuted },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xxl },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md },
  greeting: { ...typography.titleMedium, fontSize: 20, marginBottom: 2 },
  tagline: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm
  },
  scanHint: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.md
  },
  scanCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  scanTitle: { fontSize: 12, fontWeight: '800', color: colors.primary, letterSpacing: 0.6 },
  scanSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  section: { marginBottom: spacing.md },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  viewAll: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  emptySub: { fontSize: 13, color: colors.textSecondary, paddingVertical: spacing.sm },
  link: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  rowTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  rowMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  discover: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    marginTop: spacing.xs
  },
  discoverTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary }
});
