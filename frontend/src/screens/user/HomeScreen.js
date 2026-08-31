import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import {
  Search,
  Camera,
  FolderOpen,
  Star,
  Building2,
  Phone,
  MessageSquare,
  Navigation,
  ArrowRight,
  Sparkles,
  MapPin,
  ChevronRight,
  Factory,
  Code,
  Shirt,
  Wrench,
  Zap
} from 'lucide-react';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { categories, mockBusinesses, mockSavedCards } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

export function HomeScreen({ onNavigate, onSelectBusiness }) {
  const { user } = useAuth();

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
          <Camera size={20} color={colors.primary} />
          <Text style={[styles.quickActionText, { color: colors.primaryDark }]}>Scan Card</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: '#F1F5F9' }]}
          activeOpacity={0.8}
          onPress={() => onNavigate('user_vault')}
        >
          <FolderOpen size={20} color={colors.textPrimary} />
          <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>My Cards</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionBtn, { backgroundColor: '#FEF3C7' }]}
          activeOpacity={0.8}
          onPress={() => onNavigate('user_search')}
        >
          <Star size={20} color={colors.warning} />
          <Text style={[styles.quickActionText, { color: '#92400E' }]}>Favorites</Text>
        </TouchableOpacity>
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <TouchableOpacity onPress={() => onNavigate('user_search')}>
          <Text style={styles.seeAllText}>See all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
        {categories.slice(0, 6).map((cat) => {
          const IconComp = getCategoryIcon(cat.name);
          return (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryChip}
              activeOpacity={0.75}
              onPress={() => onNavigate('user_search', { categoryId: cat.id })}
            >
              <View style={styles.catIconWrap}>
                <IconComp size={18} color={colors.primary} />
              </View>
              <Text style={styles.catName}>{cat.name}</Text>
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

      {mockBusinesses.map((biz) => (
        <Card key={biz.id} onPress={() => onSelectBusiness(biz)} style={styles.businessCard}>
          <View style={styles.bizHeader}>
            <View style={styles.bizLogoPlaceholder}>
              <Building2 size={24} color={colors.primary} />
            </View>
            <View style={styles.bizMainInfo}>
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
      ))}

      {/* Recently Saved Cards Carousel */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recently Saved Cards</Text>
        <TouchableOpacity onPress={() => onNavigate('user_vault')}>
          <Text style={styles.seeAllText}>View vault</Text>
        </TouchableOpacity>
      </View>

      {mockSavedCards.map((card) => (
        <Card key={card.id} style={styles.vaultCard} onPress={() => onNavigate('user_vault')}>
          <View style={styles.vaultRow}>
            <View style={styles.cardAvatar}>
              <Text style={styles.cardAvatarText}>{card.personName[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardPersonName}>{card.personName}</Text>
              <Text style={styles.cardCompany}>{card.designation} • {card.company}</Text>
              <View style={styles.tagChipsRow}>
                {card.tags.slice(0, 2).map((tag, idx) => (
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  contentContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 48,
    marginBottom: spacing.md,
    ...shadows.sm
  },
  searchPlaceholder: {
    fontSize: 14,
    color: colors.textMuted
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xl
  },
  quickActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    marginHorizontal: 4,
    ...shadows.sm
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginTop: spacing.sm
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  sectionTitle: {
    ...typography.titleSmall,
    color: colors.textPrimary
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary
  },
  categoriesScroll: {
    paddingBottom: spacing.md
  },
  categoryChip: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginRight: spacing.sm,
    width: 100
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  catName: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'center'
  },
  businessCard: {
    marginBottom: spacing.md
  },
  bizHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm
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
    alignItems: 'center'
  },
  bizName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  bizCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 2
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2
  },
  pincodeText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: spacing.sm
  },
  bizDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: spacing.md
  },
  bizActionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    marginRight: spacing.sm
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4
  },
  vaultCard: {
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  vaultRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  cardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  cardAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.secondary
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
    marginTop: 4
  },
  tagChip: {
    backgroundColor: colors.bgMuted,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.sm,
    marginRight: 4
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary
  }
});
