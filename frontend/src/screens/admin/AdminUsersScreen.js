import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal } from 'react-native';
import { Users, Search, ShieldCheck, UserCheck, Plus, Gift, Check, X, Building, Phone, Calendar } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

const initialUsers = [
  { id: 'usr-ajay', name: 'Ajay', phone: '6382124970', role: 'admin', plan: 'premium', accessPeriod: 'Lifetime Admin Access', city: 'Coimbatore', isIdVerified: true, status: 'active' },
  { id: 'usr-govardhan', name: 'Govardhan', phone: '9008722766', role: 'admin', plan: 'premium', accessPeriod: 'Lifetime Admin Access', city: 'Bengaluru', isIdVerified: true, status: 'active' },
  { id: 'usr-raj', name: 'Raj', phone: '7094310122', role: 'owner', plan: 'premium', accessPeriod: '1 Year Free Access', businessName: 'Raj Engineering Works', city: 'Coimbatore', isIdVerified: true, status: 'active' },
  { id: 'usr-rashiq', name: 'Rashiq', phone: '9042938108', role: 'owner', plan: 'plus', accessPeriod: '6 Months Free Access', businessName: 'Rashiq Trading & Logistics', city: 'Coimbatore', isIdVerified: true, status: 'active' },
  { id: 'usr-suresh', name: 'Suresh Natarajan', phone: '9876543210', role: 'owner', plan: 'plus', accessPeriod: 'Active Plan', businessName: 'Kovai Precision Tools', city: 'Coimbatore', isIdVerified: true, status: 'active' },
  { id: 'usr-dharani', name: 'Dharani', phone: '9677840181', role: 'user', plan: 'free', accessPeriod: 'Standard User', city: 'Coimbatore', isIdVerified: true, status: 'active' },
  { id: 'usr-ravi', name: 'Ravi Kumar', phone: '1234567890', role: 'user', plan: 'free', accessPeriod: 'Standard User', city: 'Coimbatore', isIdVerified: true, status: 'active' },
  { id: 'usr-admin-sup', name: 'Admin Supervisor', phone: '9999988888', role: 'admin', plan: 'premium', accessPeriod: 'Lifetime Admin Access', city: 'Coimbatore', isIdVerified: true, status: 'active' }
];

