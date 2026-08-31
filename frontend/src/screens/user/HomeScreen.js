import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Search,
  Camera,
  FolderOpen,
  Building2,
  Phone,
  MessageSquare,
  Navigation,
  ArrowRight,
  Sparkles,
  ChevronRight,
  BookmarkCheck,
  Factory,
  Code,
  Shirt,
  Wrench,
  Zap
} from 'lucide-react';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { categories, mockBusinesses } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

export function HomeScreen({ onNavigate, onSelectBusiness }) {
  const { user, savedCards, isBusinessSaved } = useAuth();

  const getCategoryIcon = (name) => {
    switch (name) {
      case 'Manufacturing': return Factory;
      case 'IT & Software': return Code;
      case 'Textiles & Garments': return Shirt;
      case 'Hardware & Tools': return Wrench;
      case 'Electrical & Automation': return Zap;
      default: return Building2;
    }
  };

  const displaySaved = savedCards && savedCards.length > 0 ? savedCards.slice(0, 3) : [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
      {/* Search Header Bar */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onNavigate('user_search')}
        style={styles.searchBar}
      >
        <Search size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
        <Text style={styles.searchPlaceholder}>Search businesses, services, pincodes...</Text>
      </TouchableOpacity>

      {/* Quick Actions Row */}
      <View style={styles.quickActionsRow}>
        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: colors.primaryLight }]}
          activeOpacity={0.8}
          onPress={() => onNavigate('user_scan')}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: colors.primary }]}>
            <Camera size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.actionTitle}>Scan Card</Text>
          <Text style={styles.actionSub}>Camera / Upload</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: '#F0FDF4' }]}
          activeOpacity={0.8}
          onPress={() => onNavigate('user_vault')}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: colors.success }]}>
            <FolderOpen size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.actionTitle}>My Vault</Text>
          <Text style={styles.actionSub}>{savedCards ? savedCards.length : 0} Cards</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: '#FFFBEB' }]}
          activeOpacity={0.8}
          onPress={() => onNavigate('user_search')}
        >
          <View style={[styles.actionIconCircle, { backgroundColor: colors.warning }]}>
            <Search size={20} color="#FFFFFF" />
          </View>
          <Text style={styles.actionTitle}>Discover</Text>
          <Text style={styles.actionSub}>Browse local</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Promo Banner */}
      <Card style={styles.promoCard}>
        <View style={styles.promoContent}>
          <View style={{ flex: 1 }}>
            <View style={styles.aiPill}>
              <Sparkles size={12} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.aiPillText}>Multi-script OCR Engine</Text>
            </View>
            <Text style={styles.promoTitle}>Scan & Digitize in 3s</Text>
            <Text style={styles.promoDesc}>
              Instant contact extraction in English, தமிழ் (Tamil) & हिन्दी (Hindi).
            </Text>
            <TouchableOpacity style={styles.promoButton} onPress={() => onNavigate('user_scan')}>
              <Text style={styles.promoBtnText}>Scan Visiting Card</Text>
              <ArrowRight size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Card>

      {/* Top Categories */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Browse Categories</Text>
        <TouchableOpacity onPress={() => onNavigate('user_search')}>
          <Text style={styles.seeAllText}>View all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {categories.slice(0, 8).map((cat) => {
          const IconComp = getCategoryIcon(cat.name);
          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryCard}
              activeOpacity={0.7}
              onPress={() => onNavigate('user_search', { categoryId: cat.id })}
            >
              <View style={styles.categoryIconWrap}>
                <IconComp size={22} color={colors.primary} />
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>{cat.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Popular Near You */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Popular in Coimbatore</Text>
          <Badge type="gst" label="Verified Only" style={{ marginLeft: spacing.sm }} />
        </View>
        <TouchableOpacity onPress={() => onNavigate('user_search')}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      {mockBusinesses.map((biz) => {
        const isSaved = isBusinessSaved(biz);
        return (
          <Card key={biz.id} onPress={() => onSelectBusiness(biz)} style={styles.businessCard}>
            {/* Top Right SAVED Chip if already in user vault */}
            {isSaved && (
              <View style={styles.savedChip}>
                <BookmarkCheck size={13} color="#059669" style={{ marginRight: 4 }} />
                <Text style={styles.savedChipText}>SAVED</Text>
              </View>
            )}

            <View style={styles.bizHeader}>
              <View style={styles.bizLogoPlaceholder}>
                <Building2 size={24} color={colors.primary} />
              </View>
              <View style={[styles.bizMainInfo, isSaved && { paddingRight: 65 }]}>
                <View style={styles.bizTitleRow}>
                  <Text style={styles.bizName} numberOfLines={1}>{biz.name}</Text>
                </View>
                <Text style={styles.bizCategory}>{biz.category} • {biz.distanceKm} km</Text>
                <View style={styles.badgeRow}>
                  <Badge type="gst" label="GST Verified" />
                  <Text style={styles.pincodeText}>Pin: {biz.pincode}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.bizDesc} numberOfLines={2}>{biz.description}</Text>

            {/* Quick Contact Buttons */}
            <View style={styles.bizActionsRow}>
              <TouchableOpacity style={styles.actionIconBtn} onPress={() => window.open(`tel:${biz.phone}`)}>
                <Phone size={14} color={colors.primary} />
                <Text style={styles.actionBtnText}>Call</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionIconBtn, { backgroundColor: '#ECFDF5' }]} onPress={() => window.open(`https://wa.me/${biz.phone}`)}>
                <MessageSquare size={14} color={colors.verifiedGst} />
                <Text style={[styles.actionBtnText, { color: colors.verifiedGst }]}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionIconBtn} onPress={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(biz.address)}`)}>
                <Navigation size={14} color={colors.textSecondary} />
                <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Map</Text>
              </TouchableOpacity>
            </View>
          </Card>
        );
      })}

      {/* Recently Saved Cards Carousel */}
      {displaySaved.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recently Saved in Your Vault</Text>
            <TouchableOpacity onPress={() => onNavigate('user_vault')}>
              <Text style={styles.seeAllText}>View vault</Text>
            </TouchableOpacity>
          </View>

          {displaySaved.map((card) => (
            <Card key={card.id || Math.random()} style={styles.vaultCard} onPress={() => onNavigate('user_vault')}>
              <View style={styles.vaultRow}>
                <View style={styles.cardAvatar}>
                  <Text style={styles.cardAvatarText}>{(card.person_name || card.company || 'C')[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardPersonName}>{card.person_name || card.company}</Text>
                  <Text style={styles.cardCompany}>{card.designation ? `${card.designation} • ` : ''}{card.company}</Text>
                  <View style={styles.tagChipsRow}>
                    {(card.tags || ['Verified Business']).slice(0, 2).map((tag, idx) => (
                      <View key={idx} style={styles.tagChip}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <ChevronRight size={18} color={colors.textMuted} />
              </View>
            </Card>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  contentContainer: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: 14
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  quickActionBtn: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  actionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textPrimary
  },
  actionSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 1
  },
  promoCard: {
    backgroundColor: '#1E293B',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 0
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs
  },
  aiPillText: {
    color: '#60A5FA',
    fontSize: 10,
    fontWeight: '700'
  },
  promoTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4
  },
  promoDesc: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: spacing.md
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.md,
    alignSelf: 'flex-start',
    gap: 6
  },
  promoBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
    marginTop: spacing.xs
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  seeAllText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600'
  },
  categoryScroll: {
    gap: spacing.sm,
    paddingBottom: spacing.md
  },
  categoryCard: {
    width: 82,
    alignItems: 'center'
  },
  categoryIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  categoryName: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    lineHeight: 14
  },
  businessCard: {
    marginBottom: spacing.md,
    position: 'relative'
  },
  savedChip: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    zIndex: 10
  },
  savedChipText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  bizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs
  },
  bizLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  bizMainInfo: {
    flex: 1
  },
  bizTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  bizName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  bizCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  pincodeText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: spacing.sm
  },
  bizDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginVertical: spacing.xs
  },
  bizActionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm
  },
  actionIconBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 8,
    borderRadius: radii.md,
    gap: 4
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  vaultCard: {
    marginBottom: spacing.sm,
    padding: spacing.sm
  },
  vaultRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  cardAvatarText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16
  },
  cardPersonName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  cardCompany: {
    fontSize: 12,
    color: colors.textSecondary
  },
  tagChipsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 4
  },
  tagChip: {
    backgroundColor: colors.bgMuted,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm
  },
  tagText: {
    fontSize: 10,
    color: colors.textSecondary
  }
});
