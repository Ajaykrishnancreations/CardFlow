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
  QrCode
} from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Button } from '../../components/Button';

export function BusinessDetailsScreen({ business, onBack, onShowQr }) {
  const [showEnquiryModal, setShowEnquiryModal] = useState(false);
  const [enquiryMessage, setEnquiryMessage] = useState('');
  const [sharePhone, setSharePhone] = useState(true);
  const [enquirySent, setEnquirySent] = useState(false);

  if (!business) return null;

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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Business Header Card */}
        <Card style={styles.profileHeaderCard}>
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

            <TouchableOpacity style={styles.actionCircleBtn} onPress={() => window.open(`https://wa.me/${business.phone}`)}>
              <View style={[styles.actionCircle, { backgroundColor: '#ECFDF5' }]}>
                <MessageSquare size={18} color={colors.verifiedGst} />
              </View>
              <Text style={styles.actionLabel}>WhatsApp</Text>
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
      </ScrollView>

      {/* Send Enquiry Modal */}
      {showEnquiryModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Send Enquiry</Text>
              <TouchableOpacity onPress={() => setShowEnquiryModal(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {enquirySent ? (
              <View style={styles.successBox}>
                <CheckCircle2 size={40} color={colors.verifiedGst} />
                <Text style={styles.successTitle}>Enquiry Dispatched!</Text>
                <Text style={styles.successDesc}>The business owner has been notified via instant push.</Text>
              </View>
            ) : (
              <>
                <Text style={styles.enquiryToText}>To: <Text style={{ fontWeight: '700' }}>{business.name}</Text></Text>
                <TextInput
                  value={enquiryMessage}
                  onChangeText={setEnquiryMessage}
                  placeholder="Describe your requirement, quantity, or query (max 500 characters)..."
                  placeholderTextColor={colors.textMuted}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  style={styles.textArea}
                  autoFocus
                />

                <TouchableOpacity
                  style={styles.consentRow}
                  onPress={() => setSharePhone(!sharePhone)}
                >
                  <View style={[styles.checkbox, sharePhone && styles.checkboxChecked]}>
                    {sharePhone && <CheckCircle2 size={14} color="#FFFFFF" />}
                  </View>
                  <Text style={styles.consentText}>Share my verified phone number for faster reply</Text>
                </TouchableOpacity>

                <Button
                  title="Submit Enquiry"
                  onPress={handleSendEnquiry}
                  icon={Send}
                  size="md"
                  style={{ marginTop: spacing.md }}
                />
              </>
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
    backgroundColor: '#F8FAFC'
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  profileHeaderCard: {
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  logoRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: radii.md,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  bizName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary
  },
  bizCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2
  },
  gstin: {
    fontSize: 11,
    color: colors.textMuted,
    marginLeft: spacing.sm
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md
  },
  actionCircleBtn: {
    alignItems: 'center'
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
    fontWeight: '600',
    color: colors.textPrimary
  },
  digitalCardPreview: {
    backgroundColor: '#1E40AF',
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  digitalCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg
  },
  digitalOwnerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  digitalOwnerTitle: {
    fontSize: 12,
    color: '#BFDBFE',
    marginBottom: 4
  },
  digitalBizName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#93C5FD'
  },
  qrIconWrap: {
    padding: spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: radii.md
  },
  digitalCardBottom: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: spacing.sm
  },
  digitalCardPhone: {
    fontSize: 12,
    color: '#EFF6FF'
  },
  digitalCardUrl: {
    fontSize: 11,
    color: '#93C5FD',
    marginTop: 2
  },
  sectionCard: {
    marginBottom: spacing.md
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.sm
  },
  aboutText: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary
  },
  serviceChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  serviceChip: {
    backgroundColor: colors.primaryLight,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.sm,
    marginRight: spacing.sm,
    marginBottom: spacing.sm
  },
  serviceChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryDark
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    flex: 1
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    zIndex: 99
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: radii.lg,
    padding: spacing.xl
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
  enquiryToText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  textArea: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    height: 100,
    textAlignVertical: 'top',
    outlineStyle: 'none'
  },
  consentRow: {
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
  consentText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1
  },
  successBox: {
    alignItems: 'center',
    padding: spacing.xl
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginTop: spacing.md
  },
  successDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs
  }
});
