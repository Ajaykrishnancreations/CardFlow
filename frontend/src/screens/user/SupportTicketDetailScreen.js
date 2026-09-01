import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { CheckCircle2, Clock } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { DetailScreenHeader } from '../../components/DetailScreenHeader';

export function SupportTicketDetailScreen({ ticket, onBack }) {
  if (!ticket) return null;

  const status = ticket.status || 'open';
  const statusLabel =
    status === 'resolved' ? 'Resolved' : status === 'in_progress' ? 'In progress' : 'Open';

  return (
    <View style={styles.root}>
      <DetailScreenHeader title="Ticket Detail" subtitle="My Tickets" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.id}>#{String(ticket.id).slice(0, 8)}</Text>
        <Text style={styles.subject}>{ticket.subject}</Text>
        <Text style={styles.meta}>
          {statusLabel}
          {ticket.category ? ` · ${String(ticket.category).replace(/_/g, ' ')}` : ''}
          {ticket.created_at ? ` · ${new Date(ticket.created_at).toLocaleString()}` : ''}
        </Text>

        <Text style={styles.label}>Description</Text>
        <Text style={styles.body}>{ticket.message || ticket.description || '—'}</Text>

        {ticket.admin_reply ? (
          <View style={styles.replyBox}>
            <View style={styles.replyHead}>
              <CheckCircle2 size={14} color={colors.success} style={{ marginRight: 4 }} />
              <Text style={styles.replyLabel}>Support reply</Text>
            </View>
            <Text style={styles.replyText}>{ticket.admin_reply}</Text>
          </View>
        ) : (
          <View style={styles.pendingBox}>
            <Clock size={14} color={colors.warning} style={{ marginRight: 6 }} />
            <Text style={styles.pendingText}>Our team is reviewing your request.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgMuted },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  id: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  subject: { ...typography.titleSmall, marginTop: 4 },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 6, marginBottom: spacing.lg },
  label: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.5, marginBottom: 6 },
  body: { fontSize: 14, color: colors.textPrimary, lineHeight: 22 },
  replyBox: {
    marginTop: spacing.lg,
    backgroundColor: colors.successLight,
    borderRadius: radii.md,
    padding: spacing.md
  },
  replyHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  replyLabel: { fontSize: 12, fontWeight: '700', color: colors.success },
  replyText: { fontSize: 13, color: colors.textPrimary, lineHeight: 19 },
  pendingBox: {
    marginTop: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningLight,
    borderRadius: radii.md,
    padding: spacing.md
  },
  pendingText: { fontSize: 13, color: '#92400E', fontWeight: '500', flex: 1 }
});
