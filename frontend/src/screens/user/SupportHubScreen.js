import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { LifeBuoy, MessageSquare, ChevronRight, HelpCircle } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { SupportModal } from '../../components/SupportModal';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';

export function SupportHubScreen() {
  const { token } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [tickets, setTickets] = useState([]);

  React.useEffect(() => {
    const load = async () => {
      const list = await apiClient.getMySupportTickets(token);
      if (list && Array.isArray(list)) setTickets(list);
    };
    load();
  }, [token]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <LifeBuoy size={28} color={colors.primary} />
        <Text style={styles.title}>Support Service</Text>
        <Text style={styles.subtitle}>Get help with scanning, business listings, billing, and more.</Text>
      </View>

      <Card style={styles.ctaCard} onPress={() => setShowModal(true)}>
        <View style={styles.ctaRow}>
          <View style={styles.ctaIcon}><MessageSquare size={22} color={colors.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.ctaTitle}>Submit a Support Request</Text>
            <Text style={styles.ctaSub}>Card scanning, GST verification, business listing help</Text>
          </View>
          <ChevronRight size={18} color={colors.primary} />
        </View>
      </Card>

      {tickets.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>MY TICKETS ({tickets.length})</Text>
          {tickets.map((t) => (
            <Card key={t.id} style={styles.ticketCard}>
              <Text style={styles.ticketSubject}>{t.subject}</Text>
              <Text style={styles.ticketMeta}>#{t.id} • {t.status?.toUpperCase()}</Text>
              {t.admin_reply && <Text style={styles.ticketReply}>Admin: {t.admin_reply}</Text>}
            </Card>
          ))}
        </View>
      )}

      <Card style={styles.faqCard}>
        <HelpCircle size={18} color={colors.textSecondary} style={{ marginBottom: 8 }} />
        <Text style={styles.faqTitle}>Quick Help</Text>
        <Text style={styles.faqItem}>• Test users: OTP is always 123456</Text>
        <Text style={styles.faqItem}>• Scan cards in landscape for best OCR results</Text>
        <Text style={styles.faqItem}>• Add your business anytime from My Business tab</Text>
        <Text style={styles.faqItem}>• Export contacts from My Cards → Backup & Export</Text>
      </Card>

      <SupportModal visible={showModal} onClose={() => setShowModal(false)} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: { alignItems: 'center', marginBottom: spacing.xl, paddingTop: spacing.md },
  title: { ...typography.titleMedium, color: colors.textPrimary, marginTop: spacing.sm },
  subtitle: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 20 },
  ctaCard: { padding: spacing.lg, marginBottom: spacing.lg },
  ctaRow: { flexDirection: 'row', alignItems: 'center' },
  ctaIcon: {
    width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md
  },
  ctaTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  ctaSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  section: { marginBottom: spacing.lg },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: colors.textSecondary, marginBottom: spacing.sm },
  ticketCard: { padding: spacing.md, marginBottom: spacing.xs },
  ticketSubject: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  ticketMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  ticketReply: { fontSize: 12, color: '#059669', marginTop: 6, lineHeight: 17 },
  faqCard: { padding: spacing.lg, backgroundColor: '#FFFFFF' },
  faqTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  faqItem: { fontSize: 12, color: colors.textSecondary, lineHeight: 20, marginBottom: 4 }
});
