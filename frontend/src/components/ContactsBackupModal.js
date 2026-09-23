import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { CloudUpload, CloudDownload, X } from 'lucide-react';
import { colors, spacing, radii, typography } from '../theme';
import { Card } from './Card';
import { useAuth } from '../context/AuthContext';
import { backupPhoneContacts, restoreContactsToPhone, getBackupStatus } from '../utils/contactsSync';

export function ContactsBackupModal({ visible, onClose }) {
  const { token } = useAuth();
  const [status, setStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!visible) return;
    setMessage(null);
    setCheckingStatus(true);
    getBackupStatus(token)
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setCheckingStatus(false));
  }, [visible, token]);

  const handleBackup = async () => {
    setWorking(true);
    setMessage(null);
    try {
      const result = await backupPhoneContacts(token);
      setMessage({ type: 'success', text: `Backed up ${result.uploaded} contact${result.uploaded === 1 ? '' : 's'} to CardFlow Cloud.` });
      setStatus({ has_backup: true, count: result.uploaded });
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || 'Could not back up your contacts.' });
    } finally {
      setWorking(false);
    }
  };

  const handleRestore = async () => {
    setWorking(true);
    setMessage(null);
    try {
      const result = await restoreContactsToPhone(token);
      setMessage({ type: 'success', text: `Added ${result.restored} of ${result.total} contacts to your phone.` });
    } catch (e) {
      setMessage({ type: 'error', text: e?.message || 'Could not import your contacts.' });
    } finally {
      setWorking(false);
    }
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Card style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Backup &amp; Restore Contacts</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Save your phone's contacts to CardFlow Cloud so you never lose them, or bring back a backup onto this phone.
          </Text>

          <TouchableOpacity style={[styles.option, working && styles.optionDisabled]} onPress={handleBackup} disabled={working}>
            <CloudUpload size={22} color={colors.primary} />
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Back Up Phone Contacts</Text>
              <Text style={styles.optionDesc}>Upload all contacts from this phone to your CardFlow Cloud account.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.option, (working || checkingStatus || !status?.has_backup) && styles.optionDisabled]}
            onPress={handleRestore}
            disabled={working || checkingStatus || !status?.has_backup}
          >
            <CloudDownload size={22} color={status?.has_backup ? colors.primary : colors.textMuted} />
            <View style={styles.optionText}>
              <Text style={styles.optionTitle}>Import Contacts to This Phone</Text>
              <Text style={styles.optionDesc}>
                {checkingStatus
                  ? 'Checking for a saved backup…'
                  : status?.has_backup
                  ? `Restore your ${status.count} backed-up contact${status.count === 1 ? '' : 's'} onto this phone.`
                  : 'Back up your contacts first to enable this.'}
              </Text>
            </View>
          </TouchableOpacity>

          {working && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.loadingText}>Working on it…</Text>
            </View>
          )}

          {message && (
            <Text style={[styles.message, message.type === 'error' ? styles.messageError : styles.messageSuccess]}>
              {message.text}
            </Text>
          )}
        </Card>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'center', padding: spacing.md },
  card: { padding: spacing.lg, maxWidth: 420, width: '100%', alignSelf: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  title: { ...typography.titleSmall, color: colors.textPrimary },
  subtitle: { ...typography.bodyMedium, color: colors.textMuted, marginBottom: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  optionDisabled: { opacity: 0.5 },
  optionText: { flex: 1 },
  optionTitle: { ...typography.bodyMedium, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  optionDesc: { ...typography.bodySmall, color: colors.textMuted },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.xs },
  loadingText: { ...typography.bodySmall, color: colors.textMuted },
  message: { ...typography.bodySmall, marginTop: spacing.sm },
  messageSuccess: { color: colors.success },
  messageError: { color: colors.danger },
});
