import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Crown, Check } from 'lucide-react';
import { colors, spacing, radii, typography } from '../theme';
import { Card } from './Card';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';

const PLANS = [
  { id: '3m', label: '3 Months', price: 199 },
  { id: '6m', label: '6 Months', price: 399, badge: 'Popular' },
  { id: '12m', label: '12 Months', price: 599, badge: 'Best Value' },
  { id: 'lifetime', label: 'Lifetime', price: 999, badge: 'One-time' }
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
  const { user, isPremiumActive, activateSubscription, cancelSubscription } = useAuth();
  const [selected, setSelected] = useState(user?.subscriptionPlanId || '6m');
  const [working, setWorking] = useState(false);
  const selectedPlan = PLANS.find((p) => p.id === selected) || PLANS[1];
  const activePlan = PLANS.find((p) => p.id === user?.subscriptionPlanId);
  const expiryLabel = formatExpiry(user?.subscriptionExpiresAt);

  const handleChoose = async () => {
    setWorking(true);
    try {
      await activateSubscription(selectedPlan.id);
      alert(`${selectedPlan.label} activated. Preview only — payments aren't live yet, so this didn't charge you anything.`);
    } catch (e) {
      alert(e.message || 'Could not activate plan. Please try again.');
    } finally {
      setWorking(false);
    }
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
        loading={working}
        size="lg"
        style={{ marginTop: spacing.md }}
      />
      <Text style={styles.disclaimer}>Preview only — payments aren't live yet.</Text>

      {isPremiumActive ? (
        <TouchableOpacity onPress={handleCancel} style={{ marginTop: spacing.md, alignSelf: 'center' }} disabled={working}>
          <Text style={styles.cancelLink}>Cancel Subscription</Text>
        </TouchableOpacity>
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
  pageSub: { ...typography.bodyMedium, marginBottom: spacing.lg },
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
  cancelLink: { fontSize: 12, fontWeight: '600', color: colors.danger }
});
