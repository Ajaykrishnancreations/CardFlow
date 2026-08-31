import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { QrCode, Download, Share2, Copy, Check, ExternalLink, Printer } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { mockBusinesses } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

export function QRCodeScreen({ onShareCard }) {
  const { activeBusinessId } = useAuth();
  const activeBiz = mockBusinesses.find((b) => b.id === activeBusinessId) || mockBusinesses[0];
  const publicUrl = `https://cardflow.app/b/${activeBiz.slug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    alert('Public business profile URL copied to clipboard!');
  };

  const handlePrint = () => {
    alert('Preparing printable A6 PDF counter display poster...');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Counter QR Display</Text>
        <Text style={styles.subtitle}>
          Place this QR code at your shop or office counter. Customers scan to save your business card instantly.
        </Text>
      </View>

      {/* Printable QR Display Card */}
      <Card style={styles.qrCard}>
        <Text style={styles.bizName}>{activeBiz.name}</Text>
        <Text style={styles.bizCategory}>{activeBiz.category}</Text>

        <View style={styles.qrBox}>
          {/* Mock QR rendering with Lucide icon and pattern */}
          <QrCode size={180} color="#0F172A" />
        </View>

        <Text style={styles.scanInstruction}>SCAN TO SAVE DIGITAL CARD</Text>
        <Text style={styles.publicUrl}>{publicUrl}</Text>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <Button
          title="Share Link"
          onPress={onShareCard}
          icon={Share2}
          variant="primary"
          style={{ flex: 1, marginRight: spacing.sm }}
        />
        <Button
          title="Copy Link"
          onPress={handleCopyLink}
          icon={Copy}
          variant="outline"
          style={{ flex: 1 }}
        />
      </View>

      <Button
        title="Download Printable A6 Poster (PDF)"
        onPress={handlePrint}
        icon={Printer}
        variant="secondary"
        style={{ marginTop: spacing.md }}
      />
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
    marginBottom: spacing.lg,
    alignItems: 'center'
  },
  title: {
    ...typography.titleMedium,
    color: colors.textPrimary,
    textAlign: 'center'
  },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 320
  },
  qrCard: {
    alignItems: 'center',
    padding: spacing.xxl,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: colors.border,
    marginBottom: spacing.lg
  },
  bizName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
    textAlign: 'center'
  },
  bizCategory: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
    marginBottom: spacing.lg
  },
  qrBox: {
    padding: spacing.lg,
    backgroundColor: '#F8FAFC',
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg
  },
  scanInstruction: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    color: colors.primaryDark,
    marginBottom: 4
  },
  publicUrl: {
    fontSize: 12,
    color: colors.textSecondary
  },
  actionsRow: {
    flexDirection: 'row',
    marginBottom: spacing.xs
  }
});
