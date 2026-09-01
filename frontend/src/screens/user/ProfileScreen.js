import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  User,
  ChevronRight,
  LogOut,
  Building2,
  CreditCard,
  Download,
  Bell,
  Shield,
  FileText,
  Briefcase
} from 'lucide-react';
import { colors, spacing } from '../../theme';
import { Card } from '../../components/Card';
import { useAuth } from '../../context/AuthContext';

export function ProfileScreen({ onNavigate }) {
  const { user, logout, myBusinesses, savedCards } = useAuth();

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Personal Information', action: () => alert('Personal information editing coming soon.') },
        { icon: Building2, label: 'My Businesses', sub: myBusinesses?.length ? `${myBusinesses.length} business${myBusinesses.length > 1 ? 'es' : ''}` : 'None yet', action: () => onNavigate?.('user_my_business') },
        { icon: CreditCard, label: 'Saved Cards', sub: savedCards?.length ? `${savedCards.length} cards` : 'None yet', action: () => onNavigate?.('user_vault') },
        { icon: Download, label: 'Export & Backup', action: () => onNavigate?.('user_vault') }
      ]
    },
    {
      title: 'Settings',
      items: [
        { icon: Bell, label: 'Notifications', action: () => alert('Notification settings coming soon.') },
        { icon: Shield, label: 'Privacy', action: () => alert('Privacy settings coming soon.') },
        { icon: FileText, label: 'Terms & Conditions', action: () => alert('Terms & Conditions — CardFlow v1.0') }
      ]
    }
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Card style={styles.headerCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name ? user.name[0].toUpperCase() : 'U'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user?.name || 'CardFlow User'}</Text>
            <Text style={styles.userPhone}>+91 {user?.phone || 'XXXXXXXXXX'}</Text>
            {myBusinesses?.length > 0 && (
              <View style={styles.bizBadge}>
                <Briefcase size={12} color={colors.primary} />
                <Text style={styles.bizBadgeText}>Business Member · {myBusinesses.length} business{myBusinesses.length > 1 ? 'es' : ''}</Text>
              </View>
            )}
          </View>
        </View>
      </Card>

      {menuSections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Card style={styles.menuCard}>
            {section.items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.menuItem, idx === section.items.length - 1 && { borderBottomWidth: 0 }]}
                  onPress={item.action}
                  activeOpacity={0.7}
                >
                  <Icon size={18} color={colors.textSecondary} style={{ marginRight: spacing.md }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.menuText}>{item.label}</Text>
                    {item.sub ? <Text style={styles.menuSub}>{item.sub}</Text> : null}
                  </View>
                  <ChevronRight size={18} color={colors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </Card>
        </View>
      ))}

      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
        <LogOut size={18} color={colors.danger} style={{ marginRight: spacing.sm }} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  headerCard: { padding: spacing.lg, marginBottom: spacing.md },
  profileRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: colors.primary },
  userName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  userPhone: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  bizBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    backgroundColor: '#EFF6FF',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12
  },
  bizBadgeText: { fontSize: 11, color: colors.primary, fontWeight: '600', marginLeft: 4 },
  section: { marginBottom: spacing.md },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    marginLeft: 4,
    textTransform: 'uppercase'
  },
  menuCard: { padding: 0, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  menuText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  menuSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.danger }
});
