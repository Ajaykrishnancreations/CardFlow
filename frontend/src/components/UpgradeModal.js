import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { Lock, X } from 'lucide-react';
import { colors, radii, spacing, typography } from '../theme';
import { Button } from './Button';
import { useAuth } from '../context/AuthContext';

// Shared paywall prompt for every free-tier limit (theme colors, business
// count, premium card templates, saved-card count) — "View Plans" opens the
// global Subscription overlay so any screen can trigger it without its own
// navigation route.
export function UpgradeModal({ visible, onClose, title, message }) {
  const { openSubscription } = useAuth();
  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <TouchableOpacity onPress={onClose} style={styles.closeHit} accessibilityLabel="Close">
            <X size={18} color={colors.textSecondary} />
          </TouchableOpacity>
          <View style={styles.iconWrap}>
            <Lock size={22} color={colors.gold} />
          </View>
          <Text style={styles.title}>{title || 'Upgrade to Premium'}</Text>
          <Text style={styles.message}>{message}</Text>
          <Button
            title="View Premium Plans"
            onPress={() => {
              onClose?.();
              openSubscription();
            }}
            size="lg"
            style={{ marginTop: spacing.md, alignSelf: 'stretch' }}
          />
          <TouchableOpacity onPress={onClose} style={styles.laterHit}>
            <Text style={styles.later}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'center', padding: spacing.md },
  sheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radii.modal,
    padding: spacing.xl,
    maxWidth: 380,
    width: '100%',
    alignSelf: 'center',
    alignItems: 'center'
  },
  closeHit: { position: 'absolute', top: spacing.md, right: spacing.md, padding: 4 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  title: { ...typography.titleSmall, color: colors.textPrimary, textAlign: 'center' },
  message: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs, lineHeight: 19 },
  laterHit: { marginTop: spacing.sm, padding: 4 },
  later: { fontSize: 13, fontWeight: '600', color: colors.textMuted }
});
