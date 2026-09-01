import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { CheckCircle2, Upload, Paperclip } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { DetailScreenHeader } from '../../components/DetailScreenHeader';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';

const CATEGORIES = [
  { id: 'general', label: 'General Inquiry' },
  { id: 'card_scan', label: 'Card Scanning & OCR' },
  { id: 'business_listing', label: 'Business Listing & GST' },
  { id: 'billing', label: 'Billing & Subscriptions' }
];

export function SupportRequestScreen({ onBack, onViewTickets }) {
  const { token } = useAuth();
  const fileRef = useRef(null);
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const onPickFile = (e) => {
    const file = e.target?.files?.[0];
    if (!file) return;
    setAttachmentName(file.name);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      setError('Please enter subject and description.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const res = await apiClient.createSupportTicket({
        category,
        subject: subject.trim(),
        message: message.trim(),
        attachment_name: attachmentName || undefined
      }, token);
      if (!res) throw new Error('Failed');
      setSubmitted(true);
    } catch (e) {
      setError('Could not submit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.root}>
        <DetailScreenHeader title="Support" onBack={onBack} />
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={36} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Request submitted</Text>
          <Text style={styles.successSub}>Our support team will review your request.</Text>
          <Button title="View My Tickets" onPress={onViewTickets} size="lg" style={{ marginTop: spacing.xl, width: '100%' }} />
          <Button title="Back to Support" variant="ghost" onPress={onBack} style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <DetailScreenHeader title="Submit Request" subtitle="Support" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Submit Support Request</Text>

        <Text style={styles.label}>Category</Text>
        <View style={styles.catWrap}>
          {CATEGORIES.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.catChip, category === c.id && styles.catChipActive]}
              onPress={() => setCategory(c.id)}
            >
              <Text style={[styles.catText, category === c.id && styles.catTextActive]}>{c.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Subject</Text>
        <TextInput
          value={subject}
          onChangeText={(t) => { setSubject(t); if (error) setError(''); }}
          placeholder="Enter subject"
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          value={message}
          onChangeText={(t) => { setMessage(t); if (error) setError(''); }}
          placeholder="Describe your issue"
          placeholderTextColor={colors.textMuted}
          multiline
          style={[styles.input, styles.area]}
        />

        <Text style={styles.label}>Attachment</Text>
        <input type="file" accept="image/*" ref={fileRef} style={{ display: 'none' }} onChange={onPickFile} />
        <TouchableOpacity style={styles.attachBtn} onPress={() => fileRef.current?.click()}>
          {attachmentName ? <Paperclip size={16} color={colors.primary} /> : <Upload size={16} color={colors.primary} />}
          <Text style={styles.attachText}>
            {attachmentName || 'Add screenshot / image'}
          </Text>
        </TouchableOpacity>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button
          title={submitting ? 'Submitting...' : 'Submit Request'}
          onPress={handleSubmit}
          loading={submitting}
          size="lg"
          style={{ marginTop: spacing.lg }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgMuted },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  pageTitle: { ...typography.titleSmall, marginBottom: spacing.md },
  label: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, marginBottom: 6, marginTop: spacing.sm },
  catWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: spacing.sm },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.chip,
    backgroundColor: colors.bgMutedDark
  },
  catChipActive: { backgroundColor: colors.primaryMuted },
  catText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  catTextActive: { color: colors.primary },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radii.input,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.textPrimary,
    outlineStyle: 'none'
  },
  area: { minHeight: 110, textAlignVertical: 'top' },
  attachBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    borderRadius: radii.input,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: '#FFFFFF'
  },
  attachText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  error: { color: colors.danger, fontSize: 13, marginTop: spacing.sm },
  successWrap: { flex: 1, padding: spacing.xxl, alignItems: 'center', justifyContent: 'center' },
  successIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.successLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg
  },
  successTitle: { ...typography.titleMedium, marginBottom: spacing.sm },
  successSub: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', maxWidth: 280 }
});
