import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { User, Mail, MapPin, Phone, Shield, LogOut, Save } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
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

export function AdminProfileScreen() {
  const { user, logout, updateProfile, token } = useAuth();
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
      setToast('Profile updated successfully.');
      setTimeout(() => setToast(''), 3000);
    } catch (e) {
      alert(e.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const phoneDisplay = formatPhoneDisplay(user?.phone);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>My Profile</Text>
        <Text style={styles.subtitle}>Manage your admin account details</Text>
      </View>

      {toast ? (
        <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>
      ) : null}

      <Card style={styles.profileCard}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{name?.[0]?.toUpperCase() || 'A'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.profileName}>{name || 'Administrator'}</Text>
            <Text style={styles.profilePhone}>+91 {phoneDisplay}</Text>
            <Badge type="verified" label="Platform Admin" style={{ marginTop: 8, alignSelf: 'flex-start' }} />
          </View>
        </View>
      </Card>

      <Text style={styles.sectionLabel}>Account Details</Text>
      <Card style={styles.formCard}>
        <Input
          label="FULL NAME"
          value={name}
          onChangeText={setName}
          leftIcon={User}
          placeholder="Your name"
        />
        <Input
          label="MOBILE NUMBER"
          value={phoneDisplay ? `+91 ${phoneDisplay}` : ''}
          editable={false}
          leftIcon={Phone}
          placeholder="+91 XXXXX XXXXX"
        />
        <Text style={styles.hint}>
          Mobile number is your login ID. To change it, logout and sign in with the new number.
        </Text>
        <Input
          label="EMAIL (OPTIONAL)"
          value={email}
          onChangeText={setEmail}
          leftIcon={Mail}
          placeholder="admin@company.com"
          keyboardType="email-address"
        />
        <Input
          label="CITY"
          value={city}
          onChangeText={setCity}
          leftIcon={MapPin}
          placeholder="Coimbatore"
        />
        <Input
          label="STATE"
          value={state}
          onChangeText={setState}
          placeholder="Tamil Nadu"
        />

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          icon={Save}
          size="lg"
          style={{ marginTop: spacing.sm }}
        />
      </Card>

      <Text style={styles.sectionLabel}>Session</Text>
      <Card style={styles.sessionCard}>
        <View style={styles.sessionRow}>
          <Shield size={18} color={colors.primary} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Text style={styles.sessionTitle}>Signed in as Admin</Text>
            <Text style={styles.sessionSub}>
              {token ? 'Active session · JWT authenticated' : 'Session active'}
            </Text>
          </View>
        </View>
      </Card>

      <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.7}>
        <LogOut size={18} color={colors.danger} style={{ marginRight: spacing.sm }} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMuted },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: { marginBottom: spacing.md },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: typography.titleSmall.fontFamily
  },
  subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  toast: {
    backgroundColor: '#ECFDF5',
    borderRadius: radii.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: '#A7F3D0'
  },
  toastText: { color: '#059669', fontWeight: '600', fontSize: 13 },
  profileCard: { padding: spacing.lg, marginBottom: spacing.md },
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
  profileName: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  profilePhone: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
    marginLeft: 4,
    textTransform: 'uppercase'
  },
  formCard: { padding: spacing.md, marginBottom: spacing.md },
  hint: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: -4,
    marginBottom: spacing.sm,
    lineHeight: 16
  },
  sessionCard: { padding: spacing.md, marginBottom: spacing.lg },
  sessionRow: { flexDirection: 'row', alignItems: 'center' },
  sessionTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  sessionSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2'
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.danger }
});
