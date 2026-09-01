import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { ArrowLeft, Check } from 'lucide-react';
import { colors, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { OtpBoxes } from '../../components/OtpBoxes';
import { useAuth } from '../../context/AuthContext';

function maskPhone(p) {
  const d = String(p || '').replace(/\D/g, '');
  const last = d.slice(-4);
  return `+91 ••••• ${last}`;
}

export function OtpScreen({ phone, onBackToPhone }) {
  const { verifyOtp, sendOtp, isLoading } = useAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(30);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const successScale = useRef(new Animated.Value(0.6)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;

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
    if (verifying || isLoading) return;
    setError('');
    setVerifying(true);
    const res = await verifyOtp(phone, entered, {
      beforeCommit: async () => {
        setSuccess(true);
        Animated.parallel([
          Animated.timing(successOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.spring(successScale, { toValue: 1, friction: 7, useNativeDriver: true })
        ]).start();
        await new Promise((r) => setTimeout(r, 420));
      }
    });
    if (!res.success) {
      setSuccess(false);
      setVerifying(false);
      const msg = (res.error || '').toLowerCase();
      if (msg.includes('expir')) setError('OTP expired. Please request a new code.');
      else if (msg.includes('network') || msg.includes('wrong')) setError(res.error);
      else setError(res.error || 'Invalid OTP. Please check the code and try again.');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setCountdown(30);
    setError('');
    const res = await sendOtp(phone);
    if (!res.success) {
      setError(res.error || "Couldn't send OTP. Please try again.");
      setCountdown(0);
    }
  };

  if (success) {
    return (
      <View style={styles.successScreen}>
        <Animated.View style={[styles.successCircle, { opacity: successOpacity, transform: [{ scale: successScale }] }]}>
          <Check size={28} color="#FFFFFF" strokeWidth={2.5} />
        </Animated.View>
        <Text style={styles.successText}>Verified</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <TouchableOpacity onPress={onBackToPhone} style={styles.backBtn} accessibilityLabel="Back">
        <ArrowLeft size={22} color={colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title}>Verify your number</Text>
      <Text style={styles.subtitle}>
        Enter the 6-digit code sent to{'\n'}
        <Text style={styles.phone}>{maskPhone(phone)}</Text>
      </Text>

      <OtpBoxes
        value={otp}
        autoFocus
        onChange={(v) => { setOtp(v); if (error) setError(''); }}
        onComplete={handleVerify}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.hint}>Didn't receive the code?</Text>
      <Text style={styles.timer}>
        {countdown > 0 ? (
          `Resend OTP in 00:${String(countdown).padStart(2, '0')}`
        ) : (
          <Text onPress={handleResend} style={styles.resendLink}>Resend OTP</Text>
        )}
      </Text>

      <Button
        title={verifying || isLoading ? 'Verifying...' : 'Verify'}
        onPress={() => handleVerify()}
        loading={verifying || isLoading}
        size="lg"
        style={styles.cta}
      />
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
  backBtn: { width: 44, height: 44, justifyContent: 'center', marginBottom: spacing.md },
  title: { ...typography.titleLarge, marginBottom: spacing.sm },
  subtitle: { ...typography.bodyMedium, lineHeight: 22, marginBottom: spacing.md },
  phone: { fontWeight: '700', color: colors.textPrimary },
  error: { color: colors.danger, fontSize: 13, textAlign: 'center', marginBottom: spacing.sm },
  hint: { textAlign: 'center', fontSize: 13, color: colors.textMuted, marginBottom: 4 },
  timer: { textAlign: 'center', fontSize: 13, color: colors.textMuted, marginBottom: spacing.lg },
  resendLink: { color: colors.primary, fontWeight: '600' },
  cta: { marginTop: spacing.sm },
  successScreen: {
    flex: 1,
    backgroundColor: colors.bgMuted,
    alignItems: 'center',
    justifyContent: 'center'
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md
  },
  successText: { fontSize: 18, fontWeight: '700', color: colors.textPrimary }
});
