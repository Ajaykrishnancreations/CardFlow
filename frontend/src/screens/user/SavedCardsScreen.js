import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, useWindowDimensions } from 'react-native';
import {
  FolderOpen,
  Search,
  Download,
  Phone,
  Mail,
  MapPin,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { BrandSpinner, SkeletonCard } from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';

export function SavedCardsScreen({ onScanNewCard, onSelectCard }) {
  const { user, token, savedCards: contextCards, loadUserVault } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [cards, setCards] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'recent', label: 'Recent' },
    { id: 'business', label: 'Business' },
    { id: 'people', label: 'People' }
  ];

  const formatCards = (cardList) => {
    if (!cardList || !Array.isArray(cardList)) return [];
    return cardList.map((c) => ({
      id: c.id || Math.random().toString(),
      personName: c.person_name || c.personName || 'Business Contact',
      designation: c.designation || 'Partner',
      company: c.company || 'Enterprise',
      phones: c.phones || [{ raw: '+91 96555 87877', is_whatsapp: true }],
      emails: c.emails || ['contact@enterprise.com'],
      website: c.website || '',
      rawAddress: c.raw_address || c.rawAddress || 'Coimbatore, Tamil Nadu',
      notes: c.notes || '',
      privateRating: c.private_rating || c.privateRating || 5,
      tags: c.tags || ['Verified'],
      gstin: c.gstin || '',
      originalCardImageUrl: c.original_card_image_url || c.originalCardImageUrl || '',
      savedAt: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '2026-08-31',
      hasFrontImage: !!(c.original_card_image_url || c.originalCardImageUrl),
      hasBackImage: false,
      extractStatus: c.extract_status || c.extractStatus || 'extracted'
    }));
  };

  const loadCards = async () => {
    setIsLoading(true);
    try {
      const liveCards = await apiClient.getCards(token);
      if (liveCards && liveCards.length > 0) {
        setCards(formatCards(liveCards));
      } else if (contextCards && contextCards.length > 0) {
        setCards(formatCards(contextCards));
      } else {
        setCards([]);
      }
    } catch (e) {
      console.warn('Error loading cards:', e);
      if (contextCards && contextCards.length > 0) {
        setCards(formatCards(contextCards));
      } else {
        setCards([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load cards when tab opens; prefer context if already loaded (avoids duplicate fetch)
  useEffect(() => {
    if (contextCards && contextCards.length > 0) {
      setCards(formatCards(contextCards));
      setIsLoading(false);
      return;
    }
    loadCards();
  }, [token]);

  useEffect(() => {
    if (contextCards && contextCards.length > 0) {
      setCards(formatCards(contextCards));
      setIsLoading(false);
    }
  }, [contextCards]);

  const filteredCards = cards.filter((c) => {
    if (selectedFilter === 'recent') {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      if (new Date(c.savedAt).getTime() < weekAgo) return false;
    }
    if (selectedFilter === 'business' && !c.company) return false;
    if (selectedFilter === 'people' && !c.personName) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (c.personName || '').toLowerCase().includes(q);
      const matchCompany = (c.company || '').toLowerCase().includes(q);
      const matchGst = (c.gstin || '').toLowerCase().includes(q);
      if (!matchName && !matchCompany && !matchGst) return false;
    }
    return true;
  });

  const handleExportGoogle = () => {
    alert(`${cards.length} contacts ready.\n\nGoogle Contacts export will open OAuth flow (coming in Phase 4).`);
  };

  const handleSaveToPhone = () => {
    alert(`${cards.length} contacts selected.\n\nSave to phone contacts uses native Android API (coming in Phase 4).`);
  };

  return (
    <View style={styles.container}>
      {/* Count & Export Section */}
      <View style={styles.exportSection}>
        <Text style={styles.countTitle}>{cards.length} Saved Cards</Text>
        <Text style={styles.exportLabel}>Backup & Export</Text>
        <TouchableOpacity style={styles.exportRow} onPress={handleExportGoogle}>
          <Download size={18} color={colors.primary} style={{ marginRight: spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.exportTitle}>Export to Google Contacts</Text>
            <Text style={styles.exportDesc}>Save your business contacts to Google — recover anytime.</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.exportRow, { borderBottomWidth: 0 }]} onPress={handleSaveToPhone}>
          <Phone size={18} color={colors.primary} style={{ marginRight: spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.exportTitle}>Save to Phone Contacts</Text>
            <Text style={styles.exportDesc}>Save selected or all contacts to your mobile.</Text>
          </View>
          <ChevronRight size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={[styles.topBar, isDesktop && styles.desktopTopBar]}>
        <View style={styles.searchInputWrap}>
          <Search size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search cards..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>

        <TouchableOpacity onPress={loadCards} style={styles.refreshBtn} title="Refresh">
          <RefreshCw size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.tagsFilterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tagFilterChip, selectedFilter === tab.id && styles.tagFilterChipActive]}
              onPress={() => setSelectedFilter(tab.id)}
            >
              <Text style={[styles.tagFilterText, selectedFilter === tab.id && styles.tagFilterTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cards List or Animated Loader */}
      <ScrollView contentContainerStyle={[styles.cardsScroll, isDesktop && styles.desktopCardsScroll]} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsCountRow}>
          <Text style={styles.resultsCountText}>
            {isLoading
              ? 'Loading your personal vault...'
              : `${filteredCards.length} Cards in ${user?.name ? `${user.name}'s Vault` : 'Your Vault'}`}
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <BrandSpinner size={32} text="Loading your saved cards..." />
            <SkeletonCard count={isDesktop ? 4 : 2} />
          </View>
        ) : filteredCards.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No cards saved in your vault"
            description="Scan or upload visiting cards, or save businesses from Discover to build your card vault."
            actionTitle="Scan New Business Card"
            onAction={onScanNewCard}
          />
        ) : (
          <View style={[styles.cardsGrid, isDesktop && styles.desktopCardsGrid]}>
            {filteredCards.map((card) => (
              <Card key={card.id} style={[styles.bizCardItem, isDesktop && styles.desktopCardItem]}>
                <View style={styles.bizCardTop}>
                  <View style={styles.bizCardAccent} />
                  <Text style={styles.bizCardName}>{card.personName || 'Contact'}</Text>
                  <Text style={styles.bizCardCompany}>{card.company}</Text>
                </View>
                <View style={styles.bizCardBody}>
                  {card.phones?.[0]?.raw ? (
                    <View style={styles.bizCardRow}>
                      <Phone size={13} color={colors.primary} />
                      <Text style={styles.bizCardText}>{card.phones[0].raw}</Text>
                    </View>
                  ) : null}
                  {card.rawAddress ? (
                    <View style={styles.bizCardRow}>
                      <MapPin size={13} color={colors.textSecondary} />
                      <Text style={styles.bizCardText} numberOfLines={1}>{card.rawAddress}</Text>
                    </View>
                  ) : null}
                  {card.gstin ? (
                    <Text style={styles.bizCardGst}>GST: {card.gstin}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  style={styles.viewCardBtn}
                  onPress={() => onSelectCard && onSelectCard(card)}
                >
                  <Text style={styles.viewCardBtnText}>View Card</Text>
                  <ChevronRight size={16} color={colors.primary} />
                </TouchableOpacity>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  exportSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  countTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  exportLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
    textTransform: 'uppercase'
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  exportTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  exportDesc: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  desktopTopBar: {
    gap: spacing.md
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginRight: spacing.sm
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    outlineStyle: 'none'
  },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs
  },
  tagsFilterWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  tagsScroll: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.xs
  },
  tagFilterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: colors.bgMuted
  },
  tagFilterChipActive: {
    backgroundColor: colors.primary
  },
  tagFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  tagFilterTextActive: {
    color: '#FFFFFF'
  },
  cardsScroll: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl
  },
  desktopCardsScroll: {
    padding: spacing.lg
  },
  resultsCountRow: {
    marginBottom: spacing.sm
  },
  resultsCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary
  },
  loadingContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardsGrid: {
    flexDirection: 'column',
    gap: spacing.md
  },
  desktopCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  desktopCardItem: {
    width: 'calc(50% - 8px)',
    marginBottom: 0
  },
  bizCardItem: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: radii.lg
  },
  bizCardTop: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    position: 'relative',
    overflow: 'hidden'
  },
  bizCardAccent: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)'
  },
  bizCardName: { fontSize: 17, fontWeight: '800', color: '#FFFFFF' },
  bizCardCompany: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  bizCardBody: { padding: spacing.md, gap: 6 },
  bizCardRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bizCardText: { fontSize: 12, color: colors.textSecondary, flex: 1 },
  bizCardGst: { fontSize: 11, fontWeight: '700', color: colors.primary, marginTop: 4 },
  viewCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 4
  },
  viewCardBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary }
});
