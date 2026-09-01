import React, { useState, useEffect } from 'react';
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
  Briefcase,
  Phone,
  Mail,
  MapPin,
  Save,
  Headphones,
  Home
} from 'lucide-react';
import { colors, spacing, radii } from '../../theme';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

function formatPhoneDisplay(phone) {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
}

export function ProfileScreen({ onNavigate, onBack }) {
  const { user, logout, myBusinesses, savedCards, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [city, setCity] = useState(user?.city || 'Coimbatore');
  const [state, setState] = useState(user?.state || 'Tamil Nadu');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
    setCity(user?.city || 'Coimbatore');
    setState(user?.state || 'Tamil Nadu');
  }, [user]);

  const phoneDisplay = formatPhoneDisplay(user?.phone);

  const handleSave = async () => {
    if (!name.trim()) {
      alert('Name is required.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim() || null,
        city: city.trim(),
        state: state.trim()
      });
      setToast('Profile saved.');
      setTimeout(() => setToast(''), 3000);
    } catch (e) {
      alert(e.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const menuSections = [
    {
      title: 'Quick Links',
      items: [
        { icon: Home, label: 'Home', sub: 'Dashboard', action: () => onNavigate?.('user_dashboard') },
        { icon: Building2, label: 'My Businesses', sub: myBusinesses?.length ? `${myBusinesses.length} business${myBusinesses.length > 1 ? 'es' : ''}` : 'None yet', action: () => onNavigate?.('user_my_business') },
        { icon: CreditCard, label: 'Saved Cards', sub: savedCards?.length ? `${savedCards.length} cards` : 'None yet', action: () => onNavigate?.('user_vault') },
        { icon: Download, label: 'Export & Backup', action: () => onNavigate?.('user_vault') },
        { icon: Headphones, label: 'Support', action: () => onNavigate?.('user_support') }
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
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backRow} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      ) : null}
      <Text style={styles.pageTitle}>My Profile</Text>

      {toast ? (
        <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>
      ) : null}

      <Card style={styles.headerCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name?.[0]?.toUpperCase() || 'U'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{name || 'CardFlow User'}</Text>
            <Text style={styles.userPhone}>+91 {phoneDisplay}</Text>
            {myBusinesses?.length > 0 && (
              <View style={styles.bizBadge}>
                <Briefcase size={12} color={colors.primary} />
                <Text style={styles.bizBadgeText}>Business Member · {myBusinesses.length}</Text>
              </View>
            )}
          </View>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Account Details</Text>
      <Card style={styles.formCard}>
        <Input label="FULL NAME" value={name} onChangeText={setName} leftIcon={User} placeholder="Your name" />
        <Input
          label="MOBILE NUMBER"
          value={phoneDisplay ? `+91 ${phoneDisplay}` : ''}
          editable={false}
          leftIcon={Phone}
        />
        <Text style={styles.hint}>To change mobile number, logout and sign in with the new number.</Text>
        <Input label="EMAIL" value={email} onChangeText={setEmail} leftIcon={Mail} placeholder="you@email.com" keyboardType="email-address" />
        <Input label="CITY" value={city} onChangeText={setCity} leftIcon={MapPin} placeholder="Coimbatore" />
        <Input label="STATE" value={state} onChangeText={setState} placeholder="Tamil Nadu" />
        <Button title="Save Changes" onPress={handleSave} loading={saving} icon={Save} size="lg" style={{ marginTop: spacing.sm }} />
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
  container: { flex: 1, backgroundColor: colors.bgMuted },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  backRow: { marginBottom: spacing.sm, alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  toast: {
    backgroundColor: '#ECFDF5',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  toastText: { color: '#059669', fontWeight: '600', fontSize: 13 },
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
  formCard: { padding: spacing.md, marginBottom: spacing.md },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: -4, marginBottom: spacing.sm, lineHeight: 16 },
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
    marginTop: spacing.sm,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2'
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.danger }
});
