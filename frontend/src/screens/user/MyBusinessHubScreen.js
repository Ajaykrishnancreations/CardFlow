import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput } from 'react-native';
import { Building2, Plus, MapPin, Upload, X, ChevronRight } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

export function MyBusinessHubScreen({ onSelectBusiness }) {
  const { myBusinesses, addMyBusiness } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    business_name: '', category: 'Manufacturing', phone: '', whatsapp: '',
    email: '', website: '', gstin: '', address: '', area: '',
    city: 'Coimbatore', district: 'Coimbatore', state: 'Tamil Nadu'
  });
  const [toast, setToast] = useState('');

  const handleCreate = async () => {
    if (!form.business_name.trim() || !form.phone.trim() || !form.gstin.trim() || !form.address.trim()) {
      alert('Business Name, Phone, GSTIN, and Address are required.');
      return;
    }
    await addMyBusiness(form);
    setToast(`"${form.business_name}" added successfully!`);
    setShowAddModal(false);
    setForm({
      business_name: '', category: 'Manufacturing', phone: '', whatsapp: '',
      email: '', website: '', gstin: '', address: '', area: '',
      city: 'Coimbatore', district: 'Coimbatore', state: 'Tamil Nadu'
    });
    setTimeout(() => setToast(''), 3500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>My Business</Text>
          <Text style={styles.subtitle}>
            {myBusinesses.length > 0
              ? `You have ${myBusinesses.length} business${myBusinesses.length > 1 ? 'es' : ''} registered.`
              : "You haven't added a business yet. Showcase your business and connect with customers."}
          </Text>
        </View>
        <Button title="+ Add" onPress={() => setShowAddModal(true)} size="sm" />
      </View>

      {toast ? (
        <View style={styles.toast}><Text style={styles.toastText}>{toast}</Text></View>
      ) : null}

      {myBusinesses.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Building2 size={40} color={colors.textMuted} style={{ marginBottom: spacing.md }} />
          <Text style={styles.emptyTitle}>No Business Added Yet</Text>
          <Text style={styles.emptySub}>
            Want to showcase your business and connect with more customers? Add your first business listing.
          </Text>
          <Button title="Add My Business" onPress={() => setShowAddModal(true)} style={{ marginTop: spacing.lg }} />
        </Card>
      ) : (
        myBusinesses.map((biz) => (
          <Card key={biz.id} style={styles.bizCard} onPress={() => onSelectBusiness && onSelectBusiness(biz)}>
            <View style={styles.bizRow}>
              <View style={styles.logoWrap}>
                <Building2 size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bizName}>{biz.name || biz.business_name}</Text>
                <Text style={styles.bizMeta}>{biz.city} • {biz.category || 'Business'}</Text>
                {biz.gstin && <Text style={styles.gstText}>GST: {biz.gstin}</Text>}
                <Badge type="gst" label={biz.verification === 'gst' ? 'GST Verified' : 'Pending'} style={{ marginTop: 6, alignSelf: 'flex-start' }} />
              </View>
              <ChevronRight size={18} color={colors.textMuted} />
            </View>
            <TouchableOpacity style={styles.manageBtn} onPress={() => onSelectBusiness && onSelectBusiness(biz)}>
              <Text style={styles.manageBtnText}>Manage →</Text>
            </TouchableOpacity>
          </Card>
        ))
      )}

      {myBusinesses.length > 0 && (
        <TouchableOpacity style={styles.addAnotherBtn} onPress={() => setShowAddModal(true)}>
          <Plus size={16} color={colors.primary} />
          <Text style={styles.addAnotherText}>Add Another Business</Text>
        </TouchableOpacity>
      )}

      {/* Add Business Modal */}
      {showAddModal && (
        <Modal transparent animationType="slide" visible={showAddModal} onRequestClose={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Business</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}><X size={20} color={colors.textSecondary} /></TouchableOpacity>
              </View>
              <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
                {[
                  { key: 'business_name', label: 'Business Name *', placeholder: 'ABC Traders' },
                  { key: 'category', label: 'Business Category *', placeholder: 'Retail, Manufacturing, IT...' },
                  { key: 'phone', label: 'Phone *', placeholder: '+91 XXXXX XXXXX' },
                  { key: 'whatsapp', label: 'WhatsApp', placeholder: '+91 XXXXX XXXXX' },
                  { key: 'email', label: 'Email', placeholder: 'info@business.com' },
                  { key: 'website', label: 'Website', placeholder: 'www.business.com' },
                  { key: 'gstin', label: 'GSTIN *', placeholder: '33XXXXXXXXXXXXXX' },
                  { key: 'address', label: 'Address *', placeholder: 'Street, Area, Landmark' },
                  { key: 'area', label: 'Area', placeholder: 'Ganapathy, RS Puram...' },
                  { key: 'city', label: 'City *', placeholder: 'Coimbatore' },
                  { key: 'district', label: 'District', placeholder: 'Coimbatore' },
                  { key: 'state', label: 'State', placeholder: 'Tamil Nadu' }
                ].map(({ key, label, placeholder }) => (
                  <View key={key}>
                    <Text style={styles.fieldLabel}>{label}</Text>
                    <TextInput
                      value={form[key]}
                      onChangeText={(v) => setForm((f) => ({ ...f, [key]: v }))}
                      placeholder={placeholder}
                      placeholderTextColor={colors.textMuted}
                      style={styles.input}
                    />
                  </View>
                ))}
                <TouchableOpacity style={styles.uploadArea}>
                  <Upload size={20} color={colors.primary} />
                  <Text style={styles.uploadText}>Upload Business Card Image</Text>
                </TouchableOpacity>
              </ScrollView>
              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={() => setShowAddModal(false)} style={{ flex: 1 }} />
                <Button title="Create Business" onPress={handleCreate} style={{ flex: 1.5 }} />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.md, gap: spacing.sm },
  title: { ...typography.titleMedium, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  toast: { backgroundColor: '#D1FAE5', padding: spacing.sm, borderRadius: radii.md, marginBottom: spacing.md },
  toastText: { fontSize: 13, color: '#065F46', fontWeight: '600' },
  emptyCard: { alignItems: 'center', padding: spacing.xxl },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 6, lineHeight: 20 },
  bizCard: { padding: spacing.md, marginBottom: spacing.sm },
  bizRow: { flexDirection: 'row', alignItems: 'center' },
  logoWrap: {
    width: 44, height: 44, borderRadius: radii.md, backgroundColor: colors.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.md
  },
  bizName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  bizMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  gstText: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  manageBtn: { marginTop: spacing.sm, alignItems: 'flex-end' },
  manageBtnText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  addAnotherBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    padding: spacing.md, borderRadius: radii.md,
    borderWidth: 1.5, borderColor: colors.primary, borderStyle: 'dashed', marginTop: spacing.sm
  },
  addAnotherText: { fontSize: 13, fontWeight: '700', color: colors.primary, marginLeft: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'center', padding: spacing.md },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: radii.xl, padding: spacing.lg, maxWidth: 520, width: '100%', alignSelf: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { ...typography.titleMedium, color: colors.textPrimary },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textPrimary, marginBottom: 4, marginTop: spacing.xs },
  input: {
    backgroundColor: colors.bgMuted, borderWidth: 1, borderColor: colors.border,
    borderRadius: radii.md, paddingHorizontal: spacing.md, paddingVertical: 8,
    fontSize: 13, color: colors.textPrimary, marginBottom: spacing.xs, outlineStyle: 'none'
  },
  uploadArea: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
    borderRadius: radii.md, padding: spacing.lg, marginVertical: spacing.sm, gap: 8
  },
  uploadText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  modalActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }
});
