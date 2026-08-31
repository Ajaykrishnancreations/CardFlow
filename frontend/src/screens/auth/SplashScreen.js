import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CreditCard, Search, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';

export function SplashScreen({ onGetStarted, onQuickLogin }) {
  return (
    <View style={styles.container}>
      {/* Decorative Brand Header */}
      <View style={styles.heroSection}>
        <View style={styles.logoBadge}>
          <CreditCard size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.brandTitle}>CardFlow</Text>
        <Text style={styles.brandTagline}>
          Business Discovery & Digital Card Vault
        </Text>
      </View>

      {/* Feature Value Props */}
      <View style={styles.featuresList}>
        <View style={styles.featureItem}>
          <View style={[styles.featureIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <Search size={20} color={colors.primary} />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Verified Local Discovery</Text>
            <Text style={styles.featureDesc}>
              Find GST & ID verified businesses across city and pincode community hubs.
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIconCircle, { backgroundColor: '#ECFDF5' }]}>
            <Sparkles size={20} color={colors.verifiedGst} />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Instant Card Digitization</Text>
            <Text style={styles.featureDesc}>
              Scan paper cards with AI extraction or preserve original photos forever.
            </Text>
          </View>
        </View>

        <View style={styles.featureItem}>
          <View style={[styles.featureIconCircle, { backgroundColor: '#EEF2FF' }]}>
            <ShieldCheck size={20} color={colors.secondary} />
          </View>
          <View style={styles.featureTextContainer}>
            <Text style={styles.featureTitle}>Multi-Business Digital Cards</Text>
            <Text style={styles.featureDesc}>
              Create sharable digital QR profiles and receive direct enquiries.
            </Text>
          </View>
        </View>
      </View>

      {/* Action CTA */}
      <View style={styles.footerSection}>
        <Button
          title="Get Started with Phone"
          onPress={onGetStarted}
          size="lg"
          icon={ArrowRight}
          style={styles.ctaButton}
        />
        <Text style={styles.privacyNote}>
          By continuing, you agree to CardFlow Terms of Service and DPDP Privacy Policy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: spacing.xxl,
    justifyContent: 'space-between'
  },
  heroSection: {
    alignItems: 'center',
    marginTop: spacing.xl
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5
  },
  brandTagline: {
    ...typography.bodyMedium,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center'
  },
  featuresList: {
    marginVertical: spacing.xl
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg
  },
  featureIconCircle: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  featureTextContainer: {
    flex: 1
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2
  },
  featureDesc: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary
  },
  footerSection: {
    marginBottom: spacing.md
  },
  ctaButton: {
    width: '100%',
    marginBottom: spacing.md
  },
  privacyNote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 16
  }
});
