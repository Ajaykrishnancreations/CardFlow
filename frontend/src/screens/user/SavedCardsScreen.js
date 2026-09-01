import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, useWindowDimensions } from 'react-native';
import {
  FolderOpen,
  Search,
  Download,
  Phone,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { EmptyState } from '../../components/EmptyState';
import { BrandSpinner, SkeletonCard } from '../../components/Loader';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { CardThumbnail } from '../../components/CardThumbnail';
import { buildVCardBook, downloadTextFile } from '../../utils/vcard';

export function SavedCardsScreen({ onScanNewCard, onSelectCard }) {
  const { user, token, savedCards: contextCards, loadUserVault } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [cards, setCards] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [exportMsg, setExportMsg] = useState('');

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'recent', label: 'Recent' },
    { id: 'business', label: 'Business' },
    { id: 'people', label: 'People' }
  ];

  const formatCards = (cardList) => {
    if (!cardList || !Array.isArray(cardList)) return [];
    return cardList.map((c) => ({
      ...c,
      id: c.id,
      personName: c.person_name || c.personName || '',
      designation: c.designation || '',
      company: c.company || '',
      phones: Array.isArray(c.phones) ? c.phones : [],
      emails: Array.isArray(c.emails) ? c.emails : [],
      website: c.website || '',
      rawAddress: c.raw_address || c.rawAddress || '',
      gstin: c.gstin || '',
      originalCardImageUrl: c.original_card_image_url || c.originalCardImageUrl || '',
      originalBackImageUrl: c.original_back_image_url || c.originalBackImageUrl || '',
      savedAt: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : ''
    })).filter((c) => c.id);
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
    if (!cards.length) {
      setExportMsg('No contacts to export yet.');
      return;
    }
    downloadTextFile('cardflow-google-contacts.vcf', buildVCardBook(cards));
    setExportMsg(`${cards.length} contacts downloaded as vCard. In Google Contacts, use Import to add them. OAuth export is not configured on this build.`);
  };

  const handleSaveToPhone = async () => {
    if (!cards.length) {
      setExportMsg('No contacts to export yet.');
      return;
    }
    downloadTextFile('cardflow-phone-contacts.vcf', buildVCardBook(cards));
    setExportMsg(`${cards.length} contacts downloaded as vCard. Open the file on your phone to save them to Contacts.`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.countTitle}>My Cards</Text>
        <Text style={styles.countSub}>{cards.length} saved</Text>
      </View>

      <View style={styles.exportSection}>
        <Text style={styles.exportLabel}>Backup & Export</Text>
        <TouchableOpacity style={styles.exportRow} onPress={handleExportGoogle}>
          <Download size={16} color={colors.primary} style={{ marginRight: spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.exportTitle}>Export to Google Contacts</Text>
            <Text style={styles.exportDesc}>Download vCard for Google Import</Text>
          </View>
          <ChevronRight size={16} color={colors.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportRow} onPress={handleSaveToPhone}>
          <Phone size={16} color={colors.primary} style={{ marginRight: spacing.sm }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.exportTitle}>Save to Phone Contacts</Text>
            <Text style={styles.exportDesc}>Download vCard for your phone</Text>
          </View>
          <ChevronRight size={16} color={colors.textMuted} />
        </TouchableOpacity>
        {exportMsg ? <Text style={styles.exportResult}>{exportMsg}</Text> : null}
      </View>

      <View style={[styles.topBar, isDesktop && styles.desktopTopBar]}>
        <View style={styles.searchInputWrap}>
          <Search size={16} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search cards..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>
        <TouchableOpacity onPress={loadCards} style={styles.refreshBtn}>
          <RefreshCw size={15} color={colors.primary} />
        </TouchableOpacity>
      </View>

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

      <ScrollView contentContainerStyle={[styles.cardsScroll, isDesktop && styles.desktopCardsScroll]} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <BrandSpinner size={28} text="Loading cards..." />
            <SkeletonCard count={isDesktop ? 4 : 2} />
          </View>
        ) : filteredCards.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No cards yet"
            description="Use the Scan button below to capture your first business card."
            compact
          />
        ) : (
          <View style={[styles.cardsGrid, isDesktop && styles.desktopCardsGrid]}>
            {filteredCards.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[styles.bizCardItem, isDesktop && styles.desktopCardItem]}
                onPress={() => onSelectCard?.(card)}
                activeOpacity={0.85}
              >
                <CardThumbnail cardId={card.id} imagePath={card.originalCardImageUrl} size={72} />
                <View style={{ flex: 1, marginLeft: spacing.md }}>
                  <Text style={styles.bizCardName}>{card.personName || card.company || 'Contact'}</Text>
                  {card.company ? <Text style={styles.bizCardCompany}>{card.company}</Text> : null}
                  {card.designation ? <Text style={styles.bizCardRole}>{card.designation}</Text> : null}
                  {card.rawAddress ? (
                    <Text style={styles.bizCardText} numberOfLines={1}>{card.rawAddress}</Text>
                  ) : null}
                  {card.gstin ? <Text style={styles.bizCardGst}>GST {card.gstin}</Text> : null}
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMuted },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xs
  },
  countTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, fontFamily: typography.titleMedium.fontFamily },
  countSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  exportSection: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs
  },
  exportLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.7,
    marginBottom: 4,
    textTransform: 'uppercase'
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8
  },
  exportTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  exportDesc: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  exportResult: { fontSize: 12, color: colors.textSecondary, marginTop: spacing.xs, lineHeight: 16 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  desktopTopBar: { gap: spacing.md },
  searchInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 40,
    marginRight: spacing.sm
  },
  input: { flex: 1, fontSize: 14, color: colors.textPrimary, outlineStyle: 'none' },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: radii.button,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tagsFilterWrap: { paddingBottom: spacing.xs },
  tagsScroll: { paddingHorizontal: spacing.lg, gap: 4 },
  tagFilterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.tab
  },
  tagFilterChipActive: { backgroundColor: colors.primaryLight },
  tagFilterText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },
  tagFilterTextActive: { color: colors.primary, fontWeight: '700' },
  cardsScroll: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  desktopCardsScroll: { padding: spacing.lg },
  loadingContainer: { width: '100%', alignItems: 'center' },
  cardsGrid: { flexDirection: 'column', gap: spacing.sm },
  desktopCardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  desktopCardItem: { width: 'calc(50% - 8px)' },
  bizCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md
  },
  bizCardName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  bizCardCompany: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  bizCardRole: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  bizCardText: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  bizCardGst: { fontSize: 11, fontWeight: '600', color: colors.gold, marginTop: 4 }
});
