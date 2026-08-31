import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { LifeBuoy, Search, Filter, MessageSquare, CheckCircle2, Clock, Send, ChevronDown, User, Phone } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { EmptyState } from '../../components/EmptyState';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export function AdminSupportScreen() {
  const { token } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'open' | 'in_progress' | 'resolved'
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [replyStatus, setReplyStatus] = useState('resolved');
  const [isUpdating, setIsUpdating] = useState(false);
  const [toast, setToast] = useState('');

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const list = await apiClient.getAdminSupportTickets(token);
      setTickets(list);
    } catch (e) {
      console.warn('Error fetching admin tickets:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleReplyAndResolve = async (ticketId) => {
    if (!replyText.trim() && replyStatus !== 'resolved') {
      alert('Please enter a reply message.');
      return;
    }

    setIsUpdating(true);
    try {
      const res = await apiClient.updateAdminSupportTicket(ticketId, {
        status: replyStatus,
        admin_reply: replyText.trim() || 'Resolved by Administrator.'
      }, token);

      setToast(`Ticket #${ticketId} updated to ${replyStatus.toUpperCase()}!`);
      setReplyText('');
      setSelectedTicket(null);
      await fetchTickets();
    } catch (e) {
      alert('Failed to update ticket. Please try again.');
    } finally {
      setIsUpdating(false);
      setTimeout(() => setToast(''), 3500);
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        (t.subject || '').toLowerCase().includes(q) ||
        (t.user_name || '').toLowerCase().includes(q) ||
        (t.user_phone || '').includes(q) ||
        (t.category || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Support & Issue Resolution</Text>
        <Text style={styles.subtitle}>Review user & business owner inquiries, provide resolutions, and update ticket status.</Text>
      </View>

      {/* Filter & Search Bar */}
      <View style={styles.searchBar}>
        <Search size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by ticket subject, user name, or phone..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>

      {/* Status Filter Chips */}
      <View style={styles.filterRow}>
        {['all', 'open', 'in_progress', 'resolved'].map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.filterChip, filterStatus === st && styles.filterChipActive]}
            onPress={() => setFilterStatus(st)}
          >
            <Text style={[styles.filterChipText, filterStatus === st && styles.filterChipTextActive]}>
              {st === 'all' ? 'All Tickets' : st === 'in_progress' ? 'In Progress' : st.toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {toast ? (
        <View style={styles.toastBox}>
          <CheckCircle2 size={16} color="#065F46" style={{ marginRight: 6 }} />
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      ) : null}

      {isLoading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 8, color: colors.textSecondary }}>Loading support tickets...</Text>
        </View>
      ) : filteredTickets.length === 0 ? (
        <EmptyState
          icon={LifeBuoy}
          title="No Tickets Found"
          description="There are no support tickets matching your active filters."
        />
      ) : (
        filteredTickets.map((t) => {
          const isSelected = selectedTicket?.id === t.id;
          return (
            <Card key={t.id} style={styles.ticketCard}>
              <View style={styles.ticketTopRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={styles.ticketSubject}>{t.subject}</Text>
                  </View>
                  <Text style={styles.ticketSubText}>
                    #{t.id} • {t.category.replace('_', ' ').toUpperCase()} • {new Date(t.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <View style={[
                  styles.statusBadge,
                  t.status === 'resolved' ? styles.statusResolved : t.status === 'in_progress' ? styles.statusProgress : styles.statusOpen
                ]}>
                  <Text style={[
                    styles.statusText,
                    t.status === 'resolved' ? styles.statusTextResolved : t.status === 'in_progress' ? styles.statusTextProgress : styles.statusTextOpen
                  ]}>
                    {t.status === 'resolved' ? 'RESOLVED' : t.status === 'in_progress' ? 'IN PROGRESS' : 'OPEN'}
                  </Text>
                </View>
              </View>

              {/* User Meta Row */}
              <View style={styles.userMetaRow}>
                <View style={styles.userPill}>
                  <User size={13} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.userPillText}>{t.user_name} ({t.user_role})</Text>
                </View>
                <View style={[styles.userPill, { backgroundColor: '#F1F5F9' }]}>
                  <Phone size={13} color={colors.textSecondary} style={{ marginRight: 4 }} />
                  <Text style={styles.userPillText}>{t.user_phone}</Text>
                </View>
              </View>

              <Text style={styles.ticketBody}>{t.message}</Text>

              {/* Existing Admin Reply */}
              {t.admin_reply ? (
                <View style={styles.adminReplyCard}>
                  <Text style={styles.adminReplyHeader}>Your Reply:</Text>
                  <Text style={styles.adminReplyBody}>{t.admin_reply}</Text>
                </View>
              ) : null}

              {/* Reply Accordion / Form */}
              {isSelected ? (
                <View style={styles.replyForm}>
                  <Text style={styles.replyLabel}>Compose Resolution / Reply:</Text>
                  <TextInput
                    value={replyText}
                    onChangeText={setReplyText}
                    placeholder="Enter instructions, solutions, or resolution notes for the user..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={3}
                    style={styles.replyInput}
                  />

                  <View style={styles.replyActionRow}>
                    <View style={styles.statusSelectRow}>
                      <TouchableOpacity
                        style={[styles.statusOption, replyStatus === 'in_progress' && styles.statusOptionActive]}
                        onPress={() => setReplyStatus('in_progress')}
                      >
                        <Text style={[styles.statusOptionText, replyStatus === 'in_progress' && styles.statusOptionTextActive]}>
                          In Progress
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.statusOption, replyStatus === 'resolved' && styles.statusOptionActive]}
                        onPress={() => setReplyStatus('resolved')}
                      >
                        <Text style={[styles.statusOptionText, replyStatus === 'resolved' && styles.statusOptionTextActive]}>
                          Resolve
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Button
                        title="Cancel"
                        variant="outline"
                        size="sm"
                        onPress={() => setSelectedTicket(null)}
                      />
                      <Button
                        title={isUpdating ? 'Saving...' : 'Send & Update'}
                        variant="primary"
                        size="sm"
                        icon={Send}
                        onPress={() => handleReplyAndResolve(t.id)}
                        disabled={isUpdating}
                      />
                    </View>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.openReplyBtn}
                  onPress={() => {
                    setSelectedTicket(t);
                    setReplyText(t.admin_reply || '');
                    setReplyStatus(t.status === 'resolved' ? 'resolved' : 'in_progress');
                  }}
                >
                  <MessageSquare size={14} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.openReplyBtnText}>
                    {t.admin_reply ? 'Edit Resolution & Status' : 'Reply & Resolve Issue'}
                  </Text>
                </TouchableOpacity>
              )}
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  header: {
    marginBottom: spacing.md
  },
  title: {
    ...typography.titleMedium,
    color: colors.textPrimary
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.sm
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    outlineStyle: 'none'
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.bgMuted,
    borderWidth: 1,
    borderColor: 'transparent'
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  filterChipTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md
  },
  toastText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600'
  },
  centerLoading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center'
  },
  ticketCard: {
    padding: spacing.md,
    marginBottom: spacing.md
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  ticketSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary
  },
  ticketSubText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full
  },
  statusOpen: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE'
  },
  statusProgress: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A'
  },
  statusResolved: {
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800'
  },
  statusTextOpen: {
    color: '#1E40AF'
  },
  statusTextProgress: {
    color: '#92400E'
  },
  statusTextResolved: {
    color: '#065F46'
  },
  userMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.sm
  },
  userPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.sm
  },
  userPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary
  },
  ticketBody: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.sm
  },
  adminReplyCard: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginBottom: spacing.sm
  },
  adminReplyHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669'
  },
  adminReplyBody: {
    fontSize: 12,
    color: colors.textPrimary,
    marginTop: 2
  },
  openReplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radii.sm,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginTop: spacing.xs
  },
  openReplyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  },
  replyForm: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.sm,
    marginTop: spacing.sm
  },
  replyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  replyInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.sm,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    height: 70,
    textAlignVertical: 'top',
    outlineStyle: 'none'
  },
  replyActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusSelectRow: {
    flexDirection: 'row',
    gap: 4
  },
  statusOption: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF'
  },
  statusOptionActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  statusOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary
  },
  statusOptionTextActive: {
    color: colors.primary,
    fontWeight: '700'
  }
});
