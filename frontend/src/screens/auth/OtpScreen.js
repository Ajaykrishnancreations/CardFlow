import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { KeyRound, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useAuth } from '../../context/AuthContext';

export function OtpScreen({ phone, onVerified, onBackToPhone }) {
  const { verifyOtp, sendOtp, isLoading, lastSentOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);

  const activeOtp = lastSentOtp || '123456';

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async (enteredOtp) => {
    const code = (enteredOtp || otp).trim();
    if (!code || code.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setError('');
    const res = await verifyOtp(phone, code);
    if (res.success) {
      onVerified(res.user);
    } else {
      setError(res.error || 'Invalid OTP code');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setCountdown(30);
    setError('');
    await sendOtp(phone);
  };

  const handleFillDevOtp = () => {
    setOtp(activeOtp);
    handleVerify(activeOtp);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.title}>Verify OTP Code</Text>
        <Text style={styles.subtitle}>
          We sent a 6-digit code to{' '}
          <Text style={styles.phoneHighlight}>+91 {phone}</Text>
        </Text>
        <TouchableOpacity onPress={onBackToPhone} style={styles.changePhoneBtn}>
          <Text style={styles.changePhoneText}>Change Number</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.inputContainer}>
        <Input
          label="6-DIGIT CODE"
          placeholder="123456"
          value={otp}
          onChangeText={(text) => {
            setOtp(text.replace(/[^0-9]/g, ''));
            if (error) setError('');
            if (text.length === 6) {
              handleVerify(text);
            }
          }}
          keyboardType="numeric"
          maxLength={6}
          leftIcon={KeyRound}
          error={error}
          autoFocus={true}
          inputStyle={styles.otpInput}
        />

        <Button
          title="Verify & Continue"
          onPress={() => handleVerify()}
          loading={isLoading}
          icon={CheckCircle2}
          size="lg"
          style={styles.verifyButton}
        />

        {/* Resend Action */}
        <View style={styles.resendContainer}>
          {countdown > 0 ? (
            <Text style={styles.countdownText}>
              Resend OTP in <Text style={{ fontWeight: '700' }}>{countdown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
              <RotateCcw size={14} color={colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Dev Quick Helper */}
      <Card style={styles.devCard}>
        <View style={styles.devHeader}>
          <AlertTriangle size={16} color={colors.warning} />
          <Text style={styles.devTitle}>VERIFICATION CODE</Text>
        </View>
        <Text style={styles.devDesc}>
          Your verification OTP is <Text style={{ fontWeight: '800', color: colors.primary }}>{activeOtp}</Text>.
        </Text>
        <Button
          title={`Quick Fill & Verify (${activeOtp})`}
          variant="outline"
          size="sm"
          onPress={handleFillDevOtp}
          style={styles.quickFillBtn}
        />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
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
  phoneHighlight: {
    fontWeight: '700',
    color: colors.textPrimary
  },
  changePhoneBtn: {
    marginTop: spacing.xs
  },
  changePhoneText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600'
  },
  inputContainer: {
    marginBottom: spacing.xl
  },
  otpInput: {
    letterSpacing: 8,
    fontSize: 20,
    fontWeight: '700'
  },
  verifyButton: {
    marginTop: spacing.sm,
    width: '100%'
  },
  resendContainer: {
    alignItems: 'center',
    marginTop: spacing.lg
  },
  countdownText: {
    fontSize: 13,
    color: colors.textMuted
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  resendText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary
  },
  devCard: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    marginTop: spacing.sm
  },
  devHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4
  },
  devTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
    marginLeft: 6
  },
  devDesc: {
    fontSize: 12,
    color: '#78350F',
    marginBottom: spacing.sm
  },
  quickFillBtn: {
    borderColor: '#B45309',
    backgroundColor: '#FFFFFF'
  }
});
