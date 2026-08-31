import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  MessageSquare,
  Phone,
  Mail,
  Copy,
  Share2,
  Check,
  Building2,
  ExternalLink
} from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { mockBusinesses } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

export function ShareCardScreen() {
  const { activeBusinessId } = useAuth();
  const activeBiz = mockBusinesses.find((b) => b.id === activeBusinessId) || mockBusinesses[0];
  const [copied, setCopied] = useState(false);

  const shareUrl = `https://cardflow.app/b/${activeBiz.slug}`;
  const shareText = `Save our digital business card on CardFlow:\n${activeBiz.name}\n${shareUrl}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`);
  };

  const handleSms = () => {
    window.open(`sms:?body=${encodeURIComponent(shareText)}`);
  };

  const handleEmail = () => {
    window.open(
      `mailto:?subject=${encodeURIComponent(`Digital Card: ${activeBiz.name}`)}&body=${encodeURIComponent(
        shareText
      )}`
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Share Business Card</Text>
        <Text style={styles.subtitle}>
          Recipients can open your digital profile and save your contact without installing the app.
        </Text>
      </View>

      {/* Preview Card */}
      <Card style={styles.previewCard}>
        <Text style={styles.previewLabel}>PUBLIC PROFILE LINK</Text>
        <Text style={styles.previewUrl}>{shareUrl}</Text>
      </Card>

      {/* Sharing Options */}
      <View style={styles.optionsList}>
        <TouchableOpacity style={styles.shareOption} activeOpacity={0.8} onPress={handleWhatsApp}>
          <View style={[styles.iconCircle, { backgroundColor: '#ECFDF5' }]}>
            <MessageSquare size={22} color={colors.verifiedGst} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Share via WhatsApp</Text>
            <Text style={styles.optionSub}>Direct message to your clients & groups</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareOption} activeOpacity={0.8} onPress={handleSms}>
          <View style={[styles.iconCircle, { backgroundColor: '#EFF6FF' }]}>
            <Phone size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Share via SMS</Text>
            <Text style={styles.optionSub}>Text message with clickable link</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareOption} activeOpacity={0.8} onPress={handleEmail}>
          <View style={[styles.iconCircle, { backgroundColor: '#EEF2FF' }]}>
            <Mail size={22} color={colors.secondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>Share via Email</Text>
            <Text style={styles.optionSub}>Email invitation with digital signature</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.shareOption} activeOpacity={0.8} onPress={handleCopy}>
          <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
            {copied ? <Check size={22} color={colors.success} /> : <Copy size={22} color={colors.warning} />}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.optionTitle}>{copied ? 'Copied to Clipboard!' : 'Copy Link'}</Text>
            <Text style={styles.optionSub}>Paste in your social bios and messages</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  header: {
    marginBottom: spacing.lg
  },
  title: {
    ...typography.titleMedium,
    color: colors.textPrimary
  },
  subtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: 2
  },
  previewCard: {
    backgroundColor: colors.primaryLight,
    borderColor: '#BFDBFE',
    marginBottom: spacing.lg
  },
  previewLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primaryDark,
    marginBottom: 4,
    letterSpacing: 0.5
  },
  previewUrl: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary
  },
  optionsList: {
    marginTop: spacing.xs
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    cursor: 'pointer'
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  optionSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2
  }
});
