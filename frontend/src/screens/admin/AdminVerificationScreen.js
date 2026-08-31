import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ShieldCheck, Check, X, AlertTriangle, Building2, UserCheck, CheckCircle2 } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const initialQueue = [
  {
    id: 'kyc-1',
    business_name: 'Kovai Precision Tools',
    entered_name: 'Kovai Precision Tools',
    registry_name: 'KOVAI PRECISION TOOLS PRIVATE LIMITED',
    gstin: '33AAAAA0000A1Z5',
    name_match_score: 92.5,
    pincode: '641004',
    city: 'Coimbatore',
    submitted_at: 'Today, 2:15 PM',
    status: 'pending'
  },
  {
    id: 'kyc-2',
    business_name: 'Sri Lakshmi Fabrics',
    entered_name: 'Sri Lakshmi Fabrics',
    registry_name: 'SRI LAKSHMI TEX MILLS LLP',
    gstin: '33CCCCC2222C3Z7',
    name_match_score: 78.0,
    pincode: '641015',
    city: 'Coimbatore',
    submitted_at: 'Today, 11:30 AM',
    status: 'pending'
  }
];

export function AdminVerificationScreen() {
  const { token } = useAuth();
  const [queue, setQueue] = useState(initialQueue);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [toast, setToast] = useState('');

  const fetchQueue = async () => {
    setIsLoading(true);
    try {
      const list = await apiClient.getAdminVerifications(token);
      if (list && Array.isArray(list) && list.length > 0) {
        setQueue(list);
      }
    } catch (e) {
      console.warn('Error fetching KYC queue:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const handleResolve = async (id, action) => {
    setProcessingId(id);
    try {
      await apiClient.decideVerification(id, action, 'Processed by admin', token);
      setQueue((prev) => prev.filter((item) => item.id !== id));
      setToast(`KYC request ${action === 'approve' ? 'APPROVED & LISTED' : 'REJECTED'} successfully.`);
    } catch (e) {
      alert('Failed to submit decision.');
    } finally {
      setProcessingId(null);
      setTimeout(() => setToast(''), 3500);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>KYC Verification Queue</Text>
        <Text style={styles.subtitle}>
          Compare registered GSTIN legal names against entered brand names to approve discovery listing.
        </Text>
      </View>

      {toast ? (
        <View style={styles.toastBox}>
          <CheckCircle2 size={16} color="#065F46" style={{ marginRight: 6 }} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 8, color: colors.textSecondary }}>Checking verification queue...</Text>
        </View>
      ) : queue.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="KYC Queue is Clear"
          description="All submitted business verification requests have been reviewed and approved."
        />
      ) : (
        queue.map((item) => {
          const isCurrentProcessing = processingId === item.id;
          return (
            <Card key={item.id} style={styles.kycCard}>
              <View style={styles.kycHeader}>
                <View style={styles.logoWrap}>
                  <Building2 size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bizName}>{item.business_name || item.businessName}</Text>
                  <Text style={styles.metaText}>GSTIN: {item.gstin} • {item.city} ({item.pincode})</Text>
                </View>
                <View style={styles.scoreBadge}>
                  <Text style={styles.scoreText}>{item.name_match_score || item.matchScore}% Match</Text>
                </View>
              </View>

              {/* Side-by-side comparison */}
              <View style={styles.comparisonBox}>
                <View style={styles.compareRow}>
                  <Text style={styles.compareLabel}>Entered Name:</Text>
                  <Text style={styles.enteredValue}>{item.entered_name || item.enteredName}</Text>
                </View>
                <View style={styles.compareRow}>
                  <Text style={styles.compareLabel}>Govt Registry Name:</Text>
                  <Text style={styles.registryValue}>{item.registry_name || item.registryName}</Text>
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
                  disabled={isCurrentProcessing}
                />
                <Button
                  title="Approve & List"
                  variant="primary"
                  size="sm"
                  icon={Check}
                  style={{ flex: 1.5 }}
                  onPress={() => handleResolve(item.id, 'approve')}
                  disabled={isCurrentProcessing}
                />
              </View>
            </Card>
          );
        })
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
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md
  },
  toastText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600'
  },
  centerLoading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center'
  },
  kycCard: {
    padding: spacing.md,
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
    marginRight: spacing.sm
  },
  bizName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  metaText: {
    fontSize: 11,
    color: colors.textMuted
  },
  scoreBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full
  },
  scoreText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.verifiedGst
  },
  comparisonBox: {
    backgroundColor: colors.bgMuted,
    padding: spacing.sm,
    borderRadius: radii.md,
    marginBottom: spacing.md
  },
  compareRow: {
    marginBottom: 4
  },
  compareLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  enteredValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  registryValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center'
  }
});
