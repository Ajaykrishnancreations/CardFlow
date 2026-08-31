import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Search, SlidersHorizontal, MapPin, Building2, Phone, MessageSquare, Navigation, Check } from 'lucide-react';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { categories, mockBusinesses } from '../../data/mockData';

export function SearchScreen({ onSelectBusiness, initialCategoryId }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState(initialCategoryId || 'all');
  const [selectedRadius, setSelectedRadius] = useState(10); // km
  const [gstOnly, setGstOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const radiusOptions = [2, 5, 10, 25];

  const filteredBusinesses = mockBusinesses.filter((biz) => {
    if (selectedCat !== 'all' && biz.categoryId !== selectedCat) return false;
    if (gstOnly && biz.verification !== 'gst') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = biz.name.toLowerCase().includes(q);
      const matchDesc = biz.description.toLowerCase().includes(q);
      const matchCat = biz.category.toLowerCase().includes(q);
      const matchPincode = biz.pincode.includes(q);
      const matchServices = biz.services.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchCat && !matchPincode && !matchServices) {
        return false;
      }
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Search Input Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchInputWrap}>
          <Search size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name, service, or pincode..."
            placeholderTextColor={colors.textMuted}
            style={styles.input}
            autoFocus={false}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterToggleBtn, showFilters && styles.filterToggleActive]}
          onPress={() => setShowFilters(!showFilters)}
          activeOpacity={0.8}
        >
          <SlidersHorizontal size={18} color={showFilters ? '#FFFFFF' : colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Expandable Filter Panel */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <Text style={styles.filterSectionTitle}>Radius Distance</Text>
          <View style={styles.radiusRow}>
            {radiusOptions.map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setSelectedRadius(r)}
                style={[styles.radiusChip, selectedRadius === r && styles.radiusChipActive]}
              >
                <Text style={[styles.radiusText, selectedRadius === r && styles.radiusTextActive]}>
                  {r} km
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.gstToggleRow}>
            <TouchableOpacity
              style={[styles.checkbox, gstOnly && styles.checkboxChecked]}
              onPress={() => setGstOnly(!gstOnly)}
            >
              {gstOnly && <Check size={14} color="#FFFFFF" />}
            </TouchableOpacity>
            <Text style={styles.gstToggleLabel}>GST Verified Businesses Only</Text>
          </View>
        </View>
      )}

      {/* Category Filter Chips */}
      <View style={styles.catChipsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsScroll}>
          <TouchableOpacity
            style={[styles.catChip, selectedCat === 'all' && styles.catChipActive]}
            onPress={() => setSelectedCat('all')}
          >
            <Text style={[styles.catChipText, selectedCat === 'all' && styles.catChipTextActive]}>
              All Categories
            </Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catChip, selectedCat === c.id && styles.catChipActive]}
              onPress={() => setSelectedCat(c.id)}
            >
              <Text style={[styles.catChipText, selectedCat === c.id && styles.catChipTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Results List */}
      <ScrollView contentContainerStyle={styles.resultsScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsMetaRow}>
          <Text style={styles.resultsCount}>
            {filteredBusinesses.length} verified businesses found
          </Text>
        </View>

        {filteredBusinesses.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="No businesses found"
            description="Try adjusting your search keywords, radius, or category filters."
            actionTitle="Reset Filters"
            onAction={() => {
              setSearchQuery('');
              setSelectedCat('all');
              setGstOnly(false);
            }}
          />
        ) : (
          filteredBusinesses.map((biz) => (
            <Card key={biz.id} onPress={() => onSelectBusiness(biz)} style={styles.bizCard}>
              <View style={styles.bizHeader}>
                <View style={styles.bizLogo}>
                  <Building2 size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bizName}>{biz.name}</Text>
                  <Text style={styles.bizCat}>{biz.category} • {biz.distanceKm} km</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                    <Badge type="gst" label="GST Verified" />
                    <Text style={styles.pincode}>Pin: {biz.pincode}</Text>
                  </View>
                </View>
              </View>

              <Text style={styles.bizDesc} numberOfLines={2}>{biz.description}</Text>

              {/* Service tags */}
              <View style={styles.serviceChipsRow}>
                {biz.services.slice(0, 3).map((s, idx) => (
                  <View key={idx} style={styles.serviceChip}>
                    <Text style={styles.serviceText}>{s}</Text>
                  </View>
                ))}
              </View>

              {/* Action Buttons */}
              <View style={styles.bizActions}>
                <TouchableOpacity style={styles.btnAction} onPress={() => window.open(`tel:${biz.phone}`)}>
                  <Phone size={14} color={colors.primary} />
                  <Text style={styles.btnActionText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnAction, { backgroundColor: '#ECFDF5' }]}
                  onPress={() => window.open(`https://wa.me/${biz.phone}`)}
                >
                  <MessageSquare size={14} color={colors.verifiedGst} />
                  <Text style={[styles.btnActionText, { color: colors.verifiedGst }]}>WhatsApp</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnAction}
                  onPress={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(biz.address)}`)}
                >
                  <Navigation size={14} color={colors.textSecondary} />
                  <Text style={[styles.btnActionText, { color: colors.textSecondary }]}>Directions</Text>
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border
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
  filterToggleBtn: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  filterToggleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  filterPanel: {
    backgroundColor: '#FFFFFF',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  filterSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs
  },
  radiusRow: {
    flexDirection: 'row',
    marginBottom: spacing.md
  },
  radiusChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.sm,
    backgroundColor: colors.bgMuted,
    marginRight: spacing.sm
  },
  radiusChipActive: {
    backgroundColor: colors.primary
  },
  radiusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  radiusTextActive: {
    color: '#FFFFFF'
  },
  gstToggleRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    backgroundColor: '#FFFFFF'
  },
  checkboxChecked: {
    backgroundColor: colors.verifiedGst,
    borderColor: colors.verifiedGst
  },
  gstToggleLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  catChipsWrapper: {
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  catChipsScroll: {
    paddingHorizontal: spacing.lg
  },
  catChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.full,
    backgroundColor: colors.bgMuted,
    marginRight: spacing.xs
  },
  catChipActive: {
    backgroundColor: colors.primary
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  catChipTextActive: {
    color: '#FFFFFF'
  },
  resultsScroll: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  resultsMetaRow: {
    marginBottom: spacing.md
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted
  },
  bizCard: {
    marginBottom: spacing.md
  },
  bizHeader: {
    flexDirection: 'row',
    marginBottom: spacing.sm
  },
  bizLogo: {
    width: 48,
    height: 48,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  bizName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  bizCat: {
    fontSize: 12,
    color: colors.textSecondary,
    marginVertical: 2
  },
  pincode: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: spacing.sm
  },
  bizDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  serviceChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md
  },
  serviceChip: {
    backgroundColor: colors.bgMuted,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.sm,
    marginRight: 4,
    marginBottom: 4
  },
  serviceText: {
    fontSize: 11,
    color: colors.textSecondary
  },
  bizActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm
  },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    marginRight: spacing.sm
  },
  btnActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 4
  }
});
