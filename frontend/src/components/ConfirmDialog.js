import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { colors, spacing, radii, typography } from '../theme';

// A small "are you sure?" popup for actions that write to the phone's real
// contacts — cancel or proceed, nothing happens until the user picks one.
export function ConfirmDialog({ visible, title, message, confirmLabel = 'Proceed', cancelLabel = 'Cancel', onConfirm, onCancel }) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
              <Text style={styles.cancelText}>{cancelLabel}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={onConfirm}>
              <Text style={styles.confirmText}>{confirmLabel}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, maxWidth: 420, width: '100%', alignSelf: 'center' },
  title: { ...typography.titleSmall, color: colors.textPrimary, marginBottom: spacing.xs },
  message: { ...typography.bodyMedium, color: colors.textSecondary, marginBottom: spacing.lg },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: spacing.md, borderRadius: radii.md },
  cancelText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  confirmBtn: { paddingVertical: 10, paddingHorizontal: spacing.lg, borderRadius: radii.md, backgroundColor: colors.primary },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' }
});
