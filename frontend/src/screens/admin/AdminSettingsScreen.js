import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Settings, Check, Shield, Database, Sparkles, FileText } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

export function AdminSettingsScreen() {
  const [preModeration, setPreModeration] = useState(false);
  const [sponsoredCap, setSponsoredCap] = useState(2);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>System Configuration</Text>
        <Text style={styles.subtitle}>Feature flags, search thresholds, and platform policy controls.</Text>
      </View>

      <Card style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingTitle}>Pre-Moderation Mode</Text>
            <Text style={styles.settingDesc}>Require manual admin approval before any business listing goes live.</Text>
          </View>
          <TouchableOpacity
            style={[styles.toggleBtn, preModeration && styles.toggleBtnActive]}
            onPress={() => setPreModeration(!preModeration)}
          >
            <View style={[styles.toggleThumb, preModeration && styles.toggleThumbActive]} />
          </TouchableOpacity>
        </View>
      </Card>

      <Card style={styles.settingCard}>
        <Text style={styles.settingTitle}>Sponsored Slots Cap</Text>
        <Text style={styles.settingDesc}>Maximum featured/sponsored listings allowed per category search result (Default: 2).</Text>
        <View style={styles.capRow}>
          {[1, 2, 3, 4].map((c) => (
            <TouchableOpacity
              key={c}
              onPress={() => setSponsoredCap(c)}
              style={[styles.capChip, sponsoredCap === c && styles.capChipActive]}
            >
              <Text style={[styles.capText, sponsoredCap === c && styles.capTextActive]}>{c} Slots</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card style={styles.auditCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
          <FileText size={18} color={colors.primary} />
          <Text style={styles.auditTitle}>Immutable Audit Trail</Text>
        </View>
        <Text style={styles.auditDesc}>
          Every administrative approval, KYC override, and manual credit grant is cryptographically logged with timestamp and IP address.
        </Text>
        <Button
          title="Export Audit Logs (.csv)"
          variant="outline"
          size="sm"
          style={{ marginTop: spacing.md }}
          onPress={() => alert('Audit logs export generated.')}
        />
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
    marginBottom: spacing.lg
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
  settingCard: {
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  settingDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    maxWidth: 260
  },
  toggleBtn: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    padding: 2,
    justifyContent: 'center'
  },
  toggleBtnActive: {
    backgroundColor: colors.primary
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF'
  },
  toggleThumbActive: {
    alignSelf: 'flex-end'
  },
  capRow: {
    flexDirection: 'row',
    marginTop: spacing.md
  },
  capChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    backgroundColor: colors.bgMuted,
    marginRight: spacing.sm
  },
  capChipActive: {
    backgroundColor: colors.primary
  },
  capText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  capTextActive: {
    color: '#FFFFFF'
  },
  auditCard: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    padding: spacing.lg
  },
  auditTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginLeft: spacing.sm
  },
  auditDesc: {
    fontSize: 12,
    lineHeight: 18,
    color: colors.textSecondary
  }
});
