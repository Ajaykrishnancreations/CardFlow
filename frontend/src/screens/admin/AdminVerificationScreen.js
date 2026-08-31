import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ShieldCheck, Check, X, AlertTriangle, Building2, UserCheck } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';

const mockKycQueue = [
  {
    id: 'kyc-1',
    businessName: 'Kovai Precision Tools',
    enteredName: 'Kovai Precision Tools',
    registryName: 'KOVAI PRECISION TOOLS PRIVATE LIMITED',
    gstin: '33AAAAA0000A1Z5',
    matchScore: 92.5,
    pincode: '641004',
    city: 'Coimbatore',
    submittedAt: 'Today, 2:15 PM',
    status: 'pending'
  },
  {
    id: 'kyc-2',
    businessName: 'Sri Lakshmi Fabrics',
    enteredName: 'Sri Lakshmi Fabrics',
    registryName: 'SRI LAKSHMI TEX MILLS LLP',
    gstin: '33CCCCC2222C3Z7',
    matchScore: 78.0,
    pincode: '641015',
    city: 'Coimbatore',
    submittedAt: 'Today, 11:30 AM',
    status: 'pending'
  }
];

export function AdminVerificationScreen() {
  const [queue, setQueue] = useState(mockKycQueue);

  const handleResolve = (id, action) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
    alert(`Verification ${action.toUpperCase()} processed. Listing search visibility updated.`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>KYC Verification Queue</Text>
        <Text style={styles.subtitle}>
          Compare registered GSTIN legal names against entered brand names to approve discovery listing.
        </Text>
      </View>

      {queue.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="KYC Queue is Clear"
          description="All submitted business verification requests have been reviewed."
        />
      ) : (
        queue.map((item) => (
          <Card key={item.id} style={styles.kycCard}>
            <View style={styles.kycHeader}>
              <View style={styles.logoWrap}>
                <Building2 size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bizName}>{item.businessName}</Text>
                <Text style={styles.metaText}>GSTIN: {item.gstin} • {item.city} ({item.pincode})</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>{item.matchScore}% Match</Text>
              </View>
            </View>

            {/* Side-by-side comparison */}
            <View style={styles.comparisonBox}>
              <View style={styles.compareRow}>
                <Text style={styles.compareLabel}>Entered Name:</Text>
                <Text style={styles.enteredValue}>{item.enteredName}</Text>
              </View>
              <View style={styles.compareRow}>
                <Text style={styles.compareLabel}>Govt Registry Name:</Text>
                <Text style={styles.registryValue}>{item.registryName}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <Button
                title="Reject"
                variant="danger"
                size="sm"
                icon={X}
                style={{ flex: 1, marginRight: spacing.sm }}
                onPress={() => handleResolve(item.id, 'reject')}
              />
              <Button
                title="Approve & List"
                variant="primary"
                size="sm"
                icon={Check}
                style={{ flex: 1 }}
                onPress={() => handleResolve(item.id, 'approve')}
              />
            </View>
          </Card>
        ))
      )}
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
  kycCard: {
    marginBottom: spacing.md
  },
  kycHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  logoWrap: {
    width: 40,
    height: 40,
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
  metaText: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1
  },
  scoreBadge: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: radii.full
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.verifiedGst
  },
  comparisonBox: {
    backgroundColor: colors.bgMuted,
    padding: spacing.md,
    borderRadius: radii.md,
    marginVertical: spacing.sm
  },
  compareRow: {
    marginBottom: 4
  },
  compareLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted
  },
  enteredValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  registryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primaryDark
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: spacing.sm
  }
});
