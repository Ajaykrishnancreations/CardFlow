import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import {
  Phone,
  MessageSquare,
  Navigation,
  Share2,
  Mail,
  Globe,
  Clock,
  MapPin,
  Building2,
  ShieldCheck,
  Send,
  X,
  CheckCircle2,
  QrCode,
  BookmarkCheck,
  Bookmark
} from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';
import { DetailScreenHeader } from '../../components/DetailScreenHeader';
import { useAuth } from '../../context/AuthContext';

export function BusinessDetailsScreen({ business, onBack, onShowQr }) {
  const { isBusinessSaved, saveBusinessToVault } = useAuth();
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [viewMode, setViewMode] = useState('digital');
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [sharePhone, setSharePhone] = useState(true);
  const [enquirySent, setEnquirySent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!business) return null;

  const cardImageUrl = business.card_image_url || business.cardImageUrl;
  const whatsappNumber = business.whatsapp || business.phone;
  const showWhatsApp = !!(business.whatsapp || business.hasWhatsApp);

  const isSaved = isBusinessSaved(business);

  const handleSaveToVault = async () => {
    if (isSaved || isSaving) return;
    setIsSaving(true);
    await saveBusinessToVault(business);
    setIsSaving(false);
  };

  const handleSendEnquiry = () => {
    if (!enquiryMessage.trim()) return;
    setEnquirySent(true);
    setTimeout(() => {
      setEnquirySent(false);
      setShowEnquiryModal(false);
      setEnquiryMessage('');
    }, 1500);
  };

  const handleShare = () => {
    const shareUrl = `https://cardflow.app/b/${business.slug}`;
    if (navigator.share) {
      navigator.share({
        title: business.name,
        text: `Check out ${business.name} on CardFlow:`,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      alert(`Public link copied to clipboard: ${shareUrl}`);
    }
  };

  return (
    <View style={styles.container}>
      <DetailScreenHeader
        title={business.name}
        subtitle={business.category}
        onBack={onBack}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Digital / Original Card Toggle */}
        <View style={styles.viewToggleRow}>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'digital' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('digital')}
          >
            <Text style={[styles.viewToggleText, viewMode === 'digital' && styles.viewToggleTextActive]}>Digital Card</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewToggleBtn, viewMode === 'original' && styles.viewToggleBtnActive]}
            onPress={() => setViewMode('original')}
          >
            <Text style={[styles.viewToggleText, viewMode === 'original' && styles.viewToggleTextActive]}>Original</Text>
          </TouchableOpacity>
        </View>

        {viewMode === 'original' && cardImageUrl ? (
          <View style={styles.originalCardWrap}>
            <img src={cardImageUrl} alt={`${business.name} business card`} style={styles.originalCardImg} />
          </View>
        ) : null}

        {/* Business Header Card */}
        <Card style={styles.profileHeaderCard}>
          {isSaved && (
            <View style={styles.savedBadgeTop}>
              <BookmarkCheck size={14} color="#059669" style={{ marginRight: 4 }} />
              <Text style={styles.savedBadgeText}>SAVED IN VAULT</Text>
            </View>
          )}

          <View style={styles.logoRow}>
            <View style={styles.logoBadge}>
              <Building2 size={32} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.bizName}>{business.name}</Text>
              <Text style={styles.bizCategory}>{business.category} • Est. {business.yearEstablished || 2015}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <Badge type="gst" label="GST Verified" />
                <Text style={styles.gstin}>{business.gstin}</Text>
              </View>
            </View>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionCircleBtn} onPress={() => window.open(`tel:${business.phone}`)}>
              <View style={[styles.actionCircle, { backgroundColor: colors.primaryLight }]}>
                <Phone size={18} color={colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Call</Text>
            </TouchableOpacity>

            {showWhatsApp ? (
            <TouchableOpacity style={styles.actionCircleBtn} onPress={() => window.open(`https://wa.me/${whatsappNumber.replace(/[^0-9+]/g, '')}`)}>
              <View style={[styles.actionCircle, { backgroundColor: '#ECFDF5' }]}>
                <MessageSquare size={18} color={colors.verifiedGst} />
              </View>
              <Text style={styles.actionLabel}>WhatsApp</Text>
            </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.actionCircleBtn}
              onPress={handleSaveToVault}
              disabled={isSaved || isSaving}
            >
              <View style={[styles.actionCircle, { backgroundColor: isSaved ? '#ECFDF5' : '#F1F5F9' }]}>
                {isSaved ? (
                  <BookmarkCheck size={18} color="#059669" />
                ) : (
                  <Bookmark size={18} color={colors.primary} />
                )}
              </View>
              <Text style={[styles.actionLabel, isSaved && { color: '#059669', fontWeight: '700' }]}>
                {isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCircleBtn} onPress={() => setShowEnquiryModal(true)}>
              <View style={[styles.actionCircle, { backgroundColor: '#EFF6FF' }]}>
                <Mail size={18} color={colors.secondary} />
              </View>
              <Text style={styles.actionLabel}>Enquire</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCircleBtn}
              onPress={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(business.address)}`)}
            >
              <View style={[styles.actionCircle, { backgroundColor: colors.bgMuted }]}>
                <Navigation size={18} color={colors.textSecondary} />
              </View>
              <Text style={styles.actionLabel}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCircleBtn} onPress={handleShare}>
              <View style={[styles.actionCircle, { backgroundColor: '#FEF3C7' }]}>
                <Share2 size={18} color={colors.warning} />
              </View>
              <Text style={styles.actionLabel}>Share</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Digital Business Card Studio Preview */}
        <Card style={styles.digitalCardPreview}>
          <View style={styles.digitalCardTop}>
            <View>
              <Text style={styles.digitalOwnerName}>{business.digitalCard?.ownerName || 'Business Owner'}</Text>
              <Text style={styles.digitalOwnerTitle}>{business.digitalCard?.title || 'Proprietor'}</Text>
              <Text style={styles.digitalBizName}>{business.name}</Text>
            </View>
            <TouchableOpacity onPress={onShowQr} style={styles.qrIconWrap}>
              <QrCode size={36} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <View style={styles.digitalCardBottom}>
            <Text style={styles.digitalCardPhone}>{business.phone} • {business.email}</Text>
            <Text style={styles.digitalCardUrl}>cardflow.app/b/{business.slug}</Text>
          </View>
        </Card>

        {/* About Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>About Business</Text>
          <Text style={styles.aboutText}>{business.description}</Text>
        </Card>

        {/* Services / Products Section */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Products & Services</Text>
          <View style={styles.serviceChipsWrap}>
            {business.services.map((svc, idx) => (
              <View key={idx} style={styles.serviceChip}>
                <Text style={styles.serviceChipText}>{svc}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Location & Hours */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Location & Hours</Text>

          <View style={styles.infoRow}>
            <MapPin size={18} color={colors.primary} style={{ marginRight: spacing.sm, marginTop: 2 }} />
            <Text style={styles.infoText}>{business.address}</Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm, marginTop: 2 }} />
            <Text style={styles.infoText}>{business.hours}</Text>
          </View>

          <View style={styles.infoRow}>
            <Globe size={18} color={colors.textSecondary} style={{ marginRight: spacing.sm, marginTop: 2 }} />
            <Text style={[styles.infoText, { color: colors.primary }]}>{business.website}</Text>
          </View>
        </Card>

        {/* Verification & Trust */}
        <Card style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Trust & Verification</Text>
          <View style={styles.trustRow}>
            <ShieldCheck size={20} color={colors.verifiedGst} style={{ marginRight: spacing.sm }} />
            <View>
              <Text style={styles.trustTitle}>Govt. GSTIN Verified Listing</Text>
              <Text style={styles.trustSub}>Verified on GST Portal • Active Status</Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Direct Enquiry Modal Sheet */}
      {showEnquiryModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Enquire with {business.name}</Text>
              <TouchableOpacity onPress={() => setShowEnquiryModal(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {enquirySent ? (
              <View style={styles.enquirySuccess}>
                <CheckCircle2 size={44} color={colors.success} style={{ marginBottom: spacing.sm }} />
                <Text style={styles.successTitle}>Enquiry Sent!</Text>
                <Text style={styles.successSub}>The business owner has been notified via WhatsApp and SMS.</Text>
              </View>
            ) : (
              <View style={styles.modalBody}>
                <Text style={styles.inputLabel}>What product or service are you looking for?</Text>
                <TextInput
                  style={styles.textArea}
                  placeholder="e.g. Need quotation for 500 units of custom CNC shafts by next week..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  value={enquiryMessage}
                  onChangeText={setEnquiryMessage}
                  autoFocus
                />

                <TouchableOpacity
                  style={styles.sharePhoneRow}
                  onPress={() => setSharePhone(!sharePhone)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, sharePhone && styles.checkboxChecked]}>
                    {sharePhone && <CheckCircle2 size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.sharePhoneLabel}>Share my verified phone number for faster reply</Text>
                </TouchableOpacity>

                <Button
                  title="Send Direct Business Enquiry"
                  onPress={handleSendEnquiry}
                  icon={Send}
                  size="lg"
                  style={{ marginTop: spacing.md }}
                />
              </View>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgMuted
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxxl
  },
  viewToggleRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgMuted,
    borderRadius: radii.full,
    padding: 4,
    marginBottom: spacing.md
  },
  viewToggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radii.full
  },
  viewToggleBtnActive: {
    backgroundColor: '#FFFFFF',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  viewToggleText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  viewToggleTextActive: { color: colors.primary, fontWeight: '700' },
  originalCardWrap: {
    backgroundColor: '#0F172A',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center'
  },
  originalCardImg: { maxWidth: '100%', maxHeight: 280, objectFit: 'contain', borderRadius: radii.md },
  profileHeaderCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    position: 'relative'
  },
  savedBadgeTop: {
    position: 'absolute',
    top: 14,
    right: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.full,
    zIndex: 10
  },
  savedBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: radii.lg,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  bizName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary
  },
  bizCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  gstin: {
    fontSize: 12,
    color: colors.gold,
    marginLeft: spacing.sm,
    fontWeight: '600'
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md
  },
  actionCircleBtn: {
    alignItems: 'center',
    width: 52
  },
  actionCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  actionLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  digitalCardPreview: {
    backgroundColor: '#1E293B',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 0
  },
  digitalCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg
  },
  digitalOwnerName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700'
  },
  digitalOwnerTitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2
  },
  digitalBizName: {
    color: colors.gold,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6
  },
  qrIconWrap: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: radii.md
  },
  digitalCardBottom: {
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: spacing.sm,
    flexDirection: 'column',
    gap: 4
  },
  digitalCardPhone: {
    color: '#CBD5E1',
    fontSize: 11,
    flex: 1,
    marginRight: spacing.sm
  },
  digitalCardUrl: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '600'
  },
  sectionCard: {
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  aboutText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20
  },
  serviceChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs
  },
  serviceChip: {
    backgroundColor: colors.bgMuted,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.md
  },
  serviceChipText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500'
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm
  },
  infoText: {
    fontSize: 13,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  trustTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary
  },
  trustSub: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 1
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 100
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    padding: spacing.lg,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary
  },
  modalBody: {},
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 100,
    outlineStyle: 'none'
  },
  sharePhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    backgroundColor: '#FFFFFF'
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
    borderColor: colors.primary
  },
  sharePhoneLabel: {
    fontSize: 12,
    color: colors.textSecondary
  },
  enquirySuccess: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  successSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center'
  }
});
