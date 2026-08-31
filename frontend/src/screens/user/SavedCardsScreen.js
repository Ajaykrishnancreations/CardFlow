import React, { useState } from 'react';
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
  Plus
} from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { mockSavedCards } from '../../data/mockData';

export function SavedCardsScreen({ onScanNewCard }) {
  const [cards, setCards] = useState(mockSavedCards);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState('all');

  const allTags = ['all', 'BNI Chapter', 'CA / Finance', 'Supplier', 'Vendor', 'CODISSIA'];

  const filteredCards = cards.filter((c) => {
    if (selectedTag !== 'all' && !c.tags.includes(selectedTag)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.personName.toLowerCase().includes(q);
      const matchCompany = c.company.toLowerCase().includes(q);
      const matchNotes = c.notes.toLowerCase().includes(q);
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
              <Text style={[styles.tagFilterText, selectedTag === tag && styles.tagFilterTextActive]}>
                {tag === 'all' ? 'All Tags' : tag}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Export Bar */}
      <View style={styles.exportBar}>
        <Text style={styles.totalCardsText}>{filteredCards.length} Cards in Vault</Text>
        <View style={styles.exportButtonsRow}>
          <TouchableOpacity onPress={handleExportVcf} style={styles.exportAction}>
            <Download size={14} color={colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.exportText}>vCard</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleExportCsv} style={[styles.exportAction, { marginLeft: spacing.sm }]}>
            <FileSpreadsheet size={14} color={colors.verifiedGst} style={{ marginRight: 4 }} />
            <Text style={[styles.exportText, { color: colors.verifiedGst }]}>CSV</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cards List */}
      <ScrollView contentContainerStyle={styles.cardsScroll} showsVerticalScrollIndicator={false}>
        {filteredCards.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title="Card Vault is empty"
            description="Scan physical business cards or save photos to start building your personal directory."
            actionTitle="Scan First Card"
            onAction={onScanNewCard}
          />
        ) : (
          filteredCards.map((card) => (
            <Card key={card.id} style={styles.cardItem}>
              {/* Card Top Row */}
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{card.personName[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.personName}>{card.personName}</Text>
                  <Text style={styles.designation}>{card.designation}</Text>
                  <Text style={styles.company}>{card.company}</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Star size={12} color="#D97706" fill="#D97706" style={{ marginRight: 2 }} />
                  <Text style={styles.ratingText}>{card.privateRating}</Text>
                </View>
              </View>

              {/* Contact details */}
              <View style={styles.contactDetails}>
                {card.phones.map((p, idx) => (
                  <View key={idx} style={styles.detailRow}>
                    <Phone size={14} color={colors.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>{p.raw} ({p.label})</Text>
                  </View>
                ))}
                {card.emails.map((e, idx) => (
                  <View key={idx} style={styles.detailRow}>
                    <Mail size={14} color={colors.textSecondary} style={{ marginRight: 6 }} />
                    <Text style={styles.detailText}>{e}</Text>
                  </View>
                ))}
                {card.rawAddress && (
                  <View style={styles.detailRow}>
                    <MapPin size={14} color={colors.textMuted} style={{ marginRight: 6 }} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{card.rawAddress}</Text>
                  </View>
                )}
              </View>

              {/* Private Meeting Context / Notes */}
              {card.notes && (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>"{card.notes}"</Text>
                </View>
              )}

              {/* Tags & Actions footer */}
              <View style={styles.cardFooter}>
                <View style={styles.tagsRow}>
                  {card.tags.map((t, idx) => (
                    <View key={idx} style={styles.tagBadge}>
                      <Tag size={10} color={colors.textSecondary} style={{ marginRight: 3 }} />
                      <Text style={styles.tagBadgeText}>{t}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.cardActionIcons}>
                  <TouchableOpacity
                    style={styles.smallAction}
                    onPress={() => window.open(`tel:${card.phones[0]?.raw}`)}
                  >
                    <Phone size={16} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.smallAction}
                    onPress={() => window.open(`https://wa.me/${card.phones[0]?.raw}`)}
                  >
                    <Share2 size={16} color={colors.verifiedGst} />
                  </TouchableOpacity>
                </View>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  searchWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgMuted,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 42,
    marginRight: spacing.sm
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    outlineStyle: 'none'
  },
  scanBtn: {
    paddingHorizontal: spacing.md
  },
  tagFiltersWrap: {
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  tagScroll: {
    paddingHorizontal: spacing.lg
  },
  tagFilterChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: colors.bgMuted,
    marginRight: spacing.xs
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
  exportBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm
  },
  totalCardsText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary
  },
  exportButtonsRow: {
    flexDirection: 'row'
  },
  exportAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border
  },
  exportText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  cardsScroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  cardItem: {
    marginBottom: spacing.md
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.secondary
  },
  personName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  designation: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1
  },
  company: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primaryDark,
    marginTop: 2
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: radii.full
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400E'
  },
  contactDetails: {
    paddingVertical: spacing.xs
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  detailText: {
    fontSize: 12,
    color: colors.textPrimary
  },
  notesBox: {
    backgroundColor: colors.bgMuted,
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginVertical: spacing.xs
  },
  notesText: {
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.textSecondary
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    marginTop: spacing.xs
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgMuted,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.xs,
    marginRight: 4,
    marginBottom: 2
  },
  tagBadgeText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  cardActionIcons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  smallAction: {
    padding: 6,
    borderRadius: radii.sm,
    backgroundColor: colors.bgMuted,
    marginLeft: 6
  }
});
