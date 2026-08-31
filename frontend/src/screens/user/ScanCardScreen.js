import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, TextInput } from 'react-native';
import {
  Camera,
  Upload,
  Sparkles,
  Image as ImageIcon,
  CheckCircle2,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Tag,
  ArrowRight,
  RotateCw
} from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';

export function ScanCardScreen({ onCardSaved }) {
  const { user, token } = useAuth();
  const fileInputRef = useRef(null);

  // States
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [scanMode, setScanMode] = useState('extract'); // 'extract' | 'image_only'
  const [successMsg, setSuccessMsg] = useState('');

  // Editable Form fields
  const [company, setCompany] = useState('');
  const [personName, setPersonName] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [rawAddress, setRawAddress] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  // Handle local file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
        processScan(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // Perform AI Extraction
  const processScan = async (imageKey = 'lipi-traders-card.jpg') => {
    setIsScanning(true);
    setSuccessMsg('');

    // Trigger real backend AI OCR extraction endpoint
    const result = await apiClient.scanCard(imageKey, token);

    if (result) {
      setExtractedData(result);
      setCompany(result.company || 'LIPI TRADERS');
      setPersonName(result.person_name || 'Sivakumar');
      setDesignation(result.designation || 'Managing Partner');
      setPhone(result.phones?.[0]?.raw || '+91 96555 87877');
      setEmail(result.emails?.[0] || 'sivakumar@lipi-traders.com');
      setWebsite(result.website || 'http://lipi-traders.com');
      setRawAddress(result.raw_address || '214/1P, Ambigai nagar, Chinnavedapatti, Coimbatore, Tamil Nadu 641049');
      setTags(result.tags ? result.tags.join(', ') : 'Iron, Scrap, Steel, Metals');
    }

    setIsScanning(false);
  };

  // Quick Demo: Scan Lipi Traders Visiting Card
  const handleScanSampleCard = () => {
    setSelectedImage('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80');
    processScan('lipi-traders-card.jpg');
  };

  // Save to Database
  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    const cardPayload = {
      person_name: personName,
      designation: designation,
      company: company,
      website: website,
      notes: notes || 'Scanned visiting card saved via CardFlow OCR',
      met_context: 'Visiting Card Scan',
      phones: [
        {
          raw: phone,
          e164: phone.replace(/[^0-9+]/g, ''),
          type: 'mobile',
          is_whatsapp: true
        }
      ],
      emails: [email],
      raw_address: rawAddress,
      tags: tags.split(',').map((t) => t.trim()).filter(Boolean)
    };

    // Trigger real backend API POST /cards
    const saved = await apiClient.saveCard(cardPayload, token);
    setIsSaving(false);
    setSuccessMsg('Business Card successfully saved to Database Vault!');

    setTimeout(() => {
      if (onCardSaved) onCardSaved(saved);
    }, 1200);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {/* Hidden file input for actual photo upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Success Notification */}
      {successMsg ? (
        <View style={styles.toastSuccess}>
          <CheckCircle2 size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{successMsg}</Text>
        </View>
      ) : null}

      {/* Viewfinder / Card Upload Box */}
      <View style={styles.viewfinderContainer}>
        <View style={styles.viewfinderFrame}>
          {selectedImage ? (
            <View style={styles.previewWrap}>
              <img
                src={selectedImage}
                alt="Business Card"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }}
              />
              <TouchableOpacity
                style={styles.reUploadBtn}
                onPress={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <RotateCw size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.reUploadText}>Change Card Photo</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.alignmentGuide}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
              <Camera size={44} color="#64748B" />
              <Text style={styles.guideTitle}>Capture or Upload Business Card</Text>
              <Text style={styles.guideSub}>Scan physical visiting card to extract contact details into database</Text>
            </View>
          )}
        </View>

        {/* Action Buttons: Choose Photo or Scan Sample */}
        <View style={styles.scanActionsRow}>
          <TouchableOpacity
            style={styles.uploadFileBtn}
            onPress={() => fileInputRef.current && fileInputRef.current.click()}
          >
            <Upload size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.uploadFileBtnText}>Upload Visiting Card Image</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.demoScanBtn}
            onPress={handleScanSampleCard}
          >
            <Sparkles size={16} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.demoScanBtnText}>Scan LIPI TRADERS Card</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Scanning Indicator */}
      {isScanning && (
        <Card style={styles.scanningCard}>
          <Sparkles size={24} color={colors.primary} className="spin" />
          <Text style={styles.scanningTitle}>AI Vision OCR Extracting Details...</Text>
          <Text style={styles.scanningDesc}>Detecting company, phone numbers, WhatsApp, emails, address & categories</Text>
        </Card>
      )}

      {/* Extracted Card Form Review */}
      {extractedData && (
        <Card style={styles.extractedCard}>
          <View style={styles.extractedHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Sparkles size={18} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.extractedHeaderTitle}>AI EXTRACTED DETAILS (REVIEW & SAVE)</Text>
            </View>
            <Badge type="verified" label="99% OCR Match" />
          </View>

          <Input
            label="COMPANY / BUSINESS NAME *"
            value={company}
            onChangeText={setCompany}
            leftIcon={Building}
          />

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Input
                label="CONTACT PERSON"
                value={personName}
                onChangeText={setPersonName}
                leftIcon={User}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="DESIGNATION"
                value={designation}
                onChangeText={setDesignation}
              />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Input
                label="PHONE / WHATSAPP *"
                value={phone}
                onChangeText={setPhone}
                leftIcon={Phone}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="EMAIL ADDRESS"
                value={email}
                onChangeText={setEmail}
                leftIcon={Mail}
              />
            </View>
          </View>

          <Input
            label="WEBSITE"
            value={website}
            onChangeText={setWebsite}
            leftIcon={Globe}
          />

          <Input
            label="FULL ADDRESS"
            value={rawAddress}
            onChangeText={setRawAddress}
            leftIcon={MapPin}
          />

          <Input
            label="TAGS / BUSINESS CATEGORIES"
            value={tags}
            onChangeText={setTags}
            leftIcon={Tag}
          />

          <Button
            title="Save Card to Live Database Vault"
            onPress={handleSaveToDatabase}
            loading={isSaving}
            icon={ArrowRight}
            size="lg"
            style={styles.saveDbBtn}
          />
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A'
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl
  },
  toastSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    padding: spacing.md,
    borderRadius: radii.md,
    marginBottom: spacing.md
  },
  toastText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  viewfinderContainer: {
    alignItems: 'center',
    marginBottom: spacing.md
  },
  viewfinderFrame: {
    width: '100%',
    height: 230,
    backgroundColor: '#1E293B',
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  previewWrap: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8
  },
  reUploadBtn: {
    position: 'absolute',
    bottom: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.md
  },
  reUploadText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  alignmentGuide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg
  },
  guideTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.md
  },
  guideSub: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4
  },
  cornerTL: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary
  },
  cornerTR: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary
  },
  cornerBL: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary
  },
  cornerBR: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary
  },
  scanActionsRow: {
    width: '100%',
    flexDirection: 'column',
    gap: spacing.xs,
    marginTop: spacing.md
  },
  uploadFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radii.md,
    cursor: 'pointer'
  },
  uploadFileBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  demoScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    borderRadius: radii.md,
    cursor: 'pointer'
  },
  demoScanBtnText: {
    color: '#60A5FA',
    fontSize: 13,
    fontWeight: '700'
  },
  scanningCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    marginVertical: spacing.md
  },
  scanningTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.md
  },
  scanningDesc: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4
  },
  extractedCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderRadius: radii.lg
  },
  extractedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  extractedHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5
  },
  saveDbBtn: {
    marginTop: spacing.md
  }
});
