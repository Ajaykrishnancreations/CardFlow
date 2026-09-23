import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { colors, spacing, radii } from '../theme';

// A brief, unmissable bottom-anchored confirmation — used after actions like
// backup/restore/import so the outcome is obvious instead of a small line of
// text easy to miss while scrolling.
export function Snackbar({ visible, message, type = 'success', onDismiss, duration = 3500 }) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => onDismiss?.(), duration);
    return () => clearTimeout(t);
  }, [visible, message, duration, onDismiss]);

  if (!visible || !message) return null;

  const Icon = type === 'error' ? AlertCircle : CheckCircle2;

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={[styles.bar, type === 'error' && styles.barError]}>
        <Icon size={18} color="#FFFFFF" style={{ marginRight: spacing.sm }} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: spacing.xl,
    alignItems: 'center',
    zIndex: 999
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textPrimary,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    maxWidth: 480,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6
  },
  barError: { backgroundColor: colors.danger },
  text: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', flexShrink: 1 }
});
