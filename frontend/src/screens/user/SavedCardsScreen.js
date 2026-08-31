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
  RefreshCw
} from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { mockSavedCards } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';

export function SavedCardsScreen({ onScanNewCard }) {
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [cards, setCards] = useState(mockSavedCards);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const allTags = ['all', 'BNI Chapter', 'CA / Finance', 'Supplier', 'Vendor', 'CODISSIA', 'Metals', 'Scrap', 'Verified'];

  const loadCards = async () => {
    setIsLoading(true);
    const liveCards = await apiClient.getCards(token);
    if (liveCards && liveCards.length > 0) {
      const formatted = liveCards.map((c) => ({
        id: c.id,
        personName: c.person_name || 'Business Contact',
        designation: c.designation || 'Partner',
        company: c.company || 'Enterprise',
        phones: c.phones || [{ raw: '+91 96555 87877', isWhatsapp: true }],
        emails: c.emails || ['contact@enterprise.com'],
        website: c.website || '',
        rawAddress: c.raw_address || 'Coimbatore, Tamil Nadu',
        notes: c.notes || '',
        privateRating: c.private_rating || 5,
        tags: c.tags || ['Verified'],
        savedAt: c.created_at ? new Date(c.created_at).toISOString().split('T')[0] : '2026-08-31',
        hasFrontImage: true,
        hasBackImage: false,
        extractStatus: c.extract_status || 'extracted'
      }));
      setCards(formatted);
    } else {
      setCards([]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadCards();
  }, [token]);

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

  const handleExportVcf = () => {
    alert('Exporting contacts to vCard (.vcf) format...');
  };

  const handleExportCsv = () => {
    alert('Exporting contacts to CSV spreadsheet...');
  };

  return (
    <View style={styles.container}>
      {/* Top Search & Actions */}
      <View style={[styles.topBar, isDesktop && styles.desktopTopBar]}>
        <View style={styles.searchWrap}>
          <Search size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search saved cards by name, company, tag..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
          />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {isDesktop && (
            <Button
              title="Export CSV"
              onPress={handleExportCsv}
              icon={FileSpreadsheet}
              variant="outline"
              size="sm"
            />
          )}
          <Button
            title="Scan Card"
            onPress={onScanNewCard}
            icon={Plus}
            size="sm"
            style={styles.scanBtn}
          />
        </View>
      </View>

      {/* Tag Filters */}
      <View style={styles.tagFiltersWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagScroll}>
          {allTags.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[styles.tagFilterChip, selectedTag === tag && styles.tagFilterChipActive]}
              onPress={() => setSelectedTag(tag)}
            >
              <Text
                style={[
                  styles.tagFilterText,
                  selectedTag === tag && styles.tagFilterTextActive
                ]}
              >
                {tag === 'all' ? 'All Cards' : tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cards List Grid (Multi-column on Desktop, Single Column on Mobile) */}
      <ScrollView contentContainerStyle={[styles.cardsScroll, isDesktop && styles.desktopCardsScroll]} showsVerticalScrollIndicator={false}>
        {filteredCards.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No Saved Cards Found"
            description="Scan a physical business card or add tags to organize your contacts."
            actionLabel="Scan First Card"
            onAction={onScanNewCard}
          />
        ) : (
          <View style={[styles.cardsGrid, isDesktop && styles.desktopCardsGrid]}>
            {filteredCards.map((card) => (
              <Card key={card.id} style={[styles.cardItem, isDesktop && styles.desktopCardItem]}>
                {/* Card Header: Person & Company */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.personName}>{card.personName}</Text>
                    <Text style={styles.designation}>{card.designation}</Text>
                    <Text style={styles.companyName}>{card.company}</Text>
                  </View>
                  <View style={styles.ratingBadge}>
                    <Star size={14} color={colors.warning} fill={colors.warning} />
                    <Text style={styles.ratingText}>{card.privateRating || 5}</Text>
                  </View>
                </View>

                {/* Contact Information */}
                <View style={styles.contactDetails}>
                  {card.phones && card.phones[0] && (
                    <View style={styles.contactRow}>
                      <Phone size={14} color={colors.primary} style={styles.contactIcon} />
                      <Text style={styles.contactText}>{card.phones[0].raw}</Text>
                      {card.phones[0].isWhatsapp && (
                        <View style={styles.whatsappChip}>
                          <Text style={styles.whatsappText}>WhatsApp</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {card.emails && card.emails[0] && (
                    <View style={styles.contactRow}>
                      <Mail size={14} color={colors.textSecondary} style={styles.contactIcon} />
                      <Text style={styles.contactText}>{card.emails[0]}</Text>
                    </View>
                  )}

                  {card.rawAddress && (
                    <View style={styles.contactRow}>
                      <MapPin size={14} color={colors.textSecondary} style={styles.contactIcon} />
                      <Text style={styles.contactText} numberOfLines={1}>
                        {card.rawAddress}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Tags */}
                {card.tags && card.tags.length > 0 && (
                  <View style={styles.cardTagsRow}>
                    {card.tags.map((t, idx) => (
                      <View key={idx} style={styles.tagChip}>
                        <Text style={styles.tagText}>{t}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Quick Actions Row */}
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => window.open(`tel:${card.phones[0]?.raw}`)}
                  >
                    <Phone size={14} color={colors.primary} />
                    <Text style={styles.actionBtnText}>Call</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => window.open(`https://wa.me/${card.phones[0]?.raw?.replace(/[^0-9]/g, '')}`)}
                  >
                    <Text style={[styles.actionBtnText, { color: '#10B981', fontWeight: '700' }]}>
                      WhatsApp
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => window.open(`mailto:${card.emails[0]}`)}
                  >
                    <Mail size={14} color={colors.textSecondary} />
                    <Text style={styles.actionBtnText}>Email</Text>
                  </TouchableOpacity>
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
    backgroundColor: '#0F172A'
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderColor: '#334155'
  },
  desktopTopBar: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 40,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: '#334155'
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    outlineStyle: 'none'
  },
  scanBtn: {
    height: 40
  },
  tagFiltersWrap: {
    backgroundColor: '#1E293B',
    borderBottomWidth: 1,
    borderColor: '#334155',
    paddingVertical: spacing.sm
  },
  tagScroll: {
    paddingHorizontal: spacing.md,
    gap: spacing.xs
  },
  tagFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: '#0F172A',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155'
  },
  tagFilterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  tagFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8'
  },
  tagFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  cardsScroll: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl
  },
  desktopCardsScroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  cardsGrid: {
    flexDirection: 'column',
    width: '100%'
  },
  desktopCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md
  },
  desktopCardItem: {
    width: 'calc(50% - 8px)',
    marginBottom: 0
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm
  },
  personName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary
  },
  designation: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginTop: 2
  },
  companyName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 2
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.sm,
    gap: 2
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706'
  },
  contactDetails: {
    backgroundColor: '#F8FAFC',
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
    gap: 4
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  contactIcon: {
    marginRight: 6
  },
  contactText: {
    fontSize: 12,
    color: colors.textPrimary,
    fontWeight: '500',
    flex: 1
  },
  whatsappChip: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  whatsappText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '700'
  },
  cardTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: spacing.sm
  },
  tagChip: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  tagText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600'
  },
  cardActionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: spacing.sm,
    gap: spacing.sm
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: radii.sm,
    backgroundColor: '#F8FAFC',
    gap: 4
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary
  }
});
