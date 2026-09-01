import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
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
} from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { extractCardWithTesseract } from '../../utils/ocrParser';
import { DetailScreenHeader } from '../../components/DetailScreenHeader';

function applyExtractionToForm(data, setters) {
  if (!data) return;
  const {
    setExtractedData, setCompany, setPersonName, setDesignation,
    setPhone, setEmail, setWebsite, setRawAddress, setGstin, setTags
  } = setters;
  setExtractedData(data);
  setCompany(data.company || '');
  setPersonName(data.person_name || '');
  setDesignation(data.designation || '');
  setPhone(data.phones?.[0]?.raw || '');
  setEmail(data.emails?.[0] || '');
  setWebsite((data.website || '').replace(/^https?:\/\//, ''));
  setRawAddress(data.raw_address || '');
  setGstin(data.gstin || '');
  setTags(Array.isArray(data.tags) ? data.tags.join(', ') : 'Business Card');
}

export function ScanCardScreen({ onCardSaved, onBack }) {
  const { user, token, loadUserVault } = useAuth();
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
  const [scanStatusText, setScanStatusText] = useState('AI Vision OCR Scanning...');
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [imageRotation, setImageRotation] = useState(0);

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
  const [gstin, setGstin] = useState('');

  // Stop camera helper
  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Start live device camera
  const startCamera = async (facing = cameraFacing) => {
    setCameraError('');
    setSelectedImage(null);
    setImageRotation(0);
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
      console.warn('Camera error, fallback to default:', err);
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

  // Flip camera
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  // Capture frame from live camera video stream (Exact Viewfinder Crop)
  const captureFromCamera = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    const vWidth = video.videoWidth || 1280;
    const vHeight = video.videoHeight || 720;

    const elemRect = video.getBoundingClientRect ? video.getBoundingClientRect() : { width: 360, height: 200 };
    const elWidth = elemRect.width || 360;
    const elHeight = elemRect.height || 200;

    const scale = Math.max(elWidth / vWidth, elHeight / vHeight);
    const visibleWidthInVideo = Math.min(vWidth, elWidth / scale);
    const visibleHeightInVideo = Math.min(vHeight, elHeight / scale);

    const cropX = Math.max(0, (vWidth - visibleWidthInVideo) / 2);
    const cropY = Math.max(0, (vHeight - visibleHeightInVideo) / 2);

    canvas.width = visibleWidthInVideo;
    canvas.height = visibleHeightInVideo;

    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      video,
      cropX, cropY, visibleWidthInVideo, visibleHeightInVideo,
      0, 0, visibleWidthInVideo, visibleHeightInVideo
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCameraStream();
    setSelectedImage(dataUrl);
    setImageRotation(0);

    processScan(dataUrl);
  };

  // Process file upload or drag-drop file (handles Portrait & Landscape)
  const handleProcessFile = (file) => {
    if (!file) return;
    stopCameraStream();
    const reader = new FileReader();
    reader.onload = (event) => {
      const imgData = event.target.result;
      setSelectedImage(imgData);
      setImageRotation(0);
      processScan(imgData);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleProcessFile(file);
  };

  // Rotate image by 90 degrees if user uploaded sideways
  const handleRotateImage = () => {
    if (!selectedImage) return;
    const nextRotation = (imageRotation + 90) % 360;
    setImageRotation(nextRotation);

    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (nextRotation === 90 || nextRotation === 270) {
        canvas.width = img.height;
        canvas.height = img.width;
      } else {
        canvas.width = img.width;
        canvas.height = img.height;
      }
      const ctx = canvas.getContext('2d');
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((nextRotation * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      const rotatedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setSelectedImage(rotatedDataUrl);
      processScan(rotatedDataUrl);
    };
    img.src = selectedImage;
  };

  // Drag and drop listeners
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

  // Clipboard Paste support
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

  const processScan = async (imageSource) => {
    setIsScanning(true);
    setScanStatusText('Reading your business card...');
    setSuccessMsg('');

    const setters = {
      setExtractedData, setCompany, setPersonName, setDesignation,
      setPhone, setEmail, setWebsite, setRawAddress, setGstin, setTags
    };

    try {
      const ocrResult = await extractCardWithTesseract(imageSource);
      console.log('✨ [OCR Result]:', ocrResult);
      applyExtractionToForm(ocrResult, setters);
    } catch (err) {
      console.warn('OCR extraction error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  // Save Card to PostgreSQL Database (User-Scoped Vault)
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
      gstin: gstin,
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

    try {
      const saved = await apiClient.saveCard(cardPayload, token);
      const cardId = saved?.id;
      if (!cardId) {
        throw new Error('Could not save card — no card ID returned.');
      }

      if (selectedImage) {
        await apiClient.uploadCardOriginalImage(cardId, selectedImage, token);
      }

      await loadUserVault(token);
      setIsSaving(false);
      setSuccessMsg('Card and original image saved to your vault!');
      setTimeout(() => {
        if (onCardSaved) onCardSaved({ ...saved, original_card_image_url: `/api/v1/cards/${cardId}/original-image` });
      }, 1200);
    } catch (err) {
      setIsSaving(false);
      alert(err.message || 'Failed to save card. Please try again.');
    }
  };

  const handleRetake = () => {
    setSelectedImage(null);
    setImageRotation(0);
    setExtractedData(null);
    setCompany('');
    setPersonName('');
    setDesignation('');
    setPhone('');
    setEmail('');
    setWebsite('');
    setRawAddress('');
    setGstin('');
    setTags('');
    startCamera();
  };

  const isReview = Boolean(selectedImage);

  return (
    <View style={styles.root}>
      <DetailScreenHeader
        title={isReview ? 'Review Card' : 'Scan Card'}
        subtitle={isReview ? 'Verify details before saving' : 'Capture or upload a visiting card'}
        onBack={onBack}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {successMsg ? (
          <View style={styles.toastSuccess}>
            <CheckCircle2 size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.toastText}>{successMsg}</Text>
          </View>
        ) : null}

        {/* Card preview — review mode shows large image; capture mode shows viewfinder */}
        <View
          style={[
            styles.previewFrame,
            isReview && styles.previewFrameReview,
            isDragging && styles.previewFrameDragging
          ]}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
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

          {selectedImage && !isCameraActive ? (
            <View style={styles.previewWrap}>
              <img src={selectedImage} alt="Business Card" style={styles.cardImage} />
              <View style={styles.previewActionsRow}>
                <TouchableOpacity style={styles.previewActionBtn} onPress={handleRotateImage}>
                  <RotateCw size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.previewActionText}>Rotate</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.previewActionBtn} onPress={handleRetake}>
                  <Camera size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.previewActionText}>Retake</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {!selectedImage && !isCameraActive ? (
            <View style={styles.alignmentGuide}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
              <Camera size={36} color={colors.primary} />
              <Text style={styles.guideTitle}>
                {isDragging ? 'Drop card image here' : 'Align business card in frame'}
              </Text>
              <Text style={styles.guideSub}>
                {cameraError || 'Portrait or landscape — we read English text accurately'}
              </Text>
            </View>
          ) : null}
        </View>

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
        ) : !isReview ? (
          <View style={styles.scanActionsRow}>
            <TouchableOpacity style={styles.openCameraBtn} onPress={() => startCamera()}>
              <Camera size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.openCameraBtnText}>Open Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.uploadFileBtn}
              onPress={() => fileInputRef.current && fileInputRef.current.click()}
            >
              <Upload size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={styles.uploadFileBtnText}>Upload from Gallery</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {isScanning && (
          <Card style={styles.scanningCard}>
            <Sparkles size={22} color={colors.primary} />
            <Text style={styles.scanningTitle}>{scanStatusText}</Text>
            <Text style={styles.scanningDesc}>Extracting company, phone, email, website and address…</Text>
          </Card>
        )}

        {isReview && (
          <Card style={styles.formCard}>
            <View style={styles.formHeader}>
              <Sparkles size={18} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.formHeaderTitle}>Detected Information</Text>
              <Badge type="verified" label="Review & Edit" />
            </View>

            <Input
              label="COMPANY / BUSINESS NAME *"
              value={company}
              onChangeText={setCompany}
              leftIcon={Building}
              placeholder="e.g. LIPI TRADERS"
            />

            <Input
              label="CONTACT PERSON"
              value={personName}
              onChangeText={setPersonName}
              leftIcon={User}
              placeholder="e.g. Sivakumar"
            />

            <Input
              label="DESIGNATION"
              value={designation}
              onChangeText={setDesignation}
              placeholder="e.g. Managing Partner"
            />

            <Input
              label="PHONE / WHATSAPP *"
              value={phone}
              onChangeText={setPhone}
              leftIcon={Phone}
              placeholder="+91 96555 87877"
            />

            <Input
              label="EMAIL ADDRESS"
              value={email}
              onChangeText={setEmail}
              leftIcon={Mail}
              placeholder="contact@company.com"
            />

            <Input
              label="WEBSITE"
              value={website}
              onChangeText={setWebsite}
              leftIcon={Globe}
              placeholder="www.company.com"
            />

            <Input
              label="FULL ADDRESS"
              value={rawAddress}
              onChangeText={setRawAddress}
              leftIcon={MapPin}
              placeholder="Street, City, State, Pincode"
            />

            <Input
              label="GSTIN"
              value={gstin}
              onChangeText={setGstin}
              placeholder="33XXXXXXXXXXXXXX"
            />

            <Input
              label="TAGS / BUSINESS CATEGORIES"
              value={tags}
              onChangeText={setTags}
              leftIcon={Tag}
              placeholder="e.g. Manufacturing, Supplier"
            />

            <Button
              title="Save Card"
              onPress={handleSaveToDatabase}
              loading={isSaving}
              disabled={isScanning}
              icon={ArrowRight}
              size="lg"
              style={styles.saveBtn}
            />
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgMuted
  },
  container: {
    flex: 1,
    backgroundColor: colors.bgMuted
  },
  scrollContent: {
    padding: spacing.md,
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
  previewFrame: {
    width: '100%',
    minHeight: 220,
    backgroundColor: '#1A1228',
    borderRadius: radii.lg,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: spacing.sm
  },
  previewFrameReview: {
    minHeight: 280,
    maxHeight: 360
  },
  previewFrameDragging: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(50, 20, 95, 0.08)'
  },
  previewWrap: {
    width: '100%',
    height: '100%',
    minHeight: 280,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.sm,
    backgroundColor: '#1A1228'
  },
  cardImage: {
    maxWidth: '100%',
    maxHeight: 300,
    objectFit: 'contain',
    borderRadius: radii.md
  },
  previewActionsRow: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    gap: 8
  },
  previewActionBtn: {
    backgroundColor: 'rgba(50, 20, 95, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full
  },
  previewActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  alignmentGuide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    minHeight: 220
  },
  guideTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.sm,
    textAlign: 'center',
    fontFamily: typography.titleSmall.fontFamily
  },
  guideSub: {
    color: '#C4BFD0',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18
  },
  cornerTL: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 22,
    height: 22,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: colors.gold
  },
  cornerTR: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: colors.gold
  },
  cornerBL: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    width: 22,
    height: 22,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: colors.gold
  },
  cornerBR: {
    position: 'absolute',
    bottom: 14,
    right: 14,
    width: 22,
    height: 22,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: colors.gold
  },
  cameraControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.sm
  },
  captureCircleBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF'
  },
  captureInnerCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary
  },
  flipBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeCameraBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scanActionsRow: {
    gap: spacing.sm,
    marginBottom: spacing.sm
  },
  openCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: radii.lg
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 13,
    borderRadius: radii.lg
  },
  uploadFileBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600'
  },
  scanningCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    alignItems: 'center',
    padding: spacing.lg,
    marginBottom: spacing.sm
  },
  scanningTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.sm
  },
  scanningDesc: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: radii.lg
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: 6
  },
  formHeaderTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary,
    fontFamily: typography.titleSmall.fontFamily
  },
  saveBtn: {
    marginTop: spacing.sm
  }
});
