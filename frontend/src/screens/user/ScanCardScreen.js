import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
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
  RotateCw,
  VideoOff,
  SwitchCamera,
} from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../services/api';
import { extractCardWithTesseract, mergeExtractions } from '../../utils/ocrParser';
import { DetailScreenHeader } from '../../components/DetailScreenHeader';

function applyExtractionToForm(data, setters) {
  if (!data) return;
  setters.setExtractedData(data);
  setters.setFieldConfidence(data.field_confidence || {});
  setters.setCompany(data.company || '');
  setters.setPersonName(data.person_name || '');
  setters.setDesignation(data.designation || '');
  setters.setPhone(data.phones?.[0]?.raw || '');
  // Never invent WhatsApp from the primary phone — only use a distinct second number
  const wa =
    data.phones?.find((p) => p.is_whatsapp)?.raw ||
    (data.phones?.[1] && data.phones[1].digits !== data.phones[0]?.digits ? data.phones[1].raw : '') ||
    '';
  setters.setWhatsapp(wa);
  setters.setEmail(data.emails?.[0] || '');
  setters.setWebsite((data.website || '').replace(/^https?:\/\//, ''));
  setters.setRawAddress(data.raw_address || '');
  setters.setCity(data.city || '');
  setters.setStateName(data.state || '');
  setters.setPincode(data.pincode || '');
  setters.setGstin(data.gstin || '');
}

export function ScanCardScreen({ onCardSaved, onBack }) {
  const { token, loadUserVault } = useAuth();

  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [captureSide, setCaptureSide] = useState('front');
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [phase, setPhase] = useState('capture'); // capture | preview | review | saved
  const [savedCard, setSavedCard] = useState(null);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment');
  const [cameraError, setCameraError] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatusText, setScanStatusText] = useState('Reading your business card...');
  const [isSaving, setIsSaving] = useState(false);
  const [extractedData, setExtractedData] = useState(null);
  const [fieldConfidence, setFieldConfidence] = useState({});
  const [imageRotation, setImageRotation] = useState(0);

  const [company, setCompany] = useState('');
  const [personName, setPersonName] = useState('');
  const [designation, setDesignation] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [rawAddress, setRawAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');

  const currentPreview = captureSide === 'front' ? frontImage : backImage;

  const stopCameraStream = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = videoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async (facing = cameraFacing) => {
    setCameraError('');
    setImageRotation(0);
    stopCameraStream();
    setPhase('capture');

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

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing);
  };

  const assignImage = (dataUrl) => {
    if (captureSide === 'back') setBackImage(dataUrl);
    else setFrontImage(dataUrl);
    setPhase('preview');
    setImageRotation(0);
  };

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
    ctx.drawImage(video, cropX, cropY, visibleWidthInVideo, visibleHeightInVideo, 0, 0, visibleWidthInVideo, visibleHeightInVideo);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    stopCameraStream();
    assignImage(dataUrl);
  };

  const handleProcessFile = (file) => {
    if (!file) return;
    stopCameraStream();
    const reader = new FileReader();
    reader.onload = (event) => assignImage(event.target.result);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleProcessFile(file);
  };

  const handleRotateImage = () => {
    const src = currentPreview;
    if (!src) return;
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
      if (captureSide === 'back') setBackImage(rotatedDataUrl);
      else setFrontImage(rotatedDataUrl);
    };
    img.src = src;
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer?.files?.[0]) handleProcessFile(e.dataTransfer.files[0]);
  };

  useEffect(() => {
    const handlePaste = (e) => {
      if (phase === 'review' || phase === 'saved') return;
      if (e.clipboardData?.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];
          if (item.type.indexOf('image') !== -1) {
            handleProcessFile(item.getAsFile());
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
  }, [phase, captureSide]);

  const runOcrAndReview = async () => {
    setIsScanning(true);
    setScanStatusText('Reading front and back of your card...');
    const setters = {
      setExtractedData, setFieldConfidence, setCompany, setPersonName, setDesignation,
      setPhone, setWhatsapp, setEmail, setWebsite, setRawAddress, setCity, setStateName, setPincode, setGstin
    };
    try {
      setScanStatusText(frontImage ? 'Reading front…' : 'Reading card…');
      const front = frontImage ? await extractCardWithTesseract(frontImage) : null;
      setScanStatusText(backImage ? 'Reading back…' : 'Extracting details…');
      const back = backImage ? await extractCardWithTesseract(backImage) : null;
      setScanStatusText('Combining front & back…');
      applyExtractionToForm(mergeExtractions(front, back), setters);
    } catch (err) {
      console.warn('OCR extraction error:', err);
    } finally {
      setIsScanning(false);
      setPhase('review');
    }
  };

  const handleContinueFromPreview = () => {
    if (captureSide === 'front') {
      setCaptureSide('back');
      setPhase('capture');
      setImageRotation(0);
      return;
    }
    runOcrAndReview();
  };

  const handleSkipBack = () => {
    runOcrAndReview();
  };

  const handleRetake = () => {
    if (captureSide === 'back') setBackImage(null);
    else setFrontImage(null);
    setPhase('capture');
    startCamera();
  };

  const handleSaveToDatabase = async () => {
    if (!company && !personName && !phone) {
      alert('Please enter at least a name, company, or phone number.');
      return;
    }
    if (!frontImage) {
      alert('Front side image is required.');
      return;
    }

    setIsSaving(true);
    const addressParts = [rawAddress, city, stateName, pincode].filter(Boolean);
    const cardPayload = {
      person_name: personName,
      designation,
      company,
      website,
      gstin,
      notes: 'Scanned visiting card',
      met_context: 'CardFlow scanner',
      source: 'SCANNED',
      phones: [
        phone ? { raw: phone, e164: phone.replace(/[^0-9+]/g, ''), type: 'mobile', is_whatsapp: false } : null,
        whatsapp ? { raw: whatsapp, e164: whatsapp.replace(/[^0-9+]/g, ''), type: 'mobile', is_whatsapp: true } : null
      ].filter(Boolean),
      emails: email ? [email] : [],
      raw_address: addressParts.join(', '),
      tags: ['Business Card']
    };

    try {
      const saved = await apiClient.saveCard(cardPayload, token);
      const cardId = saved?.id;
      if (!cardId) throw new Error('Could not save card — no card ID returned.');

      await apiClient.uploadCardOriginalImage(cardId, frontImage, token, 'front');
      if (backImage) {
        await apiClient.uploadCardOriginalImage(cardId, backImage, token, 'back');
      }

      await loadUserVault(token);
      const persisted = {
        ...saved,
        original_card_image_url: `/api/v1/cards/${cardId}/original-image`,
        original_back_image_url: backImage ? `/api/v1/cards/${cardId}/original-image?side=back` : '',
        person_name: personName,
        company,
        designation,
        phones: cardPayload.phones,
        emails: cardPayload.emails,
        raw_address: cardPayload.raw_address,
        gstin,
        website
      };
      setSavedCard(persisted);
      setIsSaving(false);
      setPhase('saved');
    } catch (err) {
      setIsSaving(false);
      alert(err.message || 'Failed to save card. Please try again.');
    }
  };

  const headerTitle =
    phase === 'saved' ? 'Card Saved' :
    phase === 'review' ? 'Review Card' :
    captureSide === 'back' ? 'Scan Back Side' : 'Scan Front Side';

  const headerSub =
    phase === 'saved' ? 'Your card is stored in My Cards' :
    phase === 'review' ? 'Correct any OCR mistakes before saving' :
    captureSide === 'back' ? 'Capture extra contact details from the back' :
    'Capture the front of the visiting card';

  if (phase === 'saved') {
    return (
      <View style={styles.root}>
        <DetailScreenHeader title="Card Saved" subtitle="Stored in your vault" onBack={onBack} />
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <CheckCircle2 size={40} color={colors.success} />
          </View>
          <Text style={styles.successTitle}>Card Saved</Text>
          <Text style={styles.successSub}>
            Your business card has been safely added to My Cards.
          </Text>
          <Button
            title="View Card"
            onPress={() => onCardSaved && onCardSaved(savedCard)}
            size="lg"
            style={{ width: '100%', marginBottom: spacing.sm }}
          />
          <Button
            title="Done"
            variant="outline"
            onPress={() => onCardSaved && onCardSaved()}
            size="lg"
            style={{ width: '100%' }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <DetailScreenHeader title={headerTitle} subtitle={headerSub} onBack={onBack} />

      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: 'none' }} />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <View style={styles.sideRow}>
          <View style={[styles.sideChip, frontImage && styles.sideChipDone, captureSide === 'front' && styles.sideChipActive]}>
            <Text style={[styles.sideChipText, (frontImage || captureSide === 'front') && styles.sideChipTextActive]}>
              Front Side{frontImage ? ' ✓' : ''}
            </Text>
          </View>
          <View style={[styles.sideChip, backImage && styles.sideChipDone, captureSide === 'back' && styles.sideChipActive]}>
            <Text style={[styles.sideChipText, (backImage || captureSide === 'back') && styles.sideChipTextActive]}>
              Back Side{backImage ? ' ✓' : ''}
            </Text>
          </View>
        </View>

        {phase !== 'review' ? (
          <View
            style={[styles.previewFrame, phase === 'preview' && styles.previewFrameReview, isDragging && styles.previewFrameDragging]}
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

            {phase === 'preview' && currentPreview && !isCameraActive ? (
              <View style={styles.previewWrap}>
                <img src={currentPreview} alt={`${captureSide} of business card`} style={styles.cardImage} />
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

            {phase === 'capture' && !isCameraActive ? (
              <View style={styles.alignmentGuide}>
                <View style={styles.cornerTL} />
                <View style={styles.cornerTR} />
                <View style={styles.cornerBL} />
                <View style={styles.cornerBR} />
                <Camera size={36} color={colors.primary} />
                <Text style={styles.guideTitle}>
                  {isDragging
                    ? 'Drop card image here'
                    : captureSide === 'back'
                      ? 'Align the back side in frame'
                      : 'Align the front side in frame'}
                </Text>
                <Text style={styles.guideSub}>
                  {cameraError || (captureSide === 'back'
                    ? 'Now scan the back for additional contact details.'
                    : 'Capture front side of the card.')}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {phase === 'review' ? (
          <View style={styles.reviewThumbs}>
            {frontImage ? <img src={frontImage} alt="Front" style={styles.reviewThumb} /> : null}
            {backImage ? <img src={backImage} alt="Back" style={styles.reviewThumb} /> : null}
          </View>
        ) : null}

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
        ) : null}

        {phase === 'capture' && !isCameraActive ? (
          <View style={styles.scanActionsRow}>
            <TouchableOpacity style={styles.openCameraBtn} onPress={() => startCamera()}>
              <Camera size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.openCameraBtnText}>
                {captureSide === 'back' ? 'Capture Back' : 'Open Camera'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.uploadFileBtn} onPress={() => fileInputRef.current && fileInputRef.current.click()}>
              <Upload size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={styles.uploadFileBtnText}>Upload from Gallery</Text>
            </TouchableOpacity>
            {captureSide === 'back' && frontImage ? (
              <TouchableOpacity onPress={handleSkipBack}>
                <Text style={styles.skipText}>Skip back side and continue</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}

        {phase === 'preview' ? (
          <View style={styles.previewCtas}>
            <Text style={styles.capturedHint}>
              {captureSide === 'front' ? 'Front side captured.' : 'Back side captured.'}
            </Text>
            <Button title={captureSide === 'front' ? 'Continue' : 'Process Card'} onPress={handleContinueFromPreview} size="lg" />
            <Button title="Retake" variant="outline" onPress={handleRetake} size="lg" style={{ marginTop: spacing.sm }} />
          </View>
        ) : null}

        {isScanning && (
          <Card style={styles.scanningCard}>
            <Sparkles size={22} color={colors.primary} />
            <Text style={styles.scanningTitle}>{scanStatusText}</Text>
            <Text style={styles.scanningDesc}>
              {frontImage ? 'Front ✓' : 'Front —'}{'\n'}
              {backImage ? 'Back ✓' : 'Back — (optional)'}{'\n'}
              Extracting only fields we can verify…
            </Text>
          </Card>
        )}

        {phase === 'review' && (
          <Card style={styles.formCard}>
            <Text style={styles.formHeaderTitle}>Review details</Text>
            <Text style={styles.formHint}>
              Blank is better than wrong. Correct anything OCR may have misread.
            </Text>

            <Input
              label="NAME *"
              value={personName}
              onChangeText={setPersonName}
              leftIcon={User}
              placeholder="Full name"
              hint={fieldConfidence.person_name > 0 && fieldConfidence.person_name < 0.6 ? 'Please verify' : undefined}
            />
            <Input
              label="DESIGNATION"
              value={designation}
              onChangeText={setDesignation}
              placeholder="e.g. Managing Partner"
              hint={fieldConfidence.designation > 0 && fieldConfidence.designation < 0.7 ? 'Please verify' : undefined}
            />
            <Input
              label="COMPANY"
              value={company}
              onChangeText={setCompany}
              leftIcon={Building}
              placeholder="Company name"
              hint={fieldConfidence.company > 0 && fieldConfidence.company < 0.5 ? 'Please verify' : undefined}
            />
            <Input
              label="PHONE *"
              value={phone}
              onChangeText={setPhone}
              leftIcon={Phone}
              placeholder="+91 98765 43210"
              hint={fieldConfidence.phone > 0 && fieldConfidence.phone < 0.7 ? 'Please verify' : undefined}
            />
            <Input label="WHATSAPP" value={whatsapp} onChangeText={setWhatsapp} placeholder="Only if different from phone" />
            <Input label="EMAIL" value={email} onChangeText={setEmail} leftIcon={Mail} placeholder="contact@company.com" />
            <Input label="WEBSITE" value={website} onChangeText={setWebsite} leftIcon={Globe} placeholder="www.company.com" />
            <Input
              label="GSTIN"
              value={gstin}
              onChangeText={setGstin}
              placeholder="33XXXXXXXXXXXXXX"
              hint={gstin && fieldConfidence.gstin < 0.9 ? 'Please verify' : undefined}
            />
            <Input
              label="ADDRESS"
              value={rawAddress}
              onChangeText={setRawAddress}
              leftIcon={MapPin}
              placeholder="Street, area"
              hint={fieldConfidence.address > 0 && fieldConfidence.address < 0.55 ? 'Please verify' : undefined}
            />
            <Input label="CITY" value={city} onChangeText={setCity} placeholder="City" />
            <Input label="STATE" value={stateName} onChangeText={setStateName} placeholder="State" />
            <Input label="PINCODE" value={pincode} onChangeText={setPincode} placeholder="641001" />

            <Button
              title="Save Card"
              onPress={handleSaveToDatabase}
              loading={isSaving}
              disabled={isScanning}
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
  root: { flex: 1, backgroundColor: colors.bgMuted },
  container: { flex: 1, backgroundColor: colors.bgMuted },
  scrollContent: { padding: spacing.md, paddingBottom: spacing.xxxl },
  sideRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  sideChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#FFFFFF',
    alignItems: 'center'
  },
  sideChipActive: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  sideChipDone: { borderColor: colors.success },
  sideChipText: { fontSize: 12, fontWeight: '600', color: colors.textMuted },
  sideChipTextActive: { color: colors.primary, fontWeight: '700' },
  successWrap: { flex: 1, padding: spacing.xxl, alignItems: 'center', justifyContent: 'center' },
  successIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.successLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg
  },
  successTitle: { ...typography.titleMedium, marginBottom: spacing.sm },
  successSub: { ...typography.bodyMedium, textAlign: 'center', marginBottom: spacing.xxl, maxWidth: 280 },
  previewFrame: {
    width: '100%', minHeight: 220, backgroundColor: '#1A1228', borderRadius: radii.lg,
    borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', marginBottom: spacing.sm
  },
  previewFrameReview: { minHeight: 280, maxHeight: 360 },
  previewFrameDragging: { borderColor: colors.primary, backgroundColor: 'rgba(50, 20, 95, 0.08)' },
  previewWrap: {
    width: '100%', height: '100%', minHeight: 280, position: 'relative',
    alignItems: 'center', justifyContent: 'center', padding: spacing.sm, backgroundColor: '#1A1228'
  },
  cardImage: { maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: radii.md },
  previewActionsRow: { position: 'absolute', bottom: 10, flexDirection: 'row', gap: 8 },
  previewActionBtn: {
    backgroundColor: 'rgba(50, 20, 95, 0.85)', flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: radii.pill
  },
  previewActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  alignmentGuide: {
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl, minHeight: 220
  },
  guideTitle: {
    color: '#FFFFFF', fontSize: 15, fontWeight: '700', marginTop: spacing.sm,
    textAlign: 'center', fontFamily: typography.titleSmall.fontFamily
  },
  guideSub: { color: '#C4BFD0', fontSize: 12, textAlign: 'center', marginTop: 4, lineHeight: 18 },
  cornerTL: { position: 'absolute', top: 14, left: 14, width: 22, height: 22, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderColor: colors.gold },
  cornerTR: { position: 'absolute', top: 14, right: 14, width: 22, height: 22, borderTopWidth: 2.5, borderRightWidth: 2.5, borderColor: colors.gold },
  cornerBL: { position: 'absolute', bottom: 14, left: 14, width: 22, height: 22, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderColor: colors.gold },
  cornerBR: { position: 'absolute', bottom: 14, right: 14, width: 22, height: 22, borderBottomWidth: 2.5, borderRightWidth: 2.5, borderColor: colors.gold },
  cameraControlsRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg, marginBottom: spacing.sm },
  captureCircleBtn: {
    width: 64, height: 64, borderRadius: 32, borderWidth: 3, borderColor: colors.primary,
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF'
  },
  captureInnerCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary },
  flipBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  closeCameraBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center' },
  scanActionsRow: { gap: spacing.sm, marginBottom: spacing.sm },
  openCameraBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, paddingVertical: 14, borderRadius: radii.lg
  },
  openCameraBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  uploadFileBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: colors.border,
    paddingVertical: 13, borderRadius: radii.lg
  },
  uploadFileBtnText: { color: colors.textPrimary, fontSize: 14, fontWeight: '600' },
  skipText: { textAlign: 'center', color: colors.primary, fontWeight: '600', fontSize: 13, paddingVertical: spacing.sm },
  previewCtas: { marginBottom: spacing.md },
  capturedHint: { textAlign: 'center', color: colors.textSecondary, fontSize: 13, marginBottom: spacing.sm },
  reviewThumbs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  reviewThumb: {
    flex: 1, height: 110, objectFit: 'contain', backgroundColor: '#1A1228',
    borderRadius: radii.md, border: `1px solid ${colors.border}`
  },
  scanningCard: { backgroundColor: '#FFFFFF', borderColor: colors.border, alignItems: 'center', padding: spacing.lg, marginBottom: spacing.sm },
  scanningTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: spacing.sm },
  scanningDesc: { color: colors.textSecondary, fontSize: 12, textAlign: 'center', marginTop: 4 },
  formCard: { backgroundColor: '#FFFFFF', borderColor: colors.border, padding: spacing.md, borderRadius: radii.lg },
  formHeaderTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, fontFamily: typography.titleSmall.fontFamily },
  formHint: { fontSize: 12, color: colors.textSecondary, marginBottom: spacing.md, marginTop: 4 },
  saveBtn: { marginTop: spacing.sm }
});
