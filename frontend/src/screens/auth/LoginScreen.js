import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Phone, ArrowRight, Shield, Briefcase, User, Sparkles } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useAuth, DEV_TEST_ACCOUNTS } from '../../context/AuthContext';

export function LoginScreen({ onOtpRequested }) {
  const { sendOtp, isLoading } = useAuth();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');

  const handleSendOtp = async (inputPhone) => {
    const targetPhone = (inputPhone || phone).trim();
    if (!targetPhone) {
      setError('Please enter your 10-digit mobile number');
      return;
    }
    if (targetPhone.length < 10) {
      setError('Mobile number must be 10 digits');
      return;
    }

    setError('');
    const res = await sendOtp(targetPhone);
    if (res.success) {
      onOtpRequested(targetPhone);
    } else {
      setError(res.error || 'Failed to send OTP');
    }
  };

  const handleQuickSelect = (devAccount) => {
    setPhone(devAccount.phone);
    handleSendOtp(devAccount.phone);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Enter Phone Number</Text>
        <Text style={styles.subtitle}>
          We will send a 6-digit verification code to log in or create your account.
        </Text>
      </View>

      {/* Phone Input */}
      <View style={styles.inputContainer}>
        <Input
          label="MOBILE NUMBER"
          placeholder="98765 43210"
          value={phone}
          onChangeText={(text) => {
            setPhone(text.replace(/[^0-9]/g, ''));
            if (error) setError('');
          }}
          keyboardType="numeric"
          maxLength={10}
          leftIcon={Phone}
          error={error}
        />

        <Button
          title="Send OTP"
          onPress={() => handleSendOtp()}
          loading={isLoading}
          icon={ArrowRight}
          size="lg"
          style={styles.sendButton}
        />
      </View>

      {/* Registered Accounts Quick Select */}
      <Card style={styles.devCard}>
        <View style={styles.devHeader}>
          <Sparkles size={16} color={colors.warning} />
          <Text style={styles.devTitle}>CONFIGURED ACCOUNTS (1-TAP LOGIN)</Text>
        </View>
        <Text style={styles.devSubtitle}>
          Select any registered admin, business owner, or user for instant test login:
        </Text>

        {/* ADMIN ACCOUNTS */}
        <Text style={styles.groupLabel}>ADMINISTRATORS</Text>
        <View style={styles.accountsGrid}>
          <TouchableOpacity
            style={styles.accountOption}
            activeOpacity={0.7}
            onPress={() => handleQuickSelect(DEV_TEST_ACCOUNTS.ADMIN_AJAY)}
          >
            <View style={[styles.accountIcon, { backgroundColor: '#FEE2E2' }]}>
              <Shield size={16} color={colors.danger} />
            </View>
            <View style={styles.accountText}>
              <View style={styles.accountRow}>
                <Text style={styles.accountRole}>Ajay (Admin)</Text>
                <Text style={styles.accountPhone}>6382124970</Text>
              </View>
              <Text style={styles.accountDesc}>Full Admin Control, Manual Business & Grants</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accountOption}
            activeOpacity={0.7}
            onPress={() => handleQuickSelect(DEV_TEST_ACCOUNTS.ADMIN_GOVARDHAN)}
          >
            <View style={[styles.accountIcon, { backgroundColor: '#FEE2E2' }]}>
              <Shield size={16} color={colors.danger} />
            </View>
            <View style={styles.accountText}>
              <View style={styles.accountRow}>
                <Text style={styles.accountRole}>Govardhan (Admin)</Text>
                <Text style={styles.accountPhone}>9008722766</Text>
              </View>
              <Text style={styles.accountDesc}>Full Admin Control & Verification Queue</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* BUSINESS OWNERS */}
        <Text style={styles.groupLabel}>BUSINESS OWNERS</Text>
        <View style={styles.accountsGrid}>
          <TouchableOpacity
            style={styles.accountOption}
            activeOpacity={0.7}
            onPress={() => handleQuickSelect(DEV_TEST_ACCOUNTS.BUSINESS_OWNER_RAJ)}
          >
            <View style={[styles.accountIcon, { backgroundColor: '#EFF6FF' }]}>
              <Briefcase size={16} color={colors.accentBlue} />
            </View>
            <View style={styles.accountText}>
              <View style={styles.accountRow}>
                <Text style={styles.accountRole}>Raj (Business Owner)</Text>
                <Text style={styles.accountPhone}>7094310122</Text>
              </View>
              <Text style={styles.accountDesc}>Raj Engineering Works (1 Year Free Plan)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accountOption}
            activeOpacity={0.7}
            onPress={() => handleQuickSelect(DEV_TEST_ACCOUNTS.BUSINESS_OWNER_RASHIQ)}
          >
            <View style={[styles.accountIcon, { backgroundColor: '#EFF6FF' }]}>
              <Briefcase size={16} color={colors.accentBlue} />
            </View>
            <View style={styles.accountText}>
              <View style={styles.accountRow}>
                <Text style={styles.accountRole}>Rashiq (Business Owner)</Text>
                <Text style={styles.accountPhone}>9042938108</Text>
              </View>
              <Text style={styles.accountDesc}>Rashiq Trading & Logistics (6 Mo Free Plan)</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accountOption}
            activeOpacity={0.7}
            onPress={() => handleQuickSelect(DEV_TEST_ACCOUNTS.BUSINESS_OWNER_SURESH)}
          >
            <View style={[styles.accountIcon, { backgroundColor: '#EFF6FF' }]}>
              <Briefcase size={16} color={colors.accentBlue} />
            </View>
            <View style={styles.accountText}>
              <View style={styles.accountRow}>
                <Text style={styles.accountRole}>Suresh Natarajan</Text>
                <Text style={styles.accountPhone}>9876543210</Text>
              </View>
              <Text style={styles.accountDesc}>Kovai Precision Tools & Apex Infotech</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* NORMAL USERS */}
        <Text style={styles.groupLabel}>NORMAL USERS (DISCOVERY & VAULT)</Text>
        <View style={styles.accountsGrid}>
          <TouchableOpacity
            style={styles.accountOption}
            activeOpacity={0.7}
            onPress={() => handleQuickSelect(DEV_TEST_ACCOUNTS.NORMAL_USER_DHARANI)}
          >
            <View style={[styles.accountIcon, { backgroundColor: '#F1F5F9' }]}>
              <User size={16} color={colors.textPrimary} />
            </View>
            <View style={styles.accountText}>
              <View style={styles.accountRow}>
                <Text style={styles.accountRole}>Dharani (User)</Text>
                <Text style={styles.accountPhone}>9677840181</Text>
              </View>
              <Text style={styles.accountDesc}>Search, Digital Card Vault, Contact Leads</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.accountOption}
            activeOpacity={0.7}
            onPress={() => handleQuickSelect(DEV_TEST_ACCOUNTS.NORMAL_USER_RAVI)}
          >
            <View style={[styles.accountIcon, { backgroundColor: '#F1F5F9' }]}>
              <User size={16} color={colors.textPrimary} />
            </View>
            <View style={styles.accountText}>
              <View style={styles.accountRow}>
                <Text style={styles.accountRole}>Ravi Kumar (User)</Text>
                <Text style={styles.accountPhone}>1234567890</Text>
              </View>
              <Text style={styles.accountDesc}>Card Scanning & Discovery</Text>
            </View>
          </TouchableOpacity>
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    flexGrow: 1
  },
  header: {
    marginTop: spacing.xs,
    marginBottom: spacing.lg
  },
  title: {
    ...typography.titleLarge,
    color: colors.textPrimary,
    marginBottom: spacing.xs
  },
  subtitle: {
    ...typography.bodyMedium,
    color: colors.textSecondary
  },
  inputContainer: {
    marginBottom: spacing.lg
  },
  sendButton: {
    marginTop: spacing.sm,
    width: '100%'
  },
  devCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    marginTop: spacing.xs
  },
  devHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  devTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textPrimary,
    marginLeft: 6,
    letterSpacing: 0.5
  },
  devSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm
  },
  groupLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginTop: spacing.xs,
    marginBottom: 4
  },
  accountsGrid: {
    marginBottom: spacing.xs
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    marginBottom: 6,
    cursor: 'pointer'
  },
  accountIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm
  },
  accountText: {
    flex: 1
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  accountRole: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textPrimary
  },
  accountPhone: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary
  },
  accountDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1
  }
});
