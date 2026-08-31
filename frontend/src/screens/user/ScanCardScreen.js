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
  Languages
} from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge } from '../../components/Badge';
import { Input } from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { extractCardWithTesseract } from '../../utils/ocrParser';

export function ScanCardScreen({ onCardSaved }) {
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

  // Dynamic Multilingual OCR Extraction (English + Tamil + Hindi)
  const processScan = async (imageSource) => {
    setIsScanning(true);
    setScanStatusText('Scanning with Multilingual AI OCR (English, Tamil, Hindi)...');
    setSuccessMsg('');

    try {
      const ocrResult = await extractCardWithTesseract(imageSource);
      console.log('✨ [OCR Result]:', ocrResult);

      if (ocrResult && (ocrResult.person_name || ocrResult.company || ocrResult.phones.length > 0 || ocrResult.emails.length > 0)) {
        setExtractedData(ocrResult);
        setCompany(ocrResult.company || '');
        setPersonName(ocrResult.person_name || '');
        setDesignation(ocrResult.designation || '');
        setPhone(ocrResult.phones?.[0]?.raw || '');
        setEmail(ocrResult.emails?.[0] || '');
        setWebsite(ocrResult.website || '');
        setRawAddress(ocrResult.raw_address || '');
        setTags(ocrResult.tags ? ocrResult.tags.join(', ') : 'Verified Business');
      } else {
        const backendResult = await apiClient.scanCard('scanned-card.jpg', token);
        if (backendResult) {
          setExtractedData(backendResult);
          setCompany(backendResult.company || '');
          setPersonName(backendResult.person_name || '');
          setDesignation(backendResult.designation || '');
          setPhone(backendResult.phones?.[0]?.raw || '');
          setEmail(backendResult.emails?.[0] || '');
          setWebsite(backendResult.website || '');
          setRawAddress(backendResult.raw_address || '');
          setTags(backendResult.tags ? backendResult.tags.join(', ') : 'Business Card');
        }
      }
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
    await loadUserVault(token);

    setIsSaving(false);
    setSuccessMsg('Card details saved to your database vault successfully!');

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

      {/* Hidden Canvas for video frame extraction & rotation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Success Notification Banner */}
      {successMsg ? (
        <View style={styles.toastSuccess}>
          <CheckCircle2 size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.toastText}>{successMsg}</Text>
        </View>
      ) : null}

      {/* Main Grid: Responsive Side-by-Side on Desktop, Stacked on Mobile */}
      <View style={[styles.mainLayout, isDesktop && styles.desktopLayoutGrid]}>
        {/* LEFT COLUMN: Camera Viewfinder */}
        <View style={[styles.leftColumn, isDesktop && styles.desktopLeftColumn]}>
          <View
            style={[
              styles.viewfinderFrame,
              selectedImage && styles.viewfinderFrameWithImage,
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

            {/* 2. Captured / Uploaded Image View (Flexible Portrait or Landscape) */}
            {selectedImage && !isCameraActive ? (
              <View style={styles.previewWrap}>
                <img
                  src={selectedImage}
                  alt="Business Card"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: 8
                  }}
                />
                <View style={styles.previewActionsRow}>
                  <TouchableOpacity
                    style={styles.reUploadBtn}
                    onPress={handleRotateImage}
                    title="Rotate 90°"
                  >
                    <RotateCw size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.reUploadText}>Rotate</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.reUploadBtn}
                    onPress={() => startCamera()}
                  >
                    <Camera size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.reUploadText}>Retake</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {/* 3. Empty Idle State with Card Alignment Guides */}
            {!selectedImage && !isCameraActive ? (
              <View style={styles.alignmentGuide}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
                <Camera size={38} color="#64748B" />
                <Text style={styles.guideTitle}>
                  {isDragging ? 'Drop Card Image Here' : 'Point Camera at Business Card'}
                </Text>
                <Text style={styles.guideSub}>
                  {cameraError || (isDesktop ? 'Webcam / Drag & Drop' : 'Landscape or Portrait cards')}
                </Text>
                <View style={styles.langPill}>
                  <Languages size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                  <Text style={styles.langPillText}>English • தமிழ் • हिन्दी</Text>
                </View>
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
                <Camera size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.openCameraBtnText}>
                  {isDesktop ? 'Open Desktop Webcam' : 'Open Live Camera'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadFileBtn}
                onPress={() => fileInputRef.current && fileInputRef.current.click()}
              >
                <Upload size={16} color="#CBD5E1" style={{ marginRight: 8 }} />
                <Text style={styles.uploadFileBtnText}>
                  {isDesktop ? 'Browse File / Drop Image' : 'Choose from Gallery (Portrait / Landscape)'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Dynamic AI OCR Progress Indicator */}
          {isScanning && (
            <Card style={styles.scanningCard}>
              <Sparkles size={24} color={colors.primary} />
              <Text style={styles.scanningTitle}>{scanStatusText}</Text>
              <Text style={styles.scanningDesc}>Recognizing name, role, mobile, email, website and address in English, Tamil or Hindi</Text>
            </Card>
          )}
        </View>

        {/* RIGHT COLUMN: Extracted Data Form for Review and Database Storage */}
        <View style={[styles.rightColumn, isDesktop && styles.desktopRightColumn]}>
          <Card style={styles.extractedCard}>
            <View style={styles.extractedHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Sparkles size={18} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.extractedHeaderTitle}>CARD DETAILS (AUTO-FILLED & EDITABLE)</Text>
              </View>
              <Badge type="verified" label="Dynamic Multi-Script OCR" />
            </View>

            <Input
              label="COMPANY / BUSINESS NAME *"
              value={company}
              onChangeText={setCompany}
              leftIcon={Building}
              placeholder="e.g. Enterprise / Company Name"
            />

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Input
                  label="CONTACT PERSON"
                  value={personName}
                  onChangeText={setPersonName}
                  leftIcon={User}
                  placeholder="e.g. Contact Person"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Input
                  label="DESIGNATION"
                  value={designation}
                  onChangeText={setDesignation}
                  placeholder="e.g. Managing Director / Partner"
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
              label="TAGS / BUSINESS CATEGORIES"
              value={tags}
              onChangeText={setTags}
              leftIcon={Tag}
              placeholder="e.g. Manufacturing, Supplier, Coimbatore"
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
    padding: spacing.md,
    paddingBottom: spacing.xxxl
  },
  mainLayout: {
    flexDirection: 'column',
    width: '100%'
  },
  desktopLayoutGrid: {
    flexDirection: 'row',
    gap: spacing.lg,
    alignItems: 'flex-start'
  },
  leftColumn: {
    width: '100%'
  },
  desktopLeftColumn: {
    flex: 1
  },
  rightColumn: {
    width: '100%',
    marginTop: spacing.sm
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
    height: 200,
    maxHeight: 220,
    backgroundColor: '#1E293B',
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: '#334155',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  viewfinderFrameWithImage: {
    height: 240,
    maxHeight: 280
  },
  desktopViewfinderFrame: {
    height: 260,
    maxHeight: 300
  },
  viewfinderFrameDragging: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(37, 99, 235, 0.1)'
  },
  previewWrap: {
    width: '100%',
    height: '100%',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
    backgroundColor: '#0B1120'
  },
  previewActionsRow: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    gap: 8
  },
  reUploadBtn: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.md
  },
  reUploadText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  alignmentGuide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.md
  },
  guideTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8
  },
  guideSub: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radii.full,
    marginTop: 6
  },
  langPillText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600'
  },
  cornerTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 20,
    height: 20,
    borderTopWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: colors.primary
  },
  cornerTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: colors.primary
  },
  cornerBL: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 20,
    height: 20,
    borderBottomWidth: 2.5,
    borderLeftWidth: 2.5,
    borderColor: colors.primary
  },
  cornerBR: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 20,
    height: 20,
    borderBottomWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: colors.primary
  },
  cameraControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.sm
  },
  captureCircleBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'transparent',
    borderWidth: 3.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center'
  },
  captureInnerCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF'
  },
  flipBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeCameraBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scanActionsRow: {
    width: '100%',
    flexDirection: 'column',
    gap: 6,
    marginTop: spacing.sm
  },
  openCameraBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: radii.md
  },
  openCameraBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  uploadFileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    borderRadius: radii.md
  },
  uploadFileBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600'
  },
  scanningCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    marginTop: spacing.sm
  },
  scanningTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginTop: spacing.sm
  },
  scanningDesc: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2
  },
  extractedCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    padding: spacing.md,
    borderRadius: radii.md
  },
  extractedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm
  },
  extractedHeaderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5
  },
  saveDbBtn: {
    marginTop: spacing.sm
  }
});
