import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { Search, SlidersHorizontal, MapPin, Building2, Phone, MessageSquare, Navigation, Check, BookmarkCheck, BookmarkPlus, Sparkles } from 'lucide-react';
import { colors, radii, spacing, typography, shadows } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { BrandSpinner, SkeletonCard } from '../../components/Loader';
import { categories as fallbackCategories, mockBusinesses } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { DetailScreenHeader } from '../../components/DetailScreenHeader';

export function SearchScreen({ onSelectBusiness, initialCategoryId, onBack }) {
  const { isBusinessSaved, saveBusinessToVault, savedCards } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCat, setSelectedCat] = useState(initialCategoryId || 'all');
  const [selectedRadius, setSelectedRadius] = useState(10); // km
  const [gstOnly, setGstOnly] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isSearching, setIsSearching] = useState(true);
  const [liveCategories, setLiveCategories] = useState(fallbackCategories);
  const [businesses, setBusinesses] = useState(mockBusinesses);

  const radiusOptions = [2, 5, 10, 25];

  // Fetch dynamic categories and businesses from API
  const loadDirectoryData = useCallback(async () => {
    setIsSearching(true);
    try {
      const [catsRes, bizRes] = await Promise.all([
        apiClient.getCategories(),
        apiClient.searchBusinesses({ q: searchQuery, category: selectedCat !== 'all' ? selectedCat : '', radius: selectedRadius })
      ]);

      if (catsRes && Array.isArray(catsRes) && catsRes.length > 0) {
        setLiveCategories(catsRes);
      }

      let fetchedList = (bizRes && Array.isArray(bizRes) && bizRes.length > 0) ? bizRes : mockBusinesses;

      // Also merge any cards saved in vault that are business cards
      if (savedCards && savedCards.length > 0) {
        const customVaultBiz = savedCards.map((card, idx) => ({
          id: card.id || `vault-biz-${idx}`,
          name: card.company || card.person_name || 'Business Contact',
          slug: (card.company || card.person_name || 'biz').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          categoryId: 'manufacturing',
          category: card.tags?.[0] || 'Business Services',
          description: card.notes || `${card.person_name || 'Partner'} - ${card.designation || 'Business Executive'}`,
          verification: 'gst',
          distanceKm: 1.2,
          pincode: '641049',
          rating: card.private_rating || 5.0,
          reviewCount: 12,
          phone: card.phones?.[0]?.raw || card.phones?.[0]?.e164 || '+919655587877',
          address: card.raw_address || 'Coimbatore, Tamil Nadu',
          services: card.tags || ['Verified Business', 'Direct Contact']
        }));

        // Merge without duplicates by phone or name
        const existingNames = new Set(fetchedList.map(b => (b.name || '').toLowerCase().trim()));
        customVaultBiz.forEach(vb => {
          const vName = (vb.name || '').toLowerCase().trim();
          if (vName && !existingNames.has(vName)) {
            existingNames.add(vName);
            fetchedList = [vb, ...fetchedList];
          }
        });
      }

      setBusinesses(fetchedList);
    } catch (e) {
      console.warn('Error fetching directory:', e);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, selectedCat, selectedRadius, savedCards]);

  useEffect(() => {
    loadDirectoryData();
  }, [loadDirectoryData]);

  const handleCategorySelect = (catId) => {
    setSelectedCat(catId);
  };

  const filteredBusinesses = businesses.filter((biz) => {
    if (selectedCat !== 'all' && biz.categoryId !== selectedCat && biz.category?.toLowerCase() !== selectedCat.toLowerCase()) return false;
    if (gstOnly && biz.verification !== 'gst') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (biz.name || '').toLowerCase().includes(q);
      const matchDesc = (biz.description || '').toLowerCase().includes(q);
      const matchCat = (biz.category || '').toLowerCase().includes(q);
      const matchPincode = (biz.pincode || '').includes(q);
      const matchServices = Array.isArray(biz.services) && biz.services.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchCat && !matchPincode && !matchServices) {
        return false;
      }
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {onBack ? (
        <DetailScreenHeader title="Browse Businesses" subtitle="Discover verified businesses" onBack={onBack} />
      ) : null}
      {/* Search Input Bar */}
      <View style={styles.topBar}>
        <View style={styles.searchInputWrap}>
          <Search size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search businesses, services, pincodes..."
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
                style={[styles.radiusBtn, selectedRadius === r && styles.radiusBtnActive]}
                onPress={() => setSelectedRadius(r)}
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
            onPress={() => handleCategorySelect('all')}
          >
            <Text style={[styles.catChipText, selectedCat === 'all' && styles.catChipTextActive]}>
              All Categories
            </Text>
          </TouchableOpacity>
          {liveCategories.map((c) => (
            <TouchableOpacity
              key={c.id || c.slug}
              style={[styles.catChip, selectedCat === (c.id || c.slug) && styles.catChipActive]}
              onPress={() => handleCategorySelect(c.id || c.slug)}
            >
              <Text style={[styles.catChipText, selectedCat === (c.id || c.slug) && styles.catChipTextActive]}>
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Search Results List or Animated Skeletons */}
      <ScrollView contentContainerStyle={styles.resultsScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsMetaRow}>
          <Text style={styles.resultsCount}>
            {isSearching ? 'Filtering directory...' : `${filteredBusinesses.length} verified businesses found`}
          </Text>
        </View>

        {isSearching ? (
          <View style={styles.loadingWrapper}>
            <BrandSpinner size={28} text="Loading dynamic directory..." />
            <SkeletonCard count={3} />
          </View>
        ) : filteredBusinesses.length === 0 ? (
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
          filteredBusinesses.map((biz) => {
            const isSaved = isBusinessSaved(biz);
            return (
              <Card key={biz.id} onPress={() => onSelectBusiness(biz)} style={styles.bizCard}>
                {/* Top Right SAVED Chip if already in user vault */}
                {isSaved && (
                  <View style={styles.savedChip}>
                    <BookmarkCheck size={13} color="#059669" style={{ marginRight: 4 }} />
                    <Text style={styles.savedChipText}>SAVED</Text>
                  </View>
                )}

                <View style={styles.bizHeader}>
                  <View style={styles.bizLogo}>
                    <Building2 size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, paddingRight: isSaved ? 70 : 0 }}>
                    <Text style={styles.bizName}>{biz.name}</Text>
                    <Text style={styles.bizCat}>{biz.category} • {biz.distanceKm || 1.5} km</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      <Badge type="gst" label="GST Verified" />
                      <Text style={styles.pincode}>Pin: {biz.pincode || '641004'}</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.bizDesc} numberOfLines={2}>{biz.description}</Text>

                {/* Service tags */}
                <View style={styles.serviceChipsRow}>
                  {(biz.services || ['CNC Machining', 'Fabrication']).slice(0, 3).map((s, idx) => (
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
                    onPress={() => window.open(`https://wa.me/${(biz.phone || '').replace(/[^0-9]/g, '')}`)}
                  >
                    <MessageSquare size={14} color={colors.verifiedGst} />
                    <Text style={[styles.btnActionText, { color: colors.verifiedGst }]}>WhatsApp</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.btnAction}
                    onPress={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(biz.address || biz.name)}`)}
                  >
                    <Navigation size={14} color={colors.textSecondary} />
                    <Text style={[styles.btnActionText, { color: colors.textSecondary }]}>Directions</Text>
                  </TouchableOpacity>

                  {/* 1-Tap Save to Vault Button */}
                  <TouchableOpacity
                    style={[styles.btnAction, isSaved ? styles.btnActionSaved : styles.btnActionSave]}
                    onPress={async (e) => {
                      e.stopPropagation();
                      if (!isSaved) {
                        await saveBusinessToVault(biz);
                      }
                    }}
                  >
                    {isSaved ? (
                      <>
                        <BookmarkCheck size={14} color="#059669" />
                        <Text style={[styles.btnActionText, { color: '#059669', fontWeight: '700' }]}>Saved</Text>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus size={14} color={colors.primary} />
                        <Text style={[styles.btnActionText, { color: colors.primary, fontWeight: '700' }]}>Save</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </Card>
            );
          })
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
    backgroundColor: colors.bgMuted,
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterToggleActive: {
    backgroundColor: colors.primary
  },
  filterPanel: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  filterSectionTitle: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  radiusRow: {
    flexDirection: 'row',
    marginBottom: spacing.md
  },
  radiusBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
    backgroundColor: '#FFFFFF'
  },
  radiusBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  radiusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  radiusTextActive: {
    color: colors.primary,
    fontWeight: '700'
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
    marginRight: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  gstToggleLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '500'
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
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.bgMuted,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  catChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  catChipTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  resultsScroll: {
    padding: spacing.lg,
    paddingBottom: 40
  },
  resultsMetaRow: {
    marginBottom: spacing.md
  },
  resultsCount: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.textSecondary
  },
  loadingWrapper: {
    paddingVertical: spacing.md
  },
  bizCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    position: 'relative'
  },
  savedChip: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    backgroundColor: '#D1FAE5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: radii.full,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    zIndex: 10
  },
  savedChipText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#065F46',
    letterSpacing: 0.5
  },
  bizHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm
  },
  bizLogo: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  bizName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2
  },
  bizCat: {
    ...typography.caption,
    color: colors.textSecondary
  },
  pincode: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: spacing.sm
  },
  bizDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm
  },
  serviceChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: spacing.md
  },
  serviceChip: {
    backgroundColor: colors.bgMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm,
    marginRight: 6,
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
    paddingTop: spacing.sm,
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  btnAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: radii.sm,
    backgroundColor: colors.bgMuted,
    marginHorizontal: 3
  },
  btnActionSave: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  btnActionSaved: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  btnActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4
  }
});
