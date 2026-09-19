import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Crown, Check, Receipt, ChevronRight } from 'lucide-react';
import { colors, spacing, radii, typography } from '../theme';
import { Card } from './Card';
import { Button } from './Button';
import { TransactionHistoryScreen } from './TransactionHistoryScreen';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';

const PLANS = [
  { id: '3m', label: '3 Months', price: 9 },
  { id: '6m', label: '6 Months', price: 19, badge: 'Popular' },
  { id: '12m', label: '12 Months', price: 29, badge: 'Best Value' },
  { id: 'lifetime', label: 'Lifetime', price: 39, badge: 'One-time' }
];

const PERKS = [
  'Unlimited business card scans',
  'Priority verification badge',
  'Advanced business analytics',
  'Remove CardFlow watermark'
];

function formatExpiry(iso) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch (e) {
    return null;
  }
}

export function SubscriptionScreen({ onBack }) {
  const { user, token, isPremiumActive, activateSubscription, cancelSubscription } = useAuth();
  const [selected, setSelected] = useState(user?.subscriptionPlanId || '6m');
  const [working, setWorking] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const selectedPlan = PLANS.find((p) => p.id === selected) || PLANS[1];
  const activePlan = PLANS.find((p) => p.id === user?.subscriptionPlanId);
  const expiryLabel = formatExpiry(user?.subscriptionExpiresAt);

  if (showHistory) {
    return <TransactionHistoryScreen onBack={() => setShowHistory(false)} />;
  }

  const proceedToPayment = async (planId, planLabel) => {
    setWorking(true);
    try {
      await activateSubscription(planId);
      alert(`Payment successful — ${planLabel} Premium is now active!`);
    } catch (e) {
      if (e.message !== 'Payment cancelled.') {
        alert(e.message || 'Could not complete payment. Please try again.');
      }
    } finally {
      setWorking(false);
    }
  };

  const handleChoose = async () => {
    const isSwitch = isPremiumActive && selected !== user?.subscriptionPlanId;
    if (!isSwitch) {
      await proceedToPayment(selectedPlan.id, selectedPlan.label);
      return;
    }
    setQuoteLoading(true);
    try {
      const q = await apiClient.getUpgradeQuote(selected, token);
      setQuote(q);
    } catch (e) {
      alert(e.message || 'Could not calculate upgrade price.');
    } finally {
      setQuoteLoading(false);
    }
  };

  const handleConfirmSwitch = async () => {
    const planId = quote.new_plan_id;
    const planLabel = quote.new_plan_name;
    setQuote(null);
    await proceedToPayment(planId, planLabel);
  };

  const handleCancel = async () => {
    setWorking(true);
    try {
      await cancelSubscription();
      alert('Subscription cancelled — you are back on the Free plan.');
    } catch (e) {
      alert(e.message || 'Could not cancel subscription.');
    } finally {
      setWorking(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backRow} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      ) : null}

      <View style={styles.heroIcon}>
        <Crown size={26} color={colors.gold} />
      </View>
      <Text style={styles.pageTitle}>CardFlow Premium</Text>
      <Text style={styles.pageSub}>Unlock premium features and grow your business faster.</Text>

      <TouchableOpacity style={styles.historyRow} activeOpacity={0.75} onPress={() => setShowHistory(true)}>
        <Receipt size={16} color={colors.primary} style={{ marginRight: spacing.sm }} />
        <Text style={styles.historyText}>Transaction History</Text>
        <ChevronRight size={16} color={colors.textMuted} />
      </TouchableOpacity>

      {isPremiumActive ? (
        <Card style={styles.statusCard}>
          <Text style={styles.statusTitle}>
            You're on {activePlan?.label || 'Premium'}
          </Text>
          <Text style={styles.statusSub}>
            {expiryLabel ? `Active until ${expiryLabel}` : 'Lifetime — never expires'}
          </Text>
        </Card>
      ) : null}

      <Card style={styles.perksCard}>
        {PERKS.map((perk) => (
          <View key={perk} style={styles.perkRow}>
            <Check size={16} color={colors.success} />
            <Text style={styles.perkText}>{perk}</Text>
          </View>
        ))}
      </Card>

      <Text style={styles.sectionTitle}>Choose a Plan</Text>
      {PLANS.map((plan) => {
        const isSelected = selected === plan.id;
        return (
          <TouchableOpacity key={plan.id} activeOpacity={0.85} onPress={() => setSelected(plan.id)}>
            <Card style={[styles.planCard, isSelected && styles.planCardActive]}>
              <View style={[styles.radio, isSelected && styles.radioActive]}>
                {isSelected ? <View style={styles.radioDot} /> : null}
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.planHeaderRow}>
                  <Text style={styles.planLabel}>{plan.label}</Text>
                  {plan.badge ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{plan.badge}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
              <Text style={styles.planPrice}>₹{plan.price}</Text>
            </Card>
          </TouchableOpacity>
        );
      })}

      <Button
        title={`Choose ${selectedPlan.label} — ₹${selectedPlan.price}`}
        onPress={handleChoose}
        loading={working || quoteLoading}
        size="lg"
        style={{ marginTop: spacing.md }}
      />
      <Text style={styles.disclaimer}>Secure checkout powered by Razorpay.</Text>

      {isPremiumActive ? (
        <TouchableOpacity onPress={handleCancel} style={{ marginTop: spacing.md, alignSelf: 'center' }} disabled={working}>
          <Text style={styles.cancelLink}>Cancel Subscription</Text>
        </TouchableOpacity>
      ) : null}

      {quote ? (
        <Modal transparent animationType="fade" visible={!!quote} onRequestClose={() => setQuote(null)}>
          <View style={styles.modalOverlay}>
            <Card style={styles.quoteCard}>
              <Text style={styles.quoteTitle}>Switch to {quote.new_plan_name}?</Text>

              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>You already have</Text>
                <Text style={styles.quoteValue}>{quote.current_plan_name}</Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Days remaining</Text>
                <Text style={styles.quoteValue}>{quote.remaining_days} days</Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>Credit for unused time</Text>
                <Text style={styles.quoteValue}>− ₹{quote.credit_inr}</Text>
              </View>

              <View style={styles.quoteDivider} />

              <View style={styles.quoteRow}>
                <Text style={styles.quoteLabel}>{quote.new_plan_name} price</Text>
                <Text style={styles.quoteValue}>₹{quote.full_price_inr}</Text>
              </View>
              <View style={styles.quoteRow}>
                <Text style={styles.quoteTotalLabel}>You pay now</Text>
                <Text style={styles.quoteTotalValue}>₹{quote.payable_inr}</Text>
              </View>

              <Button
                title={`Pay ₹${quote.payable_inr} & Switch`}
                onPress={handleConfirmSwitch}
                loading={working}
                size="lg"
                style={{ marginTop: spacing.md }}
              />
              <TouchableOpacity onPress={() => setQuote(null)} style={styles.quoteCancelHit} disabled={working}>
                <Text style={styles.quoteCancelText}>Not now</Text>
              </TouchableOpacity>
            </Card>
          </View>
        </Modal>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMuted },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  backRow: { marginBottom: spacing.sm, alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  pageSub: { ...typography.bodyMedium, marginBottom: spacing.md },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginBottom: spacing.md
  },
  historyText: { flex: 1, fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  statusCard: {
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.goldLight,
    borderWidth: 1,
    borderColor: colors.gold
  },
  statusTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  statusSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  perksCard: { padding: spacing.lg, marginBottom: spacing.lg },
  perkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm },
  perkText: { fontSize: 13, color: colors.textPrimary, flex: 1 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
    marginLeft: 4,
    textTransform: 'uppercase'
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.sm,
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: 'transparent'
  },
  planCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  planHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  planLabel: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  badge: {
    backgroundColor: colors.goldLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: colors.gold },
  planPrice: { fontSize: 17, fontWeight: '800', color: colors.textPrimary },
  disclaimer: { fontSize: 11, color: colors.textMuted, textAlign: 'center', marginTop: spacing.sm },
  cancelLink: { fontSize: 12, fontWeight: '600', color: colors.danger },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'center', padding: spacing.md },
  quoteCard: { padding: spacing.lg, maxWidth: 420, width: '100%', alignSelf: 'center' },
  quoteTitle: { ...typography.titleSmall, color: colors.textPrimary, marginBottom: spacing.md },
  quoteRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  quoteLabel: { fontSize: 13, color: colors.textSecondary },
  quoteValue: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  quoteDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  quoteTotalLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  quoteTotalValue: { fontSize: 18, fontWeight: '800', color: colors.primary },
  quoteCancelHit: { marginTop: spacing.sm, alignSelf: 'center', padding: 4 },
  quoteCancelText: { fontSize: 13, fontWeight: '600', color: colors.textMuted }
});
