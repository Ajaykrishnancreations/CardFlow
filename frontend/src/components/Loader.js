import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Sparkles, Loader2 } from 'lucide-react';
import { colors, radii, spacing, shadows } from '../theme';

/**
 * High-quality CardFlow Brand Spinner
 */
export function BrandSpinner({ size = 36, text = 'Loading...' }) {
  const spinAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true
      })
    ).start();
  }, [spinAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.spinnerContainer}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Loader2 size={size} color={colors.primary} />
      </Animated.View>
      {text ? <Text style={styles.spinnerText}>{text}</Text> : null}
    </View>
  );
}

/**
 * Animated Shimmer / Skeleton Card for Business & Visiting Cards
 */
export function SkeletonCard({ count = 2 }) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true
        })
      ])
    ).start();
  }, [pulseAnim]);

  const items = Array.from({ length: count }, (_, i) => i);

  return (
    <View style={styles.skeletonList}>
      {items.map((key) => (
        <Animated.View key={key} style={[styles.skeletonCard, { opacity: pulseAnim }]}>
          {/* Header Row */}
          <View style={styles.skeletonHeader}>
            <View style={styles.skeletonAvatar} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={styles.skeletonLineTitle} />
              <View style={styles.skeletonLineSub} />
            </View>
          </View>

          {/* Details lines */}
          <View style={styles.skeletonDetails}>
            <View style={styles.skeletonLineDetail} />
            <View style={[styles.skeletonLineDetail, { width: '60%' }]} />
            <View style={[styles.skeletonLineDetail, { width: '80%' }]} />
          </View>

          {/* Chips */}
          <View style={styles.skeletonChipsRow}>
            <View style={styles.skeletonChip} />
            <View style={styles.skeletonChip} />
            <View style={styles.skeletonChip} />
          </View>

          {/* Buttons */}
          <View style={styles.skeletonButtonsRow}>
            <View style={styles.skeletonBtn} />
            <View style={styles.skeletonBtn} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

/**
 * Full Page Screen Loader
 */
export function ScreenLoader({ message = 'Loading CardFlow...', subMessage = 'Please wait a moment' }) {
  return (
    <View style={styles.fullScreenLoader}>
      <View style={styles.loaderBox}>
        <BrandSpinner size={42} text="" />
        <Text style={styles.fullScreenTitle}>{message}</Text>
        {subMessage ? <Text style={styles.fullScreenSub}>{subMessage}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  spinnerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md
  },
  spinnerText: {
    marginTop: spacing.sm,
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary
  },
  skeletonList: {
    gap: spacing.md,
    width: '100%',
    paddingVertical: spacing.sm
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm
  },
  skeletonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E2E8F0',
    marginRight: spacing.sm
  },
  skeletonLineTitle: {
    width: '70%',
    height: 16,
    borderRadius: 4,
    backgroundColor: '#E2E8F0'
  },
  skeletonLineSub: {
    width: '45%',
    height: 12,
    borderRadius: 4,
    backgroundColor: '#F1F5F9'
  },
  skeletonDetails: {
    gap: 6,
    marginVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: spacing.xs
  },
  skeletonLineDetail: {
    width: '90%',
    height: 11,
    borderRadius: 3,
    backgroundColor: '#F1F5F9'
  },
  skeletonChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: spacing.xs
  },
  skeletonChip: {
    width: 60,
    height: 18,
    borderRadius: 4,
    backgroundColor: '#E2E8F0'
  },
  skeletonButtonsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: spacing.xs
  },
  skeletonBtn: {
    flex: 1,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: '#F1F5F9'
  },
  fullScreenLoader: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: spacing.xl
  },
  loaderBox: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.md,
    minWidth: 260
  },
  fullScreenTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md
  },
  fullScreenSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4
  }
});
