import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, useWindowDimensions } from 'react-native';
import {
  FolderOpen,
  Search,
  Star,
  Download,
  Phone,
  Mail,
  MapPin,
  Tag,
  Share2,
  Trash2,
  FileSpreadsheet,
  Plus,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { BrandSpinner, SkeletonCard } from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';

export function SavedCardsScreen({ onScanNewCard }) {
  const { user, token, savedCards: contextCards, loadUserVault } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [cards, setCards] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const allTags = ['all', 'BNI Chapter', 'CA / Finance', 'Supplier', 'Vendor', 'CODISSIA', 'Metals', 'Scrap', 'Verified', 'Business Card'];

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
      savedAt: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '2026-08-31',
      hasFrontImage: true,
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

  useEffect(() => {
    loadCards();
  }, [token]);

  // Sync if context cards updated
  useEffect(() => {
    if (contextCards && contextCards.length > 0) {
      setCards(formatCards(contextCards));
      setIsLoading(false);
    }
  }, [contextCards]);

  const filteredCards = cards.filter((c) => {
    if (selectedTag !== 'all' && !c.tags.includes(selectedTag)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (c.personName || '').toLowerCase().includes(q);
      const matchCompany = (c.company || '').toLowerCase().includes(q);
      const matchNotes = (c.notes || '').toLowerCase().includes(q);
      if (!matchName && !matchCompany && !matchNotes) return false;
    }
    return true;
  });

  const handleExportCsv = () => {
    if (cards.length === 0) {
      alert('No saved cards in your vault to export.');
      return;
    }
    const headers = ['Name', 'Designation', 'Company', 'Phone', 'Email', 'Website', 'Address', 'Tags'];
    const rows = cards.map((c) => [
      `"${c.personName}"`,
      `"${c.designation}"`,
      `"${c.company}"`,
      `"${c.phones?.[0]?.raw || ''}"`,
      `"${c.emails?.[0] || ''}"`,
      `"${c.website || ''}"`,
      `"${c.rawAddress || ''}"`,
      `"${c.tags.join(', ')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cardflow_vault_${user?.name || 'cards'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <View style={styles.container}>
      {/* Top Search & Filter Bar */}
      <View style={[styles.topBar, isDesktop && styles.desktopTopBar]}>
        <View style={styles.searchInputWrap}>
          <Search size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search saved cards by name, company, notes..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>

        <TouchableOpacity onPress={loadCards} style={styles.refreshBtn} title="Refresh Vault">
          <RefreshCw size={16} color={colors.primary} />
        </TouchableOpacity>

        {isDesktop && (
          <Button
            title="Export CSV"
            onPress={handleExportCsv}
            icon={FileSpreadsheet}
            variant="outline"
            size="sm"
          />
        )}
      </View>

      {/* Tags Filter Carousel */}
      <View style={styles.tagsFilterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagsScroll}>
          {allTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagFilterChip, selectedTag === tag && styles.tagFilterChipActive]}
              onPress={() => setSelectedTag(tag)}
            >
              <Text style={[styles.tagFilterText, selectedTag === tag && styles.tagFilterTextActive]}>
                {tag === 'all' ? 'All Cards' : tag}
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
              <Card key={card.id} style={[styles.cardItem, isDesktop && styles.desktopCardItem]}>
                <View style={styles.cardHeader}>
                  <View style={styles.cardAvatar}>
                    <Text style={styles.cardAvatarText}>{(card.personName || card.company || 'C')[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personName}>{card.personName}</Text>
                    <Text style={styles.companyName}>
                      {card.designation ? `${card.designation} • ` : ''}
                      {card.company}
                    </Text>
                  </View>
                </View>

                {/* Contact details */}
                <View style={styles.detailsBlock}>
                  {card.phones?.[0]?.raw && (
                    <TouchableOpacity
                      style={styles.detailRow}
                      onPress={() => window.open(`tel:${card.phones[0].raw}`)}
                    >
                      <Phone size={14} color={colors.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.detailText}>{card.phones[0].raw}</Text>
                    </TouchableOpacity>
                  )}

                  {card.emails?.[0] && (
                    <TouchableOpacity
                      style={styles.detailRow}
                      onPress={() => window.open(`mailto:${card.emails[0]}`)}
                    >
                      <Mail size={14} color={colors.secondary} style={{ marginRight: 6 }} />
                      <Text style={styles.detailText} numberOfLines={1}>{card.emails[0]}</Text>
                    </TouchableOpacity>
                  )}

                  {card.rawAddress && (
                    <View style={styles.detailRow}>
                      <MapPin size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                      <Text style={styles.detailText} numberOfLines={1}>{card.rawAddress}</Text>
                    </View>
                  )}
                </View>

                {/* Tags row */}
                <View style={styles.tagsRow}>
                  {card.tags.map((t, idx) => (
                    <View key={idx} style={styles.tagBadge}>
                      <Text style={styles.tagBadgeText}>{t}</Text>
                    </View>
                  ))}
                </View>

                {/* Card footer action buttons */}
                <View style={styles.cardFooter}>
                  {card.phones?.[0]?.raw && (
                    <TouchableOpacity
                      style={[styles.footerBtn, { backgroundColor: '#ECFDF5' }]}
                      onPress={() => window.open(`https://wa.me/${card.phones[0].raw.replace(/[^0-9+]/g, '')}`)}
                    >
                      <Text style={[styles.footerBtnText, { color: colors.verifiedGst }]}>WhatsApp</Text>
                    </TouchableOpacity>
                  )}

                  {card.phones?.[0]?.raw && (
                    <TouchableOpacity
                      style={styles.footerBtn}
                      onPress={() => window.open(`tel:${card.phones[0].raw}`)}
                    >
                      <Text style={styles.footerBtnText}>Call</Text>
                    </TouchableOpacity>
                  )}
                </View>
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
  cardItem: {
    padding: spacing.md,
    borderRadius: radii.md
  },
  desktopCardItem: {
    width: 'calc(50% - 8px)',
    marginBottom: 0
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  cardAvatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700'
  },
  personName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  companyName: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1
  },
  detailsBlock: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.xs,
    marginVertical: spacing.xs,
    gap: 4
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  detailText: {
    fontSize: 12,
    color: colors.textSecondary
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginVertical: spacing.xs
  },
  tagBadge: {
    backgroundColor: colors.bgMuted,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.sm
  },
  tagBadgeText: {
    fontSize: 11,
    color: colors.textSecondary
  },
  cardFooter: {
    flexDirection: 'row',
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs
  },
  footerBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight
  },
  footerBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  }
});
