import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LifeBuoy, MessageSquare, ChevronRight, HelpCircle, Ticket } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { DetailScreenHeader } from '../../components/DetailScreenHeader';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';

export function SupportHubScreen({ onBack, onNewRequest, onMyTickets }) {
  const { token } = useAuth();
  const [ticketCount, setTicketCount] = useState(0);

  const loadCount = useCallback(async () => {
    const list = await apiClient.getMySupportTickets(token);
    if (Array.isArray(list)) setTicketCount(list.length);
  }, [token]);

  React.useEffect(() => {
    loadCount();
  }, [loadCount]);

  return (
    <View style={styles.root}>
      <DetailScreenHeader title="Support" subtitle="Help Center" onBack={onBack} />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <LifeBuoy size={26} color={colors.primary} />
          <Text style={styles.title}>Support Service</Text>
          <Text style={styles.subtitle}>
            Get help with scanning, business listings, billing, and more.
          </Text>
        </View>

        <TouchableOpacity style={styles.rowCard} onPress={onNewRequest} activeOpacity={0.8}>
          <View style={styles.rowIcon}>
            <MessageSquare size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Submit a Support Request</Text>
            <Text style={styles.rowSub}>Card scanning, GST verification, business listing help</Text>
          </View>
          <ChevronRight size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.rowCard} onPress={onMyTickets} activeOpacity={0.8}>
          <View style={styles.rowIcon}>
            <Ticket size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>My Tickets</Text>
            <Text style={styles.rowSub}>
              {ticketCount > 0 ? `${ticketCount} request${ticketCount === 1 ? '' : 's'}` : 'View past support requests'}
            </Text>
          </View>
          <ChevronRight size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <View style={styles.faqBlock}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
            <HelpCircle size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
            <Text style={styles.faqTitle}>Quick Help</Text>
          </View>
          <Text style={styles.faqItem}>• Scan both sides of a card for the best contact details</Text>
          <Text style={styles.faqItem}>• Scan cards in landscape for better OCR results</Text>
          <Text style={styles.faqItem}>• Add your business anytime from My Business</Text>
          <Text style={styles.faqItem}>• Export contacts from My Cards → Backup & Export</Text>
        </View>

        <Button title="Submit a Request" onPress={onNewRequest} size="md" style={{ marginTop: spacing.md }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgMuted },
  container: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  intro: { marginBottom: spacing.lg },
  title: { ...typography.titleSmall, color: colors.textPrimary, marginTop: spacing.sm },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 19 },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  rowSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2, lineHeight: 16 },
  faqBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border
  },
  faqTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  faqItem: { fontSize: 12, color: colors.textSecondary, lineHeight: 20, marginBottom: 2 }
});
