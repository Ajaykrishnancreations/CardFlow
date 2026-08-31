import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import {
  Camera,
  Upload,
  Sparkles,
  Image as ImageIcon,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useAuth } from '../../context/AuthContext';

export function ScanCardScreen({ onCardSaved }) {
  const { user } = useAuth();
  const [side, setSide] = useState('front'); // 'front' | 'back'
  const [hasFrontCaptured, setHasFrontCaptured] = useState(false);
  const [hasBackCaptured, setHasBackCaptured] = useState(false);
  const [scanMode, setScanMode] = useState('extract'); // 'extract' (1 credit/allowance) | 'image_only' (0 credits)
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSimulateCapture = () => {
    if (side === 'front') {
      setHasFrontCaptured(true);
      setSide('back');
    } else {
      setHasBackCaptured(true);
    }
  };

  const handleProceed = async () => {
    setIsProcessing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setIsProcessing(false);
    alert(
      scanMode === 'extract'
        ? 'Card photo uploaded & AI extracted structured contact details successfully!'
        : 'Card original photo saved in Vault (0 credits used). You can extract anytime later.'
    );
    onCardSaved();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Camera Viewfinder Mock */}
      <View style={styles.viewfinderContainer}>
        <View style={styles.viewfinderFrame}>
          {hasFrontCaptured && side === 'back' ? (
            <View style={styles.capturedPreview}>
              <CheckCircle2 size={32} color={colors.verifiedGst} />
              <Text style={styles.capturedText}>Front side captured!</Text>
              <Text style={styles.capturedSubText}>Now align the back of the card (optional)</Text>
            </View>
          ) : (
            <View style={styles.alignmentGuide}>
              <View style={styles.cornerTL} />
              <View style={styles.cornerTR} />
              <View style={styles.cornerBL} />
              <View style={styles.cornerBR} />
              <Camera size={40} color="rgba(255,255,255,0.7)" />
              <Text style={styles.guideText}>
                Align {side.toUpperCase()} of business card inside frame
              </Text>
            </View>
          )}
        </View>

        {/* Shutter / Capture action */}
        <View style={styles.shutterRow}>
          <TouchableOpacity
            style={styles.shutterButton}
            onPress={handleSimulateCapture}
            activeOpacity={0.8}
          >
            <View style={styles.innerShutter} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Mode Selector */}
      <Card style={styles.modeCard}>
        <Text style={styles.modeCardTitle}>Save Options</Text>

        <TouchableOpacity
          style={[styles.modeOption, scanMode === 'extract' && styles.modeOptionActive]}
          onPress={() => setScanMode('extract')}
          activeOpacity={0.8}
        >
          <View style={styles.modeRadio}>
            {scanMode === 'extract' && <View style={styles.modeRadioInner} />}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Sparkles size={16} color={colors.primary} style={{ marginRight: 6 }} />
              <Text style={styles.modeTitle}>Extract with AI (Recommended)</Text>
            </View>
            <Text style={styles.modeDesc}>
              Extracts name, company, multiple phones (with WhatsApp tags), emails, address.
            </Text>
            <Text style={styles.modeAllowance}>
              Remaining free scans: {user?.freeScansRemaining || 28}/30 this month
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeOption, scanMode === 'image_only' && styles.modeOptionActive]}
          onPress={() => setScanMode('image_only')}
          activeOpacity={0.8}
        >
          <View style={styles.modeRadio}>
            {scanMode === 'image_only' && <View style={styles.modeRadioInner} />}
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <ImageIcon size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
              <Text style={styles.modeTitle}>Save Image Only (0 Credits)</Text>
            </View>
            <Text style={styles.modeDesc}>
              Stores high-res card photos in your Vault forever. Extract with AI anytime later.
            </Text>
          </View>
        </TouchableOpacity>
      </Card>

      {/* Action Button */}
      <Button
        title={hasFrontCaptured ? "Save Card to Vault" : "Capture Front First"}
        onPress={hasFrontCaptured ? handleProceed : handleSimulateCapture}
        loading={isProcessing}
        size="lg"
        style={styles.saveBtn}
      />
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
  viewfinderContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg
  },
  viewfinderFrame: {
    width: '100%',
    height: 220,
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
  alignmentGuide: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  guideText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    marginTop: spacing.md
  },
  capturedPreview: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  capturedText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '700',
    marginTop: spacing.sm
  },
  capturedSubText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 4
  },
  cornerTL: {
    position: 'absolute',
    top: -40,
    left: -80,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary
  },
  cornerTR: {
    position: 'absolute',
    top: -40,
    right: -80,
    width: 24,
    height: 24,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary
  },
  cornerBL: {
    position: 'absolute',
    bottom: -40,
    left: -80,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: colors.primary
  },
  cornerBR: {
    position: 'absolute',
    bottom: -40,
    right: -80,
    width: 24,
    height: 24,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: colors.primary
  },
  shutterRow: {
    marginTop: spacing.md,
    alignItems: 'center'
  },
  shutterButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer'
  },
  innerShutter: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary
  },
  modeCard: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    padding: spacing.lg,
    marginBottom: spacing.md
  },
  modeCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: spacing.md
  },
  modeOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#0F172A',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    cursor: 'pointer'
  },
  modeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: '#1E3A8A'
  },
  modeRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
    marginTop: 2
  },
  modeRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary
  },
  modeTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  modeDesc: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    lineHeight: 16
  },
  modeAllowance: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
    marginTop: 4
  },
  saveBtn: {
    marginTop: spacing.sm
  }
});