export function AdminUsersScreen() {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  
  // Modals
  const [selectedUserForGrant, setSelectedUserForGrant] = useState(null);
  const [grantPlan, setGrantPlan] = useState('6_months');
  const [showAddBizModal, setShowAddBizModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  // Add Business Form
  const [newBizOwnerName, setNewBizOwnerName] = useState('');
  const [newBizOwnerPhone, setNewBizOwnerPhone] = useState('');
  const [newBizName, setNewBizName] = useState('');
  const [newBizCategory, setNewBizCategory] = useState('Manufacturing');
  const [newBizCity, setNewBizCity] = useState('Coimbatore');
  const [newBizPlan, setNewBizPlan] = useState('1_year');

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.phone.includes(search) ||
    (u.businessName && u.businessName.toLowerCase().includes(search.toLowerCase()))
  );

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  const handleGrantAccess = async () => {
    if (!selectedUserForGrant) return;
    const label = grantPlan === '6_months' ? '6 Months Free' : grantPlan === '1_year' ? '1 Year Free' : 'Lifetime Free Access';
    
    // Trigger real backend API
    await apiClient.grantAccess({
      user_id: selectedUserForGrant.id,
      phone: selectedUserForGrant.phone,
      plan: 'premium',
      duration: grantPlan,
      notes: 'Admin manual grant'
    });

    setUsers(prev => prev.map(u => {
      if (u.id === selectedUserForGrant.id) {
        return {
          ...u,
          plan: 'premium',
          accessPeriod: label
        };
      }
      return u;
    }));
    showToast(`Granted ${label} to ${selectedUserForGrant.name} successfully!`);
    setSelectedUserForGrant(null);
  };

  const handleCreateBusiness = async () => {
    if (!newBizOwnerName || !newBizOwnerPhone || !newBizName) {
      alert('Please fill owner name, phone number, and business name.');
      return;
    }
    const label = newBizPlan === '6_months' ? '6 Months Free Access' : newBizPlan === '1_year' ? '1 Year Free Access' : 'Lifetime Free Access';
    
    // Trigger real backend API
    await apiClient.createBusinessManual({
      owner_name: newBizOwnerName,
      owner_phone: newBizOwnerPhone,
      business_name: newBizName,
      category: newBizCategory,
      city: newBizCity,
      free_access_plan: newBizPlan
    });

    const newUser = {
      id: 'usr-' + Date.now(),
      name: newBizOwnerName,
      phone: newBizOwnerPhone.replace(/[^0-9]/g, ''),
      role: 'owner',
      plan: 'premium',
      accessPeriod: label,
      businessName: newBizName,
      city: newBizCity,
      isIdVerified: true,
      status: 'active'
    };
    setUsers(prev => [newUser, ...prev]);
    showToast(`Manually registered "${newBizName}" with ${label}!`);
    setShowAddBizModal(false);
    setNewBizOwnerName('');
    setNewBizOwnerPhone('');
    setNewBizName('');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Toast Notification */}
      {toastMsg ? (
        <View style={styles.toast}>
          <Check size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text style={styles.toastText}>{toastMsg}</Text>
        </View>
      ) : null}

      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>User & Business Management</Text>
          <Text style={styles.subtitle}>
            Manage admins, business owners, grants, and manual registrations.
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBizBtn}
          onPress={() => setShowAddBizModal(true)}
        >
          <Plus size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.addBizBtnText}>+ Add Business</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchWrap}>
        <Search size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search by name, phone, or business..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
      </View>

      {filtered.map((u) => (
        <Card key={u.id} style={styles.userCard}>
          <View style={styles.userRow}>
            <View style={[styles.avatar, u.role === 'admin' ? styles.avatarAdmin : u.role === 'owner' ? styles.avatarOwner : styles.avatarUser]}>
              <Text style={styles.avatarText}>{u.name[0]}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.userName}>{u.name}</Text>
                  {u.isIdVerified && <Badge type="id" label="Verified" style={{ marginLeft: 6 }} />}
                </View>

                {/* Grant Access Action Button for Non-Admins */}
                {u.role !== 'admin' && (
                  <TouchableOpacity
                    style={styles.grantBtn}
                    onPress={() => setSelectedUserForGrant(u)}
                  >
                    <Gift size={12} color={colors.primary} style={{ marginRight: 3 }} />
                    <Text style={styles.grantBtnText}>Grant Access</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.phoneText}>+91 {u.phone} • {u.city}</Text>
              {u.businessName ? (
                <Text style={styles.bizText}>🏢 {u.businessName}</Text>
              ) : null}

              <View style={styles.tagsRow}>
                <View style={[styles.roleChip, u.role === 'admin' ? styles.roleAdmin : u.role === 'owner' ? styles.roleOwner : styles.roleUser]}>
                  <Text style={styles.roleChipText}>{u.role.toUpperCase()}</Text>
                </View>
                <View style={styles.planChip}>
                  <Text style={styles.planChipText}>{u.accessPeriod}</Text>
                </View>
              </View>
            </View>
          </View>
        </Card>
      ))}

      {/* MODAL 1: GRANT FREE ACCESS */}
      {selectedUserForGrant && (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <Card style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Gift size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.modalTitle}>Grant Free Access</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedUserForGrant(null)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDesc}>
                Grant complimentary premium features to <Text style={{ fontWeight: '700' }}>{selectedUserForGrant.name}</Text> (+91 {selectedUserForGrant.phone}).
              </Text>

              <View style={styles.durationOptions}>
                <TouchableOpacity
                  style={[styles.durationOption, grantPlan === '6_months' && styles.durationOptionActive]}
                  onPress={() => setGrantPlan('6_months')}
                >
                  <Text style={[styles.durationTitle, grantPlan === '6_months' && styles.durationTitleActive]}>6 Months Free</Text>
                  <Text style={styles.durationSub}>Plus Tier Access</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.durationOption, grantPlan === '1_year' && styles.durationOptionActive]}
                  onPress={() => setGrantPlan('1_year')}
                >
                  <Text style={[styles.durationTitle, grantPlan === '1_year' && styles.durationTitleActive]}>1 Year Free</Text>
                  <Text style={styles.durationSub}>Premium All-Access</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.durationOption, grantPlan === 'lifetime' && styles.durationOptionActive]}
                  onPress={() => setGrantPlan('lifetime')}
                >
                  <Text style={[styles.durationTitle, grantPlan === 'lifetime' && styles.durationTitleActive]}>Lifetime Free</Text>
                  <Text style={styles.durationSub}>VIP Partner Access</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setSelectedUserForGrant(null)}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <Button
                  title="Confirm Grant"
                  onPress={handleGrantAccess}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          </View>
        </Modal>
      )}

      {/* MODAL 2: ADD BUSINESS MANUALLY */}
      {showAddBizModal && (
        <Modal visible={true} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <Card style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Building size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.modalTitle}>Manually Register Business</Text>
                </View>
                <TouchableOpacity onPress={() => setShowAddBizModal(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <Input
                  label="OWNER FULL NAME *"
                  placeholder="e.g. Raj / Suresh"
                  value={newBizOwnerName}
                  onChangeText={setNewBizOwnerName}
                />
                <Input
                  label="OWNER PHONE NUMBER *"
                  placeholder="e.g. 7094310122"
                  value={newBizOwnerPhone}
                  onChangeText={setNewBizOwnerPhone}
                  keyboardType="numeric"
                  leftIcon={Phone}
                />
                <Input
                  label="BUSINESS OR SHOP NAME *"
                  placeholder="e.g. Raj Engineering Works"
                  value={newBizName}
                  onChangeText={setNewBizName}
                  leftIcon={Building}
                />
                <Input
                  label="CATEGORY / INDUSTRY"
                  placeholder="Manufacturing, Textiles, Logistics..."
                  value={newBizCategory}
                  onChangeText={setNewBizCategory}
                />
                <Input
                  label="CITY"
                  placeholder="Coimbatore"
                  value={newBizCity}
                  onChangeText={setNewBizCity}
                />

                <Text style={styles.grantLabel}>GRANT FREE ACCESS DURATION</Text>
                <View style={styles.durationRow}>
                  {['6_months', '1_year', 'lifetime'].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.smallDurationBtn, newBizPlan === d && styles.smallDurationBtnActive]}
                      onPress={() => setNewBizPlan(d)}
                    >
                      <Text style={[styles.smallDurationText, newBizPlan === d && styles.smallDurationTextActive]}>
                        {d === '6_months' ? '6 Months' : d === '1_year' ? '1 Year' : 'Lifetime'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setShowAddBizModal(false)}
                  style={{ flex: 1, marginRight: spacing.sm }}
                />
                <Button
                  title="Create & Activate"
                  onPress={handleCreateBusiness}
                  style={{ flex: 1 }}
                />
              </View>
            </Card>
          </View>
        </Modal>
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
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  addBizBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.md
  },
  addBizBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    height: 44,
    marginBottom: spacing.md
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    outlineStyle: 'none'
  },
  userCard: {
    marginBottom: spacing.sm,
    padding: spacing.md
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  avatarAdmin: { backgroundColor: '#FEE2E2' },
  avatarOwner: { backgroundColor: '#EFF6FF' },
  avatarUser: { backgroundColor: '#F1F5F9' },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  phoneText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1
  },
  bizText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.accentBlue,
    marginTop: 2
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6
  },
  roleChip: {
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.xs,
    marginRight: 6
  },
  roleAdmin: { backgroundColor: '#FEE2E2' },
  roleOwner: { backgroundColor: '#EFF6FF' },
  roleUser: { backgroundColor: '#F1F5F9' },
  roleChipText: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textPrimary
  },
  planChip: {
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: radii.xs
  },
  planChipText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#059669'
  },
  grantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm
  },
  grantBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    padding: spacing.lg,
    borderRadius: radii.lg
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  modalDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 18
  },
  durationOptions: {
    gap: spacing.xs,
    marginBottom: spacing.lg
  },
  durationOption: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF'
  },
  durationOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4'
  },
  durationTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  durationTitleActive: {
    color: colors.primary
  },
  durationSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: spacing.sm
  },
  grantLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: spacing.xs,
    marginBottom: 6
  },
  durationRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md
  },
  smallDurationBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: '#FFFFFF'
  },
  smallDurationBtnActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4'
  },
  smallDurationText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  smallDurationTextActive: {
    color: colors.primary,
    fontWeight: '700'
  }
});
