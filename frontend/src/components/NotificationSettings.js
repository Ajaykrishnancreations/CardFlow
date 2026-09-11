import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Compass, Megaphone } from 'lucide-react';
import { colors, spacing, radii, typography } from '../theme';
import { Card } from './Card';
import { Toggle } from './Toggle';
import { getNotificationPrefs, setNotificationPref, isNativePlatform } from '../utils/pushNotifications';

export function NotificationSettings({ onBack }) {
  const [prefs, setPrefs] = useState(() => getNotificationPrefs());
  const native = isNativePlatform();

  const handleToggle = (key, value) => {
    setPrefs((p) => ({ ...p, [key]: value }));
    setNotificationPref(key, value);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {onBack ? (
        <TouchableOpacity onPress={onBack} style={styles.backRow} accessibilityLabel="Back">
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      ) : null}
      <Text style={styles.pageTitle}>Notifications</Text>
      <Text style={styles.pageSub}>
        {native
          ? 'Choose which push notifications you want on this device.'
          : 'Install the CardFlow app on your phone to receive push notifications.'}
      </Text>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Compass size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Explore Businesses</Text>
            <Text style={styles.rowSub}>Explore new businesses and improve your circle.</Text>
          </View>
          <Toggle value={prefs.exploreBusiness} onValueChange={(v) => handleToggle('exploreBusiness', v)} />
        </View>

        <View style={[styles.row, styles.rowLast]}>
          <View style={styles.iconWrap}>
            <Megaphone size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowTitle}>Grow Your Business</Text>
            <Text style={styles.rowSub}>Reminders to add your business and get more clients.</Text>
          </View>
          <Toggle value={prefs.addBusiness} onValueChange={(v) => handleToggle('addBusiness', v)} />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMuted },
  scrollContent: { padding: spacing.lg, paddingBottom: spacing.xxxl },
  backRow: { marginBottom: spacing.sm, alignSelf: 'flex-start', paddingVertical: 4 },
  backText: { fontSize: 14, fontWeight: '600', color: colors.primary },
  pageTitle: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  pageSub: { ...typography.bodyMedium, marginBottom: spacing.lg },
  card: { padding: 0, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md
  },
  rowLast: { borderBottomWidth: 0 },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radii.pill,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rowTitle: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  rowSub: { fontSize: 12, color: colors.textMuted, marginTop: 2, lineHeight: 16 }
});
