import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BarChart3, Eye, Phone, MessageSquare, Navigation, Share2, TrendingUp, Calendar } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Card } from '../../components/Card';
import { mockBusinesses } from '../../data/mockData';
import { useAuth } from '../../context/AuthContext';

export function AnalyticsScreen() {
  const { activeBusinessId } = useAuth();
  const activeBiz = mockBusinesses.find((b) => b.id === activeBusinessId) || mockBusinesses[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Analytics</Text>
        <Text style={styles.subtitle}>Last 30 Days Activity for {activeBiz.name}</Text>
      </View>

      {/* Overview Cards */}
      <View style={styles.metricsGrid}>
        <Card style={styles.metricCard}>
          <View style={[styles.iconWrap, { backgroundColor: '#EFF6FF' }]}>
            <Eye size={18} color={colors.primary} />
          </View>
          <Text style={styles.metricValue}>{activeBiz.viewsCount || 284}</Text>
          <Text style={styles.metricLabel}>Profile Views</Text>
          <Text style={styles.trendText}>+14% vs last month</Text>
        </Card>

        <Card style={styles.metricCard}>
          <View style={[styles.iconWrap, { backgroundColor: '#ECFDF5' }]}>
            <MessageSquare size={18} color={colors.verifiedGst} />
          </View>
          <Text style={styles.metricValue}>48</Text>
          <Text style={styles.metricLabel}>WhatsApp Clicks</Text>
          <Text style={styles.trendText}>+22% vs last month</Text>
        </Card>

        <Card style={styles.metricCard}>
          <View style={[styles.iconWrap, { backgroundColor: '#FEF3C7' }]}>
            <Phone size={18} color={colors.warning} />
          </View>
          <Text style={styles.metricValue}>36</Text>
          <Text style={styles.metricLabel}>Call Clicks</Text>
          <Text style={styles.trendText}>+8% vs last month</Text>
        </Card>

        <Card style={styles.metricCard}>
          <View style={[styles.iconWrap, { backgroundColor: '#F1F5F9' }]}>
            <Navigation size={18} color={colors.textSecondary} />
          </View>
          <Text style={styles.metricValue}>19</Text>
          <Text style={styles.metricLabel}>Directions Taps</Text>
          <Text style={styles.trendText}>+5% vs last month</Text>
        </Card>
      </View>

      {/* Discovery Insights */}
      <Card style={styles.insightCard}>
        <Text style={styles.insightTitle}>Top Search Pincodes</Text>
        <View style={styles.pincodeRow}>
          <Text style={styles.pincodeNum}>641004 (Peelamedu)</Text>
          <Text style={styles.pincodeShare}>42% of views</Text>
        </View>
        <View style={styles.pincodeRow}>
          <Text style={styles.pincodeNum}>641018 (Gandhipuram)</Text>
          <Text style={styles.pincodeShare}>28% of views</Text>
        </View>
        <View style={styles.pincodeRow}>
          <Text style={styles.pincodeNum}>641015 (Singanallur)</Text>
          <Text style={styles.pincodeShare}>18% of views</Text>
        </View>
      </Card>
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: spacing.md
  },
  metricCard: {
    width: '48.5%',
    padding: spacing.md,
    marginBottom: spacing.sm
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 2
  },
  trendText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.verifiedGst,
    marginTop: 4
  },
  insightCard: {
    padding: spacing.lg
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md
  },
  pincodeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  pincodeNum: {
    fontSize: 13,
    color: colors.textPrimary,
    fontWeight: '600'
  },
  pincodeShare: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700'
  }
});
