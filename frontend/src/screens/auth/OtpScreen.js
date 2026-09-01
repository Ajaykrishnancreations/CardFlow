import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft } from 'lucide-react';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { OtpBoxes } from '../../components/OtpBoxes';
import { useAuth } from '../../context/AuthContext';

function formatPhone(p) {
  const d = p.replace(/\D/g, '');
  if (d.length === 10) return `${d.slice(0, 5)} ${d.slice(5)}`;
  return p;
}

export function OtpScreen({ phone, onBackToPhone }) {
  const { verifyOtp, sendOtp, isLoading, lastSentOtp } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);

  const activeOtp = lastSentOtp || '123456';

  useEffect(() => {
    let timer;
    if (countdown > 0) timer = setInterval(() => setCountdown((p) => p - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = async (code) => {
    const entered = (code || otp).trim();
    if (entered.length !== 6) {
      setError('Enter the complete 6-digit code');
      return;
    }
    setError('');
    const res = await verifyOtp(phone, entered);
    if (!res.success) setError(res.error || 'Invalid OTP');
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setCountdown(30);
    await sendOtp(phone);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={onBackToPhone} style={styles.backBtn}>
        <ArrowLeft size={22} color={colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title}>Verify OTP</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to{'\n'}
        <Text style={styles.phone}>+91 {formatPhone(phone)}</Text>
      </Text>

      <OtpBoxes
        value={otp}
        onChange={(v) => { setOtp(v); if (error) setError(''); }}
        onComplete={handleVerify}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.timer}>
        {countdown > 0 ? `Resend OTP in 00:${String(countdown).padStart(2, '0')}` : (
          <Text onPress={handleResend} style={styles.resendLink}>Resend OTP</Text>
        )}
      </Text>

      <Button title="Verify" onPress={() => handleVerify()} loading={isLoading} size="lg" style={styles.cta} />

      <View style={styles.devHint}>
        <Text style={styles.devText}>Your code: <Text style={styles.devCode}>{activeOtp}</Text></Text>
        <TouchableOpacity onPress={() => { setOtp(activeOtp); handleVerify(activeOtp); }}>
          <Text style={styles.devFill}>Quick fill & verify</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxxl,
    backgroundColor: colors.bgMuted
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', marginBottom: spacing.lg },
  title: { ...typography.titleLarge, marginBottom: spacing.sm },
  subtitle: { ...typography.bodyMedium, lineHeight: 22, marginBottom: spacing.md },
  phone: { fontWeight: '700', color: colors.textPrimary },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginBottom: spacing.sm },
  timer: { textAlign: 'center', fontSize: 13, color: colors.textMuted, marginBottom: spacing.lg },
  resendLink: { color: colors.primary, fontWeight: '600' },
  cta: { marginTop: spacing.sm },
  devHint: { marginTop: spacing.xxxl, alignItems: 'center', opacity: 0.75 },
  devText: { fontSize: 12, color: colors.textSecondary },
  devCode: { fontWeight: '800', color: colors.primary },
  devFill: { fontSize: 12, color: colors.primary, fontWeight: '600', marginTop: 6, textDecorationLine: 'underline' }
});
