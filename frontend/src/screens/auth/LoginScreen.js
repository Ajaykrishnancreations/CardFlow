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

      {/* Development Quick Test Accounts */}
      <Card style={styles.devCard}>
        <View style={styles.devHeader}>
          <Sparkles size={16} color={colors.warning} />
          <Text style={styles.devTitle}>DEVELOPMENT TEST ACCOUNTS</Text>
        </View>
        <Text style={styles.devSubtitle}>
          Select a test account below for instant 1-tap testing:
        </Text>

        <TouchableOpacity
          style={styles.accountOption}
          activeOpacity={0.7}
          onPress={() => handleQuickSelect(DEV_TEST_ACCOUNTS.NORMAL_USER)}
        >
          <View style={[styles.accountIcon, { backgroundColor: '#F1F5F9' }]}>
            <User size={18} color={colors.textPrimary} />
          </View>
          <View style={styles.accountText}>
            <View style={styles.accountRow}>
              <Text style={styles.accountRole}>Normal User</Text>
              <Text style={styles.accountPhone}>1234567890</Text>
            </View>
            <Text style={styles.accountDesc}>Search, Vault, AI Scanner & Contact actions</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.accountOption}
          activeOpacity={0.7}
          onPress={() => handleQuickSelect(DEV_TEST_ACCOUNTS.BUSINESS_OWNER)}
        >
          <View style={[styles.accountIcon, { backgroundColor: '#EFF6FF' }]}>
            <Briefcase size={18} color={colors.primary} />
          </View>
          <View style={styles.accountText}>
            <View style={styles.accountRow}>
              <Text style={styles.accountRole}>Business Owner</Text>
              <Text style={styles.accountPhone}>9876543210</Text>
            </View>
            <Text style={styles.accountDesc}>Manage 2+ Businesses, QR Cards, Enquiries</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.accountOption}
          activeOpacity={0.7}
          onPress={() => handleQuickSelect(DEV_TEST_ACCOUNTS.ADMIN)}
        >
          <View style={[styles.accountIcon, { backgroundColor: '#FEE2E2' }]}>
            <Shield size={18} color={colors.danger} />
          </View>
          <View style={styles.accountText}>
            <View style={styles.accountRow}>
              <Text style={styles.accountRole}>Admin (In-App)</Text>
              <Text style={styles.accountPhone}>9999988888</Text>
            </View>
            <Text style={styles.accountDesc}>KYC Queue, Moderation, User/Biz Management</Text>
          </View>
        </TouchableOpacity>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    padding: spacing.xl,
    backgroundColor: '#FFFFFF',
    flexGrow: 1
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.xl
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
    marginBottom: spacing.xl
  },
  sendButton: {
    marginTop: spacing.sm,
    width: '100%'
  },
  devCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    marginTop: spacing.sm
  },
  devHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs
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
    marginBottom: spacing.md
  },
  accountOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    marginBottom: spacing.sm,
    cursor: 'pointer'
  },
  accountIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md
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
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  accountPhone: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary
  },
  accountDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2
  }
});
