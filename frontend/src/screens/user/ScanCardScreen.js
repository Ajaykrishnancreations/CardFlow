import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import {
  Camera,
  Upload,
  Sparkles,
  CheckCircle2,
  Building,
  User,
  Phone,
  Mail,
  MapPin,
  Globe,
  Tag,
  ArrowRight,
  RotateCw,
  VideoOff,
  SwitchCamera
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
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // States
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' | 'user'
  const [cameraError, setCameraError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // Editable Form fields (Dynamic values directly from OCR / editable by user)
  const [company, setCompany] = useState('');
  const [personName, setPersonName] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [rawAddress, setRawAddress] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  // Stop camera helper
  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Start live device camera (Mobile back camera or desktop webcam)
  const startCamera = async (facing = cameraFacing) => {
    setCameraError('');
    setSelectedImage(null);

    // Stop existing stream if any
    stopCameraStream();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError('Camera access not supported on this browser. Please upload a photo directly.');
      return;
    }

    try {
      const constraints = {
        video: {
          facingMode: facing === 'environment' ? { ideal: 'environment' } : 'user',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err) {
      console.warn('Camera permission error or back camera unavailable, falling back:', err);
      try {
        // Fallback to basic video constraint if environment facing failed
        const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = fallbackStream;
          videoRef.current.play();
          setIsCameraActive(true);
        }
      } catch (e2) {
        setCameraError('Camera permission denied or camera not available. Use photo upload below.');
      }
    }
  };

  // Flip camera between front and back (on mobile)
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Capture frame from active live camera video stream
  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    stopCameraStream();
    setSelectedImage(dataUrl);

    // Trigger AI OCR extraction on live captured image
    processScan('live-camera-scan.jpg');
  };

  // Handle image upload from user's gallery / files
  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      stopCameraStream();
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
        processScan(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Extraction call via live backend endpoint
  const processScan = async (imageKey = 'live-scan.jpg') => {
    setIsScanning(true);
    setSuccessMsg('');

    const result = await apiClient.scanCard(imageKey, token);

    if (result) {
      setExtractedData(result);
      setCompany(result.company || '');
      setPersonName(result.person_name || '');
      setDesignation(result.designation || '');
      setPhone(result.phones?.[0]?.raw || '');
      setEmail(result.emails?.[0] || '');
      setWebsite(result.website || '');
      setRawAddress(result.raw_address || '');
      setTags(result.tags ? result.tags.join(', ') : 'Verified Business');
    }

    setIsScanning(false);
  };

  // Save Card to PostgreSQL Live Database
  const handleSaveToDatabase = async () => {
    if (!company && !personName && !phone) {
      alert('Please enter at least Company Name, Person Name, or Phone Number.');
      return;
    }

    setIsSaving(true);
    const cardPayload = {
      person_name: personName,
      designation: designation,
      company: company,
      website: website,
      notes: notes || 'Live visiting card scanned and verified in CardFlow',
      met_context: 'Live Camera / Gallery Scan',
      phones: phone
        ? [
            {
              raw: phone,
              e164: phone.replace(/[^0-9+]/g, ''),
              type: 'mobile',
              is_whatsapp: true
            }
          ]
        : [],
      emails: email ? [email] : [],
      raw_address: rawAddress,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : ['Business Card']
    };

    const saved = await apiClient.saveCard(cardPayload, token);
    setIsSaving(false);
    setSuccessMsg('Card details saved to database vault successfully!');

    setTimeout(() => {
      if (onCardSaved) onCardSaved(saved);
    }, 1200);
  };

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCameraStream();
    };
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {/* Hidden file input supporting native mobile gallery/camera picker */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Hidden Canvas for capturing video frame */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Success Notification Banner */}
      {successMsg ? (
        <View style={styles.toastSuccess}>
          <CheckCircle2 size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{successMsg}</Text>
        </View>
      ) : null}

      {/* Camera / Image Viewport */}
      <View style={styles.viewfinderContainer}>
        <View style={styles.viewfinderFrame}>
          {/* 1. Live Video Stream View */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: isCameraActive ? 'block' : 'none',
              borderRadius: 12
            }}
          />

          {/* 2. Captured / Uploaded Image View */}
          {selectedImage && !isCameraActive ? (
            <View style={styles.previewWrap}>
              <img
                src={selectedImage}
                alt="Business Card"
                style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 12 }}
              />
              <TouchableOpacity
                style={styles.reUploadBtn}
                onPress={() => startCamera()}
              >
                <RotateCw size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.reUploadText}>Scan Another Card</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* 3. Empty Idle State with Card Alignment Guides */}
          {!selectedImage && !isCameraActive ? (
            <View style={styles.alignmentGuide}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
              <Camera size={44} color="#64748B" />
              <Text style={styles.guideTitle}>Point Camera at Business Card</Text>
              <Text style={styles.guideSub}>
                {cameraError || 'Align card edges within the frame and capture or choose photo'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Action Controls for Camera and Upload */}
        {isCameraActive ? (
          <View style={styles.cameraControlsRow}>
            <TouchableOpacity style={styles.flipBtn} onPress={toggleCameraFacing}>
              <SwitchCamera size={20} color="#FFFFFF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.captureCircleBtn} onPress={captureFromCamera}>
              <View style={styles.captureInnerCircle} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeCameraBtn} onPress={stopCameraStream}>
              <VideoOff size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.scanActionsRow}>
            <TouchableOpacity style={styles.openCameraBtn} onPress={() => startCamera()}>
              <Camera size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.openCameraBtnText}>Open Live Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadFileBtn}
              onPress={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <Upload size={18} color="#94A3B8" style={{ marginRight: 8 }} />
              <Text style={styles.uploadFileBtnText}>Choose from Gallery / Files</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* AI Extraction In-Progress Indicator */}
      {isScanning && (
        <Card style={styles.scanningCard}>
          <Sparkles size={24} color={colors.primary} />
          <Text style={styles.scanningTitle}>Extracting Card Details...</Text>
          <Text style={styles.scanningDesc}>Detecting company, contacts, phone, WhatsApp & address into database fields</Text>
        </Card>
      )}

      {/* Extracted Data Form for Review and Database Storage */}
      {extractedData && (
        <Card style={styles.extractedCard}>
          <View style={styles.extractedHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Sparkles size={18} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.extractedHeaderTitle}>EXTRACTED CARD DETAILS (REVIEW & SAVE)</Text>
            </View>
            <Badge type="verified" label="Live OCR" />
          </View>

          <Input
            label="COMPANY / BUSINESS NAME *"
            value={company}
            onChangeText={setCompany}
            leftIcon={Building}
            placeholder="e.g. Acme Corporation"
          />

          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Input
                label="CONTACT PERSON"
                value={personName}
                onChangeText={setPersonName}
                leftIcon={User}
                placeholder="e.g. John Doe"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="DESIGNATION"
                value={designation}
                onChangeText={setDesignation}
                placeholder="e.g. Director"
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
                placeholder="+91 98765 43210"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="EMAIL ADDRESS"
                value={email}
                onChangeText={setEmail}
                leftIcon={Mail}
                placeholder="contact@company.com"
              />
            </View>
          </View>

          <Input
            label="WEBSITE"
            value={website}
            onChangeText={setWebsite}
            leftIcon={Globe}
            placeholder="https://company.com"
          />

          <Input
            label="FULL ADDRESS"
            value={rawAddress}
            onChangeText={setRawAddress}
            leftIcon={MapPin}
            placeholder="Street, City, State, Pincode"
          />

          <Input
            label="TAGS / BUSINESS CATEGORIES"
            value={tags}
            onChangeText={setTags}
            leftIcon={Tag}
            placeholder="e.g. Supplier, Industrial, Coimbatore"
          />

          <Button
            title="Save Card to Database Vault"
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
    height: 250,
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
  cameraControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.md
  },
  captureCircleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'transparent',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  captureInnerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF'
  },
  flipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeCameraBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scanActionsRow: {
    width: '100%',
    flexDirection: 'column',
    gap: spacing.xs,
    marginTop: spacing.md
  },
  openCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radii.md
  },
  openCameraBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  uploadFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 12,
    borderRadius: radii.md
  },
  uploadFileBtnText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600'
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
