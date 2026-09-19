import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Receipt } from 'lucide-react';
import { colors, spacing, radii, typography } from '../theme';
import { Card } from './Card';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return '';
  }
}

const STATUS_STYLES = {
  paid: { bg: '#ECFDF5', color: '#059669', label: 'Paid' },
  created: { bg: '#FEF3C7', color: '#B45309', label: 'Pending' },
  failed: { bg: '#FEE2E2', color: '#DC2626', label: 'Failed' }
};

export function TransactionHistoryScreen({ onBack }) {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    apiClient
      .getBillingTransactions(token)
      .then((data) => {
        if (alive) setTransactions(data?.transactions || []);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [token]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backRow} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      ) : null}
      <Text style={styles.pageTitle}>Transaction History</Text>
      <Text style={styles.pageSub}>Every CardFlow Premium payment attempt on your account.</Text>

      {loading ? (
        <Text style={styles.emptyText}>Loading...</Text>
      ) : transactions.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Receipt size={22} color={colors.textMuted} />
          <Text style={styles.emptyText}>No transactions yet.</Text>
        </Card>
      ) : (
        transactions.map((t, idx) => {
          const statusStyle = STATUS_STYLES[t.status] || STATUS_STYLES.created;
          return (
            <Card key={t.razorpay_order_id || idx} style={styles.txCard}>
              <View style={styles.txRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txPlan}>{t.plan_name || t.plan_id}</Text>
                  <Text style={styles.txDate}>{formatDate(t.paid_at || t.created_at)}</Text>
                </View>
                <Text style={styles.txAmount}>₹{t.amount_inr}</Text>
              </View>
              <View style={styles.txFooter}>
                <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                  <Text style={[styles.statusText, { color: statusStyle.color }]}>{statusStyle.label}</Text>
                </View>
                {t.razorpay_payment_id ? (
                  <Text style={styles.txId} numberOfLines={1}>{t.razorpay_payment_id}</Text>
                ) : (
                  <Text style={styles.txId} numberOfLines={1}>{t.razorpay_order_id}</Text>
                )}
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMuted },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  backRow: { marginBottom: spacing.sm, alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  pageSub: { ...typography.bodyMedium, marginBottom: spacing.lg },
  emptyCard: { padding: spacing.xl, alignItems: 'center', gap: spacing.sm },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center' },
  txCard: { padding: spacing.md, marginBottom: spacing.sm },
  txRow: { flexDirection: 'row', alignItems: 'center' },
  txPlan: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  txDate: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  txFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radii.pill },
  statusText: { fontSize: 10, fontWeight: '700' },
  txId: { fontSize: 10, color: colors.textMuted, flexShrink: 1, marginLeft: spacing.sm, textAlign: 'right' }
});
