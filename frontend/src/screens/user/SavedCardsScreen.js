import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
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
  const [cards, setCards] = useState(mockSavedCards);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');
  const [isLoading, setIsLoading] = useState(false);

  const allTags = ['all', 'BNI Chapter', 'CA / Finance', 'Supplier', 'Vendor', 'CODISSIA', 'Metals', 'Scrap'];

  const loadCards = async () => {
    setIsLoading(true);
    const liveCards = await apiClient.getCards(token);
    if (liveCards && liveCards.length > 0) {
      // Normalize live backend cards to screen format
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
      <View style={styles.topBar}>
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
        <Button
          title="Scan"
          onPress={onScanNewCard}
          icon={Plus}
          size="sm"
          style={styles.scanBtn}
        />
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

      {/* Cards List */}
      <ScrollView contentContainerStyle={styles.cardsScroll} showsVerticalScrollIndicator={false}>
        {filteredCards.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="No Saved Cards Found"
            description="Scan a physical business card or add tags to organize your contacts."
            actionLabel="Scan First Card"
            onAction={onScanNewCard}
          />
        ) : (
          filteredCards.map((card) => (
            <Card key={card.id} style={styles.cardItem}>
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
          ))
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
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: colors.border
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 40,
    marginRight: spacing.sm
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: colors.textPrimary,
    outlineStyle: 'none'
  },
  scanBtn: {
    height: 40
  },
  tagFiltersWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: colors.border,
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
    backgroundColor: '#F1F5F9',
    marginRight: 6
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
    color: '#FFFFFF',
    fontWeight: '700'
  },
  cardsScroll: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl
  },
  cardItem: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md
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
    color: colors.textSecondary,
    marginTop: 1
  },
  companyName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.accentBlue,
    marginTop: 2
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs,
    gap: 3
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706'
  },
  contactDetails: {
    backgroundColor: '#F8FAFC',
    borderRadius: radii.sm,
    padding: spacing.sm,
    marginVertical: spacing.xs,
    gap: 4
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  contactIcon: {
    marginRight: spacing.sm
  },
  contactText: {
    fontSize: 12,
    color: colors.textPrimary,
    flex: 1
  },
  whatsappChip: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radii.xs
  },
  whatsappText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669'
  },
  cardTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: spacing.xs
  },
  tagChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radii.xs
  },
  tagText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600'
  },
  cardActionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    gap: spacing.sm
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    backgroundColor: '#F8FAFC',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    cursor: 'pointer'
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary
  }
});
