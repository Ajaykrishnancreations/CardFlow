import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { Building2, Search, CheckCircle2, ShieldAlert } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { mockBusinesses } from '../../data/mockData';

export function AdminBusinessesScreen() {
  const [search, setSearch] = useState('');

  const filtered = mockBusinesses.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Listings Management</Text>
        <Text style={styles.subtitle}>Audit business directory status, verification badges, and search visibility.</Text>
      </View>

      <View style={styles.searchWrap}>
        <Search size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search listing by name or category..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>

      {filtered.map((biz) => (
        <Card key={biz.id} style={styles.bizCard}>
          <View style={styles.bizRow}>
            <View style={styles.logoWrap}>
              <Building2 size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bizName}>{biz.name}</Text>
              <Text style={styles.bizCat}>{biz.category} • {biz.city} ({biz.pincode})</Text>
              <View style={styles.badgesRow}>
                <Badge type="gst" label="GST Verified" />
                <View style={styles.visibilityChip}>
                  <Text style={styles.visibilityText}>LISTED IN SEARCH</Text>
                </View>
              </View>
            </View>
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
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  header: {
    marginBottom: spacing.md
  },
  title: {
    ...typography.titleMedium,
    color: colors.textPrimary
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.md
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    outlineStyle: 'none'
  },
  bizCard: {
    marginBottom: spacing.sm,
    padding: spacing.md
  },
  bizRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoWrap: {
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
    color: colors.textPrimary
  },
  bizCat: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  visibilityChip: {
    backgroundColor: colors.verifiedGstBg,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.xs,
    marginLeft: 6
  },
  visibilityText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.verifiedGst
  }
});
