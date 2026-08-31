import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { LifeBuoy, X, Send, MessageSquare, Clock, CheckCircle2, ChevronRight, AlertCircle, HelpCircle } from 'lucide-react';
import { colors, radii, spacing, typography } from '../theme';
import { Card } from './Card';
import { Button } from './Button';
import { apiClient } from '../services/api';
import { useAuth } from '../context/AuthContext';

export function SupportModal({ visible, onClose }) {
  const { token, user, role } = useAuth();
  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'history'
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState('');

  // Form fields
  const [category, setCategory] = useState('general');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const categoryList = [
    { id: 'general', label: 'General Inquiry' },
    { id: 'card_scan', label: 'Card Scanning & OCR' },
    { id: 'business_listing', label: 'Business Listing & GST' },
    { id: 'billing', label: 'Billing & Subscriptions' }
  ];

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const list = await apiClient.getMySupportTickets(token);
      setTickets(list);
    } catch (e) {
      console.warn('Error fetching support tickets:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchTickets();
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!subject.trim() || !message.trim()) {
      alert('Please enter both subject and message for your support request.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.createSupportTicket({
        category,
        subject: subject.trim(),
        message: message.trim()
      }, token);

      setToast('Support ticket submitted successfully! Admin will resolve it shortly.');
      setSubject('');
      setMessage('');
      await fetchTickets();
      setActiveTab('history');
    } catch (e) {
      alert('Failed to submit ticket. Please try again.');
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setToast(''), 4000);
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={styles.iconCircle}>
                <LifeBuoy size={22} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.headerTitle}>CardFlow Support Service</Text>
                <Text style={styles.headerSubtitle}>24/7 Priority Help for Users & Business Owners</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'new' && styles.tabBtnActive]}
              onPress={() => setActiveTab('new')}
            >
              <Send size={15} color={activeTab === 'new' ? colors.primary : colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
                New Request
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
              onPress={() => {
                setActiveTab('history');
                fetchTickets();
              }}
            >
              <MessageSquare size={15} color={activeTab === 'history' ? colors.primary : colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
                My Tickets ({tickets.length})
              </Text>
            </TouchableOpacity>
          </View>

          {toast ? (
            <View style={styles.toastCard}>
              <CheckCircle2 size={16} color="#059669" style={{ marginRight: 6 }} />
              <Text style={styles.toastText}>{toast}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.bodyScroll} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {activeTab === 'new' ? (
              <View>
                {/* Category Selection */}
                <Text style={styles.fieldLabel}>Select Inquiry Type</Text>
                <View style={styles.categoryGrid}>
                  {categoryList.map((c) => (
                    <TouchableOpacity
                      key={c.id}
                      style={[styles.catBtn, category === c.id && styles.catBtnActive]}
                      onPress={() => setCategory(c.id)}
                    >
                      <Text style={[styles.catText, category === c.id && styles.catTextActive]}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Subject */}
                <Text style={styles.fieldLabel}>Subject / Issue Summary</Text>
                <TextInput
                  value={subject}
                  onChangeText={setSubject}
                  placeholder="e.g., GST certificate verification assistance"
                  placeholderTextColor={colors.textMuted}
                  style={styles.input}
                />

                {/* Message Details */}
                <Text style={styles.fieldLabel}>Detailed Description</Text>
                <TextInput
                  value={message}
                  onChangeText={setMessage}
                  placeholder="Describe your issue or question in detail so admin team can solve it..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  style={[styles.input, styles.textArea]}
                />

                {/* Submit CTA */}
                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Send size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.submitBtnText}>Submit Support Request</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {isLoading ? (
                  <View style={styles.centerLoading}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 13 }}>Loading support tickets...</Text>
                  </View>
                ) : tickets.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <HelpCircle size={40} color={colors.textMuted} />
                    <Text style={styles.emptyTitle}>No Support Tickets</Text>
                    <Text style={styles.emptySub}>You haven't submitted any requests yet. Tap "New Request" if you need help.</Text>
                  </View>
                ) : (
                  tickets.map((t) => (
                    <Card key={t.id} style={styles.ticketCard}>
                      <View style={styles.ticketHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.ticketSubject}>{t.subject}</Text>
                          <Text style={styles.ticketMeta}>
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

                      <Text style={styles.ticketMsg}>{t.message}</Text>

                      {/* Admin Response Box */}
                      {t.admin_reply ? (
                        <View style={styles.adminReplyBox}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                            <CheckCircle2 size={14} color="#059669" style={{ marginRight: 4 }} />
                            <Text style={styles.adminReplyLabel}>Admin Response:</Text>
                          </View>
                          <Text style={styles.adminReplyText}>{t.admin_reply}</Text>
                        </View>
                      ) : (
                        <View style={styles.pendingReplyBox}>
                          <Clock size={13} color="#D97706" style={{ marginRight: 4 }} />
                          <Text style={styles.pendingReplyText}>Admin team reviewing. Response expected soon.</Text>
                        </View>
                      )}
                    </Card>
                  ))
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md
  },
  modalCard: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#F8FAFC'
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    backgroundColor: colors.bgMuted,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tabsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: '#FFFFFF'
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabBtnActive: {
    borderBottomColor: colors.primary
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radii.md
  },
  toastText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600'
  },
  bodyScroll: {
    flex: 1
  },
  bodyContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.sm
  },
  catBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF'
  },
  catBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  catText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  catTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  input: {
    backgroundColor: colors.bgMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    outlineStyle: 'none'
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  submitBtn: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: radii.md,
    marginTop: spacing.sm
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  centerLoading: {
    paddingVertical: spacing.xxl,
    alignItems: 'center'
  },
  emptyWrap: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md
  },
  emptySub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    paddingHorizontal: spacing.xl
  },
  ticketCard: {
    padding: spacing.md,
    marginBottom: spacing.md
  },
  ticketHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.xs
  },
  ticketSubject: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  ticketMeta: {
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
  ticketMsg: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginVertical: spacing.xs
  },
  adminReplyBox: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
    padding: spacing.sm,
    borderRadius: radii.sm,
    marginTop: spacing.sm
  },
  adminReplyLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669'
  },
  adminReplyText: {
    fontSize: 12,
    color: colors.textPrimary,
    lineHeight: 16
  },
  pendingReplyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: spacing.xs,
    borderRadius: radii.sm,
    marginTop: spacing.sm
  },
  pendingReplyText: {
    fontSize: 11,
    color: '#B45309',
    fontWeight: '500'
  }
});
