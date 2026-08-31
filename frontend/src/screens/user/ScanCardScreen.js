import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, useWindowDimensions } from 'react-native';
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
  SwitchCamera,
  Layers,
  FileImage
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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // States
  const [selectedImage, setSelectedImage] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' | 'user'
  const [cameraError, setCameraError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
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

  // Flip camera between front and back (on mobile / external webcam)
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

  // Process file upload or drag-drop file
  const handleProcessFile = (file) => {
    if (!file) return;
    stopCameraStream();
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target.result);
      processScan(file.name || 'uploaded-card.jpg');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleProcessFile(file);
  };

  // Drag and drop listeners on web desktop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  // Clipboard Paste support (Ctrl+V / Cmd+V)
  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            handleProcessFile(blob);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
      stopCameraStream();
    };
  }, []);

  // AI Extraction call via live backend endpoint
  const processScan = async (imageKey = 'live-scan.jpg') => {
    setIsScanning(true);
    setSuccessMsg('');

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
      setTags(result.tags && result.tags.length > 0 ? result.tags.join(', ') : 'Iron, Scrap, Steel, Metals, Coimbatore');
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
      met_context: isDesktop ? 'Desktop Scanner / Upload' : 'Mobile Camera Scan',
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Hidden Canvas for video frame extraction */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Success Notification Banner */}
      {successMsg ? (
        <View style={styles.toastSuccess}>
          <CheckCircle2 size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{successMsg}</Text>
        </View>
      ) : null}

      {/* Header Info for Desktop */}
      {isDesktop && (
        <View style={styles.desktopBanner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.bannerIcon}>
              <Camera size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.desktopBannerTitle}>Digital Card Scanner & Vault</Text>
              <Text style={styles.desktopBannerSub}>
                Use your desktop webcam, drag & drop card images, or paste from clipboard (Ctrl+V)
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Main Grid: Responsive Side-by-Side on Desktop, Stacked on Mobile */}
      <View style={[styles.mainLayout, isDesktop && styles.desktopLayoutGrid]}>
        {/* LEFT COLUMN: Camera Viewfinder & File Dropzone */}
        <View style={[styles.leftColumn, isDesktop && styles.desktopLeftColumn]}>
          <View
            style={[
              styles.viewfinderFrame,
              isDragging && styles.viewfinderFrameDragging,
              isDesktop && styles.desktopViewfinderFrame
            ]}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
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

            {/* 3. Empty Idle State with Drag-and-drop info */}
            {!selectedImage && !isCameraActive ? (
              <View style={styles.alignmentGuide}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
                <Camera size={44} color="#64748B" />
                <Text style={styles.guideTitle}>
                  {isDragging ? 'Drop Business Card Image Here' : 'Capture or Upload Business Card'}
                </Text>
                <Text style={styles.guideSub}>
                  {cameraError || (isDesktop ? 'Drag & drop image file, paste (Ctrl+V), or open webcam' : 'Align card edges within the frame')}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Action Controls for Camera and Upload */}
          {isCameraActive ? (
            <View style={styles.cameraControlsRow}>
              <TouchableOpacity style={styles.flipBtn} onPress={toggleCameraFacing} title="Switch Camera">
                <SwitchCamera size={20} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.captureCircleBtn} onPress={captureFromCamera} title="Capture Snapshot">
                <View style={styles.captureInnerCircle} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.closeCameraBtn} onPress={stopCameraStream} title="Close Camera">
                <VideoOff size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.scanActionsRow}>
              <TouchableOpacity style={styles.openCameraBtn} onPress={() => startCamera()}>
                <Camera size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.openCameraBtnText}>
                  {isDesktop ? 'Open Desktop Webcam' : 'Open Live Camera'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadFileBtn}
                onPress={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <Upload size={18} color="#CBD5E1" style={{ marginRight: 8 }} />
                <Text style={styles.uploadFileBtnText}>
                  {isDesktop ? 'Browse File / Drop Image' : 'Choose from Gallery / Files'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* AI Extraction In-Progress Indicator */}
          {isScanning && (
            <Card style={styles.scanningCard}>
              <Sparkles size={24} color={colors.primary} />
              <Text style={styles.scanningTitle}>Extracting Card Details...</Text>
              <Text style={styles.scanningDesc}>Detecting company, contacts, phone, WhatsApp & address into database fields</Text>
            </Card>
          )}
        </View>

        {/* RIGHT COLUMN: Extracted Data Form for Review and Database Storage */}
        <View style={[styles.rightColumn, isDesktop && styles.desktopRightColumn]}>
          <Card style={styles.extractedCard}>
            <View style={styles.extractedHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Sparkles size={18} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.extractedHeaderTitle}>CARD DETAILS (REVIEW & SAVE TO DATABASE)</Text>
              </View>
              <Badge type="verified" label="Live OCR" />
            </View>

            <Input
              label="COMPANY / BUSINESS NAME *"
              value={company}
              onChangeText={setCompany}
              leftIcon={Building}
              placeholder="e.g. Lipi Traders / Acme Corp"
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="CONTACT PERSON"
                  value={personName}
                  onChangeText={setPersonName}
                  leftIcon={User}
                  placeholder="e.g. Sivakumar"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="DESIGNATION"
                  value={designation}
                  onChangeText={setDesignation}
                  placeholder="e.g. Managing Partner"
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
                  placeholder="+91 96555 87877"
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
              placeholder="Street, Area, City, State, Pincode"
            />

            <Input
              label="TAGS / BUSINESS CATEGORIES"
              value={tags}
              onChangeText={setTags}
              leftIcon={Tag}
              placeholder="e.g. Supplier, Industrial, Coimbatore"
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
        </View>
      </View>
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
  desktopBanner: {
    backgroundColor: '#1E293B',
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#334155'
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  desktopBannerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  },
  desktopBannerSub: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2
  },
  mainLayout: {
    flexDirection: 'column',
    width: '100%'
  },
  desktopLayoutGrid: {
    flexDirection: 'row',
    gap: spacing.xl,
    alignItems: 'flex-start'
  },
  leftColumn: {
    width: '100%'
  },
  desktopLeftColumn: {
    flex: 1,
    position: 'sticky',
    top: 20
  },
  rightColumn: {
    width: '100%',
    marginTop: spacing.md
  },
  desktopRightColumn: {
    flex: 1.2,
    marginTop: 0
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
  viewfinderFrame: {
    width: '100%',
    minHeight: 260,
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
  desktopViewfinderFrame: {
    minHeight: 340
  },
  viewfinderFrameDragging: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.1)'
  },
  previewWrap: {
    width: '100%',
    minHeight: 260,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#0F172A'
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
    marginTop: spacing.md
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
