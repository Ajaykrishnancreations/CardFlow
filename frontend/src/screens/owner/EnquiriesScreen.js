import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Inbox, Phone, MessageSquare, Clock, CheckCircle2, User, ChevronRight } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { EmptyState } from '../../components/EmptyState';

const initialEnquiries = [
  {
    id: 'enq-1',
    customerName: 'Karthik Raja',
    customerPhone: '+91 98432 11223',
    message: 'We require a quote for 500 units of 2-inch stainless hydraulic valves delivered to Tirupur.',
    receivedAt: '10 mins ago',
    status: 'new',
    isIdVerified: true
  },
  {
    id: 'enq-2',
    customerName: 'Meena Viswanathan',
    customerPhone: '+91 97890 88776',
    message: 'Do you offer custom CNC lathe turning for high-precision brass components?',
    receivedAt: '2 hours ago',
    status: 'viewed',
    isIdVerified: false
  },
  {
    id: 'enq-3',
    customerName: 'Murugan Textiles',
    customerPhone: '+91 94433 44556',
    message: 'Requesting catalogue and wholesale price list for engineering spares.',
    receivedAt: 'Yesterday',
    status: 'responded',
    isIdVerified: true
  }
];

export function EnquiriesScreen() {
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [selectedTab, setSelectedTab] = useState('all'); // 'all' | 'new' | 'responded'

  const filtered = enquiries.filter((e) => {
    if (selectedTab === 'new' && e.status !== 'new') return false;
    if (selectedTab === 'responded' && e.status !== 'responded') return false;
    return true;
  });

  const markResponded = (id) => {
    setEnquiries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: 'responded' } : e))
    );
  };

  return (
    <View style={styles.container}>
      {/* Status Filter Tabs */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            All ({enquiries.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'new' && styles.tabActive]}
          onPress={() => setSelectedTab('new')}
        >
          <Text style={[styles.tabText, selectedTab === 'new' && styles.tabTextActive]}>
            New ({enquiries.filter((e) => e.status === 'new').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'responded' && styles.tabActive]}
          onPress={() => setSelectedTab('responded')}
        >
          <Text style={[styles.tabText, selectedTab === 'responded' && styles.tabTextActive]}>
            Responded
          </Text>
        </TouchableOpacity>
      </View>

      {/* Enquiries Feed */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {filtered.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No enquiries in this view"
            description="Incoming customer leads from search and your digital card profile will appear here."
          />
        ) : (
          filtered.map((enq) => (
            <Card key={enq.id} style={styles.enqCard}>
              <View style={styles.enqHeader}>
                <View style={styles.userAvatar}>
                  <Text style={styles.avatarText}>{enq.customerName[0]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.userName}>{enq.customerName}</Text>
                    {enq.isIdVerified && <Badge type="id" label="ID Verified" style={{ marginLeft: 6 }} />}
                  </View>
                  <Text style={styles.userPhone}>{enq.customerPhone}</Text>
                </View>
                <Text style={styles.timeText}>{enq.receivedAt}</Text>
              </View>

              <View style={styles.messageBox}>
                <Text style={styles.messageText}>"{enq.message}"</Text>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={styles.replyBtn}
                  onPress={() => {
                    markResponded(enq.id);
                    window.open(`https://wa.me/${enq.customerPhone.replace(/[^0-9]/g, '')}`);
                  }}
                >
                  <MessageSquare size={14} color={colors.verifiedGst} style={{ marginRight: 4 }} />
                  <Text style={[styles.replyBtnText, { color: colors.verifiedGst }]}>WhatsApp Reply</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.replyBtn, { backgroundColor: colors.primaryLight, marginLeft: spacing.sm }]}
                  onPress={() => {
                    markResponded(enq.id);
                    window.open(`tel:${enq.customerPhone}`);
                  }}
                >
                  <Phone size={14} color={colors.primary} style={{ marginRight: 4 }} />
                  <Text style={styles.replyBtnText}>Call Customer</Text>
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC'
  },
  tabsRow: {
    flexDirection: 'row',
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  tab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: radii.full,
    backgroundColor: colors.bgMuted,
    marginRight: spacing.sm
  },
  tabActive: {
    backgroundColor: colors.primary
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  tabTextActive: {
    color: '#FFFFFF'
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  enqCard: {
    marginBottom: spacing.md
  },
  enqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm
  },
  userAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  avatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  userPhone: {
    fontSize: 12,
    color: colors.textSecondary
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted
  },
  messageBox: {
    backgroundColor: colors.bgMuted,
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textPrimary
  },
  actionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm
  },
  replyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECFDF5',
    paddingVertical: 8,
    borderRadius: radii.sm
  },
  replyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary
  }
});
