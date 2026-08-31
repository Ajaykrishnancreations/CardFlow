import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Building2, Plus, CheckCircle2, ChevronRight, Edit3, ShieldCheck, MapPin } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { mockBusinesses } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

export function MyBusinessesScreen({ onSelectBusiness, onAddNewBusiness }) {
  const { user, activeBusinessId, switchActiveBusiness } = useAuth();

  const ownerBusinesses = mockBusinesses.filter(
    (b) => user?.ownedBusinessIds?.includes(b.id) || b.ownerPhone === user?.phone
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Businesses</Text>
          <Text style={styles.subtitle}>
            Manage all your business listings under one owner account.
          </Text>
        </View>
        <Button
          title="+ Add Business"
          onPress={onAddNewBusiness}
          size="sm"
          style={styles.addBtn}
        />
      </View>

      {/* List of Businesses */}
      {ownerBusinesses.map((biz) => {
        const isCurrent = biz.id === activeBusinessId;
        return (
          <Card
            key={biz.id}
            onPress={() => {
              switchActiveBusiness(biz.id);
              onSelectBusiness(biz);
            }}
            style={[styles.bizCard, isCurrent && styles.bizCardActive]}
          >
            <View style={styles.topRow}>
              <View style={styles.logoWrap}>
                <Building2 size={24} color={isCurrent ? colors.primary : colors.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={styles.bizName}>{biz.name}</Text>
                  {isCurrent && (
                    <View style={styles.activeTag}>
                      <Text style={styles.activeTagText}>ACTIVE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.bizCategory}>{biz.category} • {biz.city}</Text>
              </View>
            </View>

            <View style={styles.detailsRow}>
              <Badge type="gst" label="GST Verified" />
              <Text style={styles.pincodeText}>Pin: {biz.pincode}</Text>
              <Text style={styles.viewsText}>{biz.viewsCount || 200} Views</Text>
            </View>

            <View style={styles.cardActions}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  switchActiveBusiness(biz.id);
                  onSelectBusiness(biz);
                }}
              >
                <Text style={styles.actionBtnText}>Open Dashboard</Text>
                <ChevronRight size={14} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </Card>
        );
      })}

      {/* Plan Capacity Note */}
      <Card style={styles.planCard}>
        <Text style={styles.planTitle}>Plan Business Capacity</Text>
        <Text style={styles.planDesc}>
          Your <Text style={{ fontWeight: '700' }}>Business Plus</Text> plan allows up to 2 active businesses. Upgrade to Business Premium to manage up to 5 businesses.
        </Text>
      </Card>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  title: {
    ...typography.titleMedium,
    color: colors.textPrimary
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 240
  },
  addBtn: {
    paddingHorizontal: spacing.sm
  },
  bizCard: {
    marginBottom: spacing.md
  },
  bizCardActive: {
    borderColor: colors.primary,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF'
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
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
  bizCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1
  },
  activeTag: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.xs
  },
  activeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.primary
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border
  },
  pincodeText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: spacing.sm
  },
  viewsText: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: 'auto'
  },
  cardActions: {
    marginTop: spacing.xs,
    alignItems: 'flex-end'
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginRight: 2
  },
  planCard: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    marginTop: spacing.sm
  },
  planTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4
  },
  planDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary
  }
});
