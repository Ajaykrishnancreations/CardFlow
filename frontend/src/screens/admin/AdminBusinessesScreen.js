import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { Building2, Search, Plus, Edit2, Trash2, CheckCircle2, X, MapPin, Phone, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { ConfirmModal } from '../../components/ConfirmModal';
import { apiClient } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { mockBusinesses } from '../../data/mockData';

export function AdminBusinessesScreen() {
  const { token } = useAuth();
  const [businesses, setBusinesses] = useState(mockBusinesses);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  // Modals
  const [editingBiz, setEditingBiz] = useState(null);
  const [deletingBiz, setDeletingBiz] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Add / Edit Form State
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('Manufacturing');
  const [formCity, setFormCity] = useState('Coimbatore');
  const [formAddress, setFormAddress] = useState('');
  const [formPincode, setFormPincode] = useState('641004');
  const [formOwnerName, setFormOwnerName] = useState('');
  const [formOwnerPhone, setFormOwnerPhone] = useState('');
  const [formVerification, setFormVerification] = useState('gst');
  const [formListing, setFormListing] = useState('listed');

  const fetchBusinesses = async () => {
    setIsLoading(true);
    try {
      const list = await apiClient.getAdminBusinesses(token);
      if (list && Array.isArray(list) && list.length > 0) {
        setBusinesses(list);
      }
    } catch (e) {
      console.warn('Error fetching businesses:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const openEditModal = (biz) => {
    setEditingBiz(biz);
    setFormName(biz.name || '');
    setFormCategory(biz.category || 'Manufacturing');
    setFormCity(biz.city || 'Coimbatore');
    setFormAddress(biz.address || '');
    setFormPincode(biz.pincode || '641004');
    setFormOwnerName(biz.owner_name || biz.ownerName || 'Owner');
    setFormOwnerPhone(biz.owner_phone || biz.ownerPhone || '+919876543210');
    setFormVerification(biz.verification || 'gst');
    setFormListing(biz.listing || 'listed');
  };

  const handleSaveEdit = async () => {
    if (!formName.trim()) {
      alert('Business name is required.');
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        name: formName.trim(),
        category: formCategory,
        city: formCity,
        address: formAddress,
        pincode: formPincode,
        owner_name: formOwnerName,
        owner_phone: formOwnerPhone,
        verification: formVerification,
        listing: formListing,
        status: 'live'
      };

      await apiClient.updateAdminBusiness(editingBiz.id, payload, token);
      
      setBusinesses((prev) =>
        prev.map((b) => (b.id === editingBiz.id ? { ...b, ...payload } : b))
      );

      setToast(`Business "${formName}" updated successfully!`);
      setEditingBiz(null);
    } catch (e) {
      alert('Failed to update business listing.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setToast(''), 3500);
    }
  };

  const handleCreateBusiness = async () => {
    if (!formName.trim() || !formOwnerName.trim() || !formOwnerPhone.trim()) {
      alert('Please fill Business Name, Owner Name, and Owner Phone.');
      return;
    }

    setIsProcessing(true);
    try {
      const payload = {
        business_name: formName.trim(),
        owner_name: formOwnerName.trim(),
        owner_phone: formOwnerPhone.trim(),
        category: formCategory,
        city: formCity,
        address: formAddress,
        pincode: formPincode,
        free_access_plan: '1_year'
      };

      const res = await apiClient.createBusinessManual(payload, token);
      
      setToast(`Business "${formName}" created & listed dynamically!`);
      setShowAddModal(false);
      await fetchBusinesses();
    } catch (e) {
      alert('Failed to create business listing.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setToast(''), 3500);
    }
  };

  const handleDeleteBusiness = async () => {
    if (!deletingBiz) return;
    setIsProcessing(true);
    try {
      await apiClient.deleteAdminBusiness(deletingBiz.id, token);
      setBusinesses((prev) => prev.filter((b) => b.id !== deletingBiz.id));
      setToast(`Business "${deletingBiz.name}" deleted successfully.`);
      setDeletingBiz(null);
    } catch (e) {
      alert('Failed to delete business listing.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setToast(''), 3500);
    }
  };

  const filtered = businesses.filter((b) =>
    (b.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.category || '').toLowerCase().includes(search.toLowerCase()) ||
    (b.city || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Listings Management</Text>
          <Text style={styles.subtitle}>Audit business directory, edit metadata, verification badges, or delete listings.</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setFormName('');
            setFormCategory('Manufacturing');
            setFormCity('Coimbatore');
            setFormAddress('');
            setFormPincode('641004');
            setFormOwnerName('');
            setFormOwnerPhone('');
            setShowAddModal(true);
          }}
        >
          <Plus size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.addBtnText}>Add Business</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Search size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm }} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search listing by name, category, or city..."
          placeholderTextColor={colors.textMuted}
          style={styles.input}
        />
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
          <Text style={{ marginTop: 8, color: colors.textSecondary }}>Loading directory listings...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Building2 size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No Businesses Found</Text>
          <Text style={styles.emptySub}>No listings matched your search criteria.</Text>
        </View>
      ) : (
        filtered.map((biz) => (
          <Card key={biz.id} style={styles.bizCard}>
            <View style={styles.bizRow}>
              <View style={styles.logoWrap}>
                <Building2 size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bizName}>{biz.name}</Text>
                <Text style={styles.bizCat}>{biz.category} • {biz.city} ({biz.pincode || '641004'})</Text>
                <Text style={styles.ownerText}>Owner: {biz.owner_name || biz.ownerName || 'Verified Partner'} ({biz.owner_phone || biz.ownerPhone || '+919876543210'})</Text>

                <View style={styles.badgesRow}>
                  <Badge type="gst" label={biz.verification === 'gst' ? 'GST Verified' : 'Manual Verified'} />
                  <View style={[styles.visibilityChip, biz.listing === 'unlisted' && { backgroundColor: '#FEE2E2', borderColor: '#FECACA' }]}>
                    <Text style={[styles.visibilityText, biz.listing === 'unlisted' && { color: '#991B1B' }]}>
                      {biz.listing === 'unlisted' ? 'HIDDEN IN SEARCH' : 'LISTED IN SEARCH'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Action Buttons: Edit & Delete */}
              <View style={styles.actionColumn}>
                <TouchableOpacity
                  style={styles.actionBtnEdit}
                  onPress={() => openEditModal(biz)}
                  activeOpacity={0.7}
                >
                  <Edit2 size={15} color={colors.primary} />
                  <Text style={styles.actionBtnEditText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.actionBtnDelete}
                  onPress={() => setDeletingBiz(biz)}
                  activeOpacity={0.7}
                >
                  <Trash2 size={15} color={colors.danger} />
                  <Text style={styles.actionBtnDeleteText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        ))
      )}

      {/* Edit Business Modal */}
      {editingBiz && (
        <Modal transparent animationType="slide" visible={!!editingBiz} onRequestClose={() => setEditingBiz(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Business Listing</Text>
                <TouchableOpacity onPress={() => setEditingBiz(null)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Business Name</Text>
                <TextInput value={formName} onChangeText={setFormName} style={styles.modalInput} />

                <Text style={styles.fieldLabel}>Category</Text>
                <TextInput value={formCategory} onChangeText={setFormCategory} style={styles.modalInput} />

                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>City</Text>
                    <TextInput value={formCity} onChangeText={setFormCity} style={styles.modalInput} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Pincode</Text>
                    <TextInput value={formPincode} onChangeText={setFormPincode} style={styles.modalInput} />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Address</Text>
                <TextInput value={formAddress} onChangeText={setFormAddress} style={styles.modalInput} />

                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Owner Name</Text>
                    <TextInput value={formOwnerName} onChangeText={setFormOwnerName} style={styles.modalInput} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Owner Phone</Text>
                    <TextInput value={formOwnerPhone} onChangeText={setFormOwnerPhone} style={styles.modalInput} />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Search Directory Visibility</Text>
                <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
                  <TouchableOpacity
                    style={[styles.toggleOption, formListing === 'listed' && styles.toggleOptionActive]}
                    onPress={() => setFormListing('listed')}
                  >
                    <Eye size={14} color={formListing === 'listed' ? colors.primary : colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.toggleOptionText, formListing === 'listed' && styles.toggleOptionTextActive]}>Listed</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.toggleOption, formListing === 'unlisted' && styles.toggleOptionActive]}
                    onPress={() => setFormListing('unlisted')}
                  >
                    <EyeOff size={14} color={formListing === 'unlisted' ? colors.primary : colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.toggleOptionText, formListing === 'unlisted' && styles.toggleOptionTextActive]}>Hidden</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={() => setEditingBiz(null)} style={{ flex: 1 }} />
                <Button
                  title={isProcessing ? 'Saving...' : 'Save Changes'}
                  variant="primary"
                  onPress={handleSaveEdit}
                  disabled={isProcessing}
                  style={{ flex: 1.2 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Add New Business Modal */}
      {showAddModal && (
        <Modal transparent animationType="slide" visible={showAddModal} onRequestClose={() => setShowAddModal(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Business Listing</Text>
                <TouchableOpacity onPress={() => setShowAddModal(false)}>
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.fieldLabel}>Business Name</Text>
                <TextInput value={formName} onChangeText={setFormName} placeholder="e.g., Sri Ganesh Textiles" placeholderTextColor={colors.textMuted} style={styles.modalInput} />

                <Text style={styles.fieldLabel}>Category</Text>
                <TextInput value={formCategory} onChangeText={setFormCategory} placeholder="Manufacturing, IT, Logistics..." placeholderTextColor={colors.textMuted} style={styles.modalInput} />

                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>City</Text>
                    <TextInput value={formCity} onChangeText={setFormCity} style={styles.modalInput} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Pincode</Text>
                    <TextInput value={formPincode} onChangeText={setFormPincode} style={styles.modalInput} />
                  </View>
                </View>

                <Text style={styles.fieldLabel}>Full Address</Text>
                <TextInput value={formAddress} onChangeText={setFormAddress} placeholder="Street, Area, Landmark..." placeholderTextColor={colors.textMuted} style={styles.modalInput} />

                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Owner Name</Text>
                    <TextInput value={formOwnerName} onChangeText={setFormOwnerName} placeholder="Owner contact name" placeholderTextColor={colors.textMuted} style={styles.modalInput} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Owner Phone</Text>
                    <TextInput value={formOwnerPhone} onChangeText={setFormOwnerPhone} placeholder="10-digit mobile" placeholderTextColor={colors.textMuted} style={styles.modalInput} />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.modalActions}>
                <Button title="Cancel" variant="outline" onPress={() => setShowAddModal(false)} style={{ flex: 1 }} />
                <Button
                  title={isProcessing ? 'Creating...' : 'Create Listing'}
                  variant="primary"
                  onPress={handleCreateBusiness}
                  disabled={isProcessing}
                  style={{ flex: 1.2 }}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={!!deletingBiz}
        title="Delete Business Listing"
        message={`Are you sure you want to delete "${deletingBiz?.name}"? It will be permanently removed from the public directory and database.`}
        confirmText="Delete Listing"
        confirmVariant="danger"
        isLoading={isProcessing}
        onConfirm={handleDeleteBusiness}
        onCancel={() => setDeletingBiz(null)}
      />
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
  headerRow: {
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
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.md
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF'
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
    marginTop: 4
  },
  bizCard: {
    marginBottom: spacing.sm,
    padding: spacing.md
  },
  bizRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  bizName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2
  },
  bizCat: {
    ...typography.caption,
    color: colors.textSecondary
  },
  ownerText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: spacing.xs
  },
  visibilityChip: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  visibilityText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46'
  },
  actionColumn: {
    flexDirection: 'column',
    gap: 6,
    marginLeft: spacing.sm
  },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.sm
  },
  actionBtnEditText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    marginLeft: 3
  },
  actionBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radii.sm
  },
  actionBtnDeleteText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.danger,
    marginLeft: 3
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md
  },
  modalCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    padding: spacing.lg,
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm
  },
  modalTitle: {
    ...typography.titleMedium,
    color: colors.textPrimary
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 4,
    marginTop: spacing.xs
  },
  modalInput: {
    backgroundColor: colors.bgMuted,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
    outlineStyle: 'none'
  },
  toggleOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF'
  },
  toggleOptionActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary
  },
  toggleOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary
  },
  toggleOptionTextActive: {
    color: colors.primary,
    fontWeight: '700'
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md
  }
});
