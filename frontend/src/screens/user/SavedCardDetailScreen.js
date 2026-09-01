import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  Phone,
  MessageSquare,
  MapPin,
  Mail,
  Globe,
  Share2,
  UserPlus,
  CreditCard,
  Image as ImageIcon
} from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { DetailScreenHeader } from '../../components/DetailScreenHeader';
import { useAuth } from '../../context/AuthContext';
import { fetchCardOriginalImageUrl, cardOriginalImagePath, apiClient } from '../../services/api';

function hasWhatsApp(phones) {
  const p = phones?.[0];
  return p && (p.is_whatsapp || p.isWhatsApp);
}

export function SavedCardDetailScreen({ card, onBack }) {
  const { user, token } = useAuth();
  const [viewMode, setViewMode] = useState('digital');
  const [originalImageUrl, setOriginalImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    let blobUrl = null;
    let cancelled = false;

    const loadImage = async () => {
      if (!card?.id || !token) {
        if (!cancelled) {
          setOriginalImageUrl(null);
          setImageLoading(false);
        }
        return;
      }

      setImageLoading(true);
      const path =
        card.original_card_image_url ||
        card.originalCardImageUrl ||
        cardOriginalImagePath(card.id);
      const url = await fetchCardOriginalImageUrl(path, token);
      blobUrl = url;
      if (!cancelled) {
        setOriginalImageUrl(url);
        setImageLoading(false);
      }
    };

    loadImage();

    return () => {
      cancelled = true;
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [card?.id, card.original_card_image_url, card.originalCardImageUrl, token]);

  const handleUploadOriginal = (file) => {
    if (!file || !card?.id || !token) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        await apiClient.uploadCardOriginalImage(card.id, ev.target.result, token);
        const url = await fetchCardOriginalImageUrl(cardOriginalImagePath(card.id), token);
        setOriginalImageUrl(url);
      } catch (err) {
        alert(err.message || 'Could not upload original card image.');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!card) return null;

  const phone = card.phones?.[0]?.raw || card.phone || '';
  const email = card.emails?.[0] || card.email || '';
  const gstin = card.gstin || card.gstin_number || '';
  const address = card.raw_address || card.rawAddress || '';

  const openMaps = () => {
    if (card.latitude && card.longitude) {
      window.open(`https://www.google.com/maps?q=${card.latitude},${card.longitude}`, '_blank');
    } else if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const saveContact = () => {
    const vcard = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `FN:${card.person_name || card.personName || card.company}`,
      card.company ? `ORG:${card.company}` : '',
      phone ? `TEL:${phone}` : '',
      email ? `EMAIL:${email}` : '',
      address ? `ADR:;;${address};;;;` : '',
      'END:VCARD'
    ].filter(Boolean).join('\n');
    const blob = new Blob([vcard], { type: 'text/vcard' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(card.person_name || card.company || 'contact').replace(/\s+/g, '_')}.vcf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <View style={styles.wrapper}>
      <DetailScreenHeader
        title={card.person_name || card.personName || 'Contact'}
        subtitle={card.company || card.company_name || ''}
        onBack={onBack}
      />
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
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
          <Text style={[styles.viewToggleText, viewMode === 'original' && styles.viewToggleTextActive]}>Original Card</Text>
        </TouchableOpacity>
      </View>

      {gstin ? <Text style={styles.gstinBanner}>GSTIN: {gstin}</Text> : null}

      {viewMode === 'digital' ? (
        <Card style={styles.digitalCard}>
          <View style={styles.digitalAccent} />
          <Text style={styles.digitalName}>{card.person_name || card.personName}</Text>
          {card.designation ? <Text style={styles.digitalRole}>{card.designation}</Text> : null}
          <Text style={styles.digitalCompany}>{card.company}</Text>
          <View style={styles.digitalDivider} />
          {phone ? (
            <View style={styles.digitalRow}>
              <Phone size={14} color={colors.primary} />
              <Text style={styles.digitalText}>{phone}</Text>
            </View>
          ) : null}
          {email ? (
            <View style={styles.digitalRow}>
              <Mail size={14} color={colors.primary} />
              <Text style={styles.digitalText}>{email}</Text>
            </View>
          ) : null}
          {address ? (
            <View style={styles.digitalRow}>
              <MapPin size={14} color={colors.primary} />
              <Text style={styles.digitalText}>{address}</Text>
            </View>
          ) : null}
          {gstin ? <Text style={styles.digitalGst}>GST: {gstin}</Text> : null}
        </Card>
      ) : (
        <View style={styles.originalWrap}>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files?.[0]) handleUploadOriginal(e.target.files[0]);
              e.target.value = '';
            }}
          />
          {imageLoading ? (
            <View style={styles.noImage}>
              <Text style={styles.noImageText}>Loading original card…</Text>
            </View>
          ) : originalImageUrl ? (
            <img src={originalImageUrl} alt="Original business card" style={styles.originalImg} />
          ) : (
            <View style={styles.noImage}>
              <ImageIcon size={40} color={colors.textMuted} />
              <Text style={styles.noImageText}>Original card image not saved yet</Text>
              <Button
                title={uploading ? 'Uploading…' : 'Upload Original Card'}
                variant="outline"
                size="sm"
                loading={uploading}
                onPress={() => fileInputRef.current && fileInputRef.current.click()}
                style={{ marginTop: spacing.md }}
              />
            </View>
          )}
        </View>
      )}

      <Button
        title={viewMode === 'digital' ? 'Switch to Original Card' : 'Switch to Digital Card'}
        variant="outline"
        onPress={() => setViewMode(viewMode === 'digital' ? 'original' : 'digital')}
        style={{ marginBottom: spacing.md }}
      />

      <View style={styles.actionsRow}>
        {phone ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => window.open(`tel:${phone}`)}>
            <Phone size={18} color={colors.primary} />
            <Text style={styles.actionLabel}>Call</Text>
          </TouchableOpacity>
        ) : null}
        {hasWhatsApp(card.phones) && phone ? (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => window.open(`https://wa.me/${phone.replace(/[^0-9+]/g, '')}`)}
          >
            <MessageSquare size={18} color="#059669" />
            <Text style={styles.actionLabel}>WhatsApp</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.actionBtn} onPress={saveContact}>
          <UserPlus size={18} color={colors.primary} />
          <Text style={styles.actionLabel}>Save Contact</Text>
        </TouchableOpacity>
        {address ? (
          <TouchableOpacity style={styles.actionBtn} onPress={openMaps}>
            <MapPin size={18} color={colors.primary} />
            <Text style={styles.actionLabel}>Maps</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => {
            if (navigator.share) {
              navigator.share({ title: card.company, text: `${card.person_name || card.personName} — ${phone}` });
            } else {
              navigator.clipboard.writeText(`${card.person_name || card.personName}\n${phone}\n${email}`);
              alert('Contact details copied.');
            }
          }}
        >
          <Share2 size={18} color={colors.primary} />
          <Text style={styles.actionLabel}>Share</Text>
        </TouchableOpacity>
      </View>

      <Card style={styles.detailsCard}>
        <Text style={styles.detailsTitle}>Business Details</Text>
        {address ? (
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Address</Text>
            <Text style={styles.detailValue}>{address}</Text>
          </View>
        ) : null}
        {email ? (
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Email</Text>
            <TouchableOpacity onPress={() => window.open(`mailto:${email}`)}>
              <Text style={[styles.detailValue, { color: colors.primary }]}>{email}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {(card.website) ? (
          <View style={styles.detailBlock}>
            <Text style={styles.detailLabel}>Website</Text>
            <TouchableOpacity onPress={() => window.open(card.website.startsWith('http') ? card.website : `https://${card.website}`)}>
              <Text style={[styles.detailValue, { color: colors.primary }]}>{card.website}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </Card>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: colors.bgMuted },
  container: { flex: 1, backgroundColor: colors.bgMuted },
  content: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  viewToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: spacing.md
  },
  viewToggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: radii.pill },
  viewToggleBtnActive: { backgroundColor: colors.primaryLight },
  viewToggleText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  viewToggleTextActive: { color: colors.primary, fontWeight: '700' },
  gstinBanner: { fontSize: 13, fontWeight: '600', color: colors.gold, marginBottom: spacing.md },
  digitalCard: {
    padding: spacing.lg,
    marginBottom: spacing.md,
    overflow: 'hidden',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary
  },
  digitalAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 80,
    height: 80,
    backgroundColor: colors.primaryLight,
    borderBottomLeftRadius: 80
  },
  digitalName: { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  digitalRole: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  digitalCompany: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: 6 },
  digitalDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  digitalRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  digitalText: { fontSize: 13, color: colors.textSecondary, flex: 1 },
  digitalGst: { fontSize: 12, fontWeight: '700', color: colors.primary, marginTop: spacing.sm },
  originalWrap: {
    backgroundColor: '#0F172A',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    alignItems: 'center',
    minHeight: 220
  },
  originalImg: { maxWidth: '100%', maxHeight: 360, objectFit: 'contain', borderRadius: radii.md },
  noImage: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  noImageText: { color: colors.textMuted, marginTop: spacing.sm, fontSize: 13 },
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    minWidth: 72
  },
  actionLabel: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, marginTop: 4 },
  detailsCard: { padding: spacing.lg },
  detailsTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginBottom: spacing.md },
  detailBlock: { marginBottom: spacing.sm },
  detailLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', marginBottom: 2 },
  detailValue: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 }
});
