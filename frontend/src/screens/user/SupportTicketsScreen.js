import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { HelpCircle, ChevronRight } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { DetailScreenHeader } from '../../components/DetailScreenHeader';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';

function statusLabel(status) {
  if (status === 'resolved') return 'Resolved';
  if (status === 'in_progress') return 'In progress';
  return 'Open';
}

function statusStyle(status) {
  if (status === 'resolved') return { bg: colors.successLight, color: colors.success };
  if (status === 'in_progress') return { bg: colors.warningLight, color: colors.warning };
  return { bg: colors.primaryLight, color: colors.primary };
}

function relativeTime(iso) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diff = Date.now() - t;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  return `${days} days ago`;
}

export function SupportTicketsScreen({ onBack, onNewRequest, onSelectTicket }) {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await apiClient.getMySupportTickets(token);
      setTickets(Array.isArray(list) ? list : []);
    } finally {
      setLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.root}>
      <DetailScreenHeader title="My Tickets" subtitle="Support" onBack={onBack} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : tickets.length === 0 ? (
          <View style={styles.empty}>
            <HelpCircle size={36} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Support Tickets</Text>
            <Text style={styles.emptySub}>You haven't submitted any requests yet.</Text>
            <Button title="Create Support Request" onPress={onNewRequest} style={{ marginTop: spacing.lg }} />
          </View>
        ) : (
          tickets.map((t) => {
            const st = statusStyle(t.status);
            return (
              <TouchableOpacity
                key={t.id}
                style={styles.row}
                onPress={() => onSelectTicket?.(t)}
                activeOpacity={0.8}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.id}>#{String(t.id).slice(0, 8)}</Text>
                  <Text style={styles.subject} numberOfLines={1}>{t.subject}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                    <View style={[styles.badge, { backgroundColor: st.bg }]}>
                      <Text style={[styles.badgeText, { color: st.color }]}>{statusLabel(t.status)}</Text>
                    </View>
                    <Text style={styles.time}>{relativeTime(t.created_at)}</Text>
                  </View>
                </View>
                <ChevronRight size={16} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgMuted },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl, flexGrow: 1 },
  center: { paddingVertical: spacing.xxxl, alignItems: 'center' },
  empty: { alignItems: 'center', paddingTop: spacing.xxl },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginTop: spacing.md },
  emptySub: { fontSize: 13, color: colors.textSecondary, marginTop: 4, textAlign: 'center' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border
  },
  id: { fontSize: 11, fontWeight: '700', color: colors.textMuted },
  subject: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.badge },
  badgeText: { fontSize: 11, fontWeight: '700' },
  time: { fontSize: 11, color: colors.textMuted }
});
