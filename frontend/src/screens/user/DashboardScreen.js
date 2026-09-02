import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ScanLine, Phone, MapPin, User } from 'lucide-react';
import { colors, spacing, shadows, radii, fonts } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { CardThumbnail } from '../../components/CardThumbnail';

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function countRecentCards(cards) {
  if (!cards?.length) return 0;
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return cards.filter((c) => {
    const ts = c.created_at || c.createdAt || c.savedAt;
    if (!ts) return false;
    return new Date(ts).getTime() >= weekAgo;
  }).length;
}

function cardPhone(card) {
  const phones = card.phones || [];
  const p = phones.find((x) => x.raw || x.e164) || phones[0];
  return p?.raw || p?.e164 || '';
}

function cardLocation(card) {
  const addr = card.raw_address || card.rawAddress || '';
  if (addr) {
    const parts = addr.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length >= 2) return `${parts[parts.length - 2]}, ${parts[parts.length - 1]}`;
    return parts[0];
  }
  return '';
}

function StatBox({ value, label }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function DashboardHeader({ greeting, subline, onOpenProfile }) {
  return (
    <View style={styles.topRow}>
      <View style={styles.headerText}>
        <Text style={styles.greetingSerif}>{greeting}</Text>
        <Text style={styles.subline}>{subline}</Text>
      </View>
      <TouchableOpacity
        style={styles.avatarBtn}
        onPress={onOpenProfile}
        accessibilityLabel="Open profile"
      >
        <User size={18} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

function ScanButton({ onPress }) {
  return (
    <View style={styles.scanWrap}>
      <TouchableOpacity
        style={[styles.scanCircle, shadows.scan]}
        onPress={onPress}
        activeOpacity={0.88}
        accessibilityLabel="Scan business card"
      >
        <ScanLine size={36} color="#FFFFFF" strokeWidth={1.75} />
        <Text style={styles.scanCircleText}>SCAN CARD</Text>
      </TouchableOpacity>
      <Text style={styles.tapHint}>Tap to scan</Text>
    </View>
  );
}

export function DashboardScreen({ onNavigate, onOpenProfile, onSelectCard }) {
  const { user, savedCards, myBusinesses } = useAuth();

  const firstName = (user?.name || 'User').split(' ')[0];
  const cardCount = savedCards?.length || 0;
  const bizCount = myBusinesses?.length || 0;
  const newContacts = countRecentCards(savedCards);
  const hasCards = cardCount > 0;
  const hasBusinesses = bizCount > 0;
  const isFirstTime = !hasCards && !hasBusinesses;
  const recentCards = hasCards ? savedCards.slice(0, 3) : [];

  const goScan = () => onNavigate?.('user_scan');
  const goBrowse = () => onNavigate?.('user_search');
  const openProfile = () => (onOpenProfile ? onOpenProfile() : onNavigate?.('user_profile'));

  if (isFirstTime) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.firstTimeContent} showsVerticalScrollIndicator={false}>
        <DashboardHeader
          greeting={`${getTimeGreeting()}, ${firstName} 👋`}
          subline="Scan, save and never lose a business card again."
          onOpenProfile={openProfile}
        />

        <ScanButton onPress={goScan} />

        <View style={styles.firstTimeFooter}>
          <Text style={styles.footerTitle}>Your network starts here</Text>
          <Text style={styles.footerSub}>
            Scan your first business card and keep your contacts safe.
          </Text>
          <TouchableOpacity onPress={goBrowse} style={styles.browseLinkWrap}>
            <Text style={styles.browseLink}>Browse Businesses →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const tagline = hasBusinesses
    ? 'Hope your business is going great today.'
    : 'Keep growing your professional network.';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <DashboardHeader
        greeting={`Hey ${firstName}! 👋`}
        subline={tagline}
        onOpenProfile={openProfile}
      />

      <View style={styles.statsRow}>
        <StatBox value={cardCount} label="Saved Cards" />
        <StatBox value={bizCount} label="Businesses" />
        <StatBox value={newContacts} label="New Contacts" />
      </View>

      <ScanButton onPress={goScan} />

      {hasCards ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Recent Cards</Text>
            <TouchableOpacity onPress={() => onNavigate?.('user_vault')}>
              <Text style={styles.viewAll}>View All →</Text>
            </TouchableOpacity>
          </View>

          {recentCards.map((card) => {
            const name = card.person_name || card.personName || 'Contact';
            const company = card.company || '';
            const phone = cardPhone(card);
            const location = cardLocation(card);
            const gstin = card.gstin || '';
            const imagePath = card.original_card_image_url || card.originalCardImageUrl;

            return (
              <TouchableOpacity
                key={card.id}
                style={styles.recentCard}
                onPress={() => onSelectCard?.(card)}
                activeOpacity={0.85}
              >
                <CardThumbnail cardId={card.id} imagePath={imagePath} size={88} />
                <View style={styles.recentCardBody}>
                  <Text style={styles.recentName}>{name}</Text>
                  {company ? <Text style={styles.recentCompany}>{company}</Text> : null}
                  {phone ? (
                    <View style={styles.metaRow}>
                      <Phone size={12} color={colors.textMuted} />
                      <Text style={styles.metaText}>{phone}</Text>
                    </View>
                  ) : null}
                  {location ? (
                    <View style={styles.metaRow}>
                      <MapPin size={12} color={colors.textMuted} />
                      <Text style={styles.metaText} numberOfLines={1}>{location}</Text>
                    </View>
                  ) : null}
                  {gstin ? (
                    <Text style={styles.gstText}>GST: {gstin}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ) : null}

      <View style={styles.browseCard}>
        <View style={styles.goldRule} />
        <Text style={styles.browseCardTitle}>Browse & Connect</Text>
        <Text style={styles.browseCardSub}>
          Discover businesses and connect with new business owners.
        </Text>
        <TouchableOpacity onPress={goBrowse}>
          <Text style={styles.browseLink}>Browse Businesses →</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMuted },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl
  },
  firstTimeContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    justifyContent: 'space-between',
    minHeight: '100%'
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg
  },
  headerText: { flex: 1, paddingRight: spacing.sm },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border
  },
  greetingSerif: {
    fontFamily: fonts.serif,
    fontSize: 26,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 34,
    marginBottom: spacing.sm
  },
  subline: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    fontFamily: fonts.sans,
    maxWidth: 320
  },
  scanWrap: {
    alignItems: 'center',
    marginVertical: spacing.xl
  },
  scanCircle: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  scanCircleText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: fonts.sans
  },
  tapHint: {
    marginTop: spacing.md,
    fontSize: 13,
    color: colors.textMuted,
    fontFamily: fonts.sans
  },
  firstTimeFooter: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.lg
  },
  footerTitle: {
    fontFamily: fonts.serif,
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm
  },
  footerSub: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    maxWidth: 280,
    marginBottom: spacing.lg
  },
  browseLinkWrap: { marginTop: spacing.xs },
  browseLink: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.sans
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center'
  },
  statValue: {
    fontFamily: fonts.serif,
    fontSize: 28,
    fontWeight: '700',
    color: colors.textPrimary,
    lineHeight: 34
  },
  statLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    textAlign: 'center',
    fontFamily: fonts.sans,
    lineHeight: 13
  },
  section: { marginTop: spacing.sm, marginBottom: spacing.lg },
  sectionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  sectionTitle: {
    fontFamily: fonts.serif,
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary
  },
  viewAll: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    fontFamily: fonts.sans
  },
  recentCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
    alignItems: 'flex-start'
  },
  recentCardBody: {
    flex: 1,
    marginLeft: spacing.md,
    minWidth: 0
  },
  recentName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: fonts.sans
  },
  recentCompany: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: 4
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3
  },
  metaText: {
    fontSize: 12,
    color: colors.textMuted,
    flex: 1
  },
  gstText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold,
    marginTop: 6
  },
  browseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.xs
  },
  goldRule: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.gold,
    marginBottom: spacing.md
  },
  browseCardTitle: {
    fontFamily: fonts.serif,
    fontSize: 20,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  browseCardSub: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    marginBottom: spacing.md
  }
});
