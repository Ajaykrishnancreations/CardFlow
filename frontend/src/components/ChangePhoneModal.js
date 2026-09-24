import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { Phone, X } from 'lucide-react';
import { colors, spacing, radii, typography } from '../theme';
import { Input } from './Input';
import { Button } from './Button';
import { OtpBoxes } from './OtpBoxes';
import { Snackbar } from './Snackbar';
import { useAuth } from '../context/AuthContext';

function formatDisplay(phone) {
  const digits = (phone || '').replace(/\D/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
}

const OTP_DURATION = 120; // 2 minutes, per requirement

// "Change Number" on the profile — confirm the new number, verify it's really
// theirs via OTP, only then write it to the account. Never touches the
// session/login state (that's sendOtp/verifyOtp's job for the auth screens).
export function ChangePhoneModal({ visible, currentPhone, onClose, onUpdated }) {
  const { sendOtp, changePhone, lastSentOtp } = useAuth();
  const [step, setStep] = useState('phone');
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(OTP_DURATION);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '', type: 'success' });

  useEffect(() => {
    if (visible) {
      setStep('phone');
      setPhoneDigits(formatDisplay(currentPhone));
      setOtp('');
      setError('');
      setCountdown(OTP_DURATION);
    }
  }, [visible, currentPhone]);

  useEffect(() => {
    if (step !== 'otp' || countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [step, countdown]);

  const showToast = (message, type = 'success') => setSnackbar({ visible: true, message, type });

  const handleSendOtp = async () => {
    const digits = phoneDigits.replace(/\D/g, '');
    if (digits.length !== 10) {
      setError('Please enter your 10-digit mobile number.');
      return;
    }
    setError('');
    setSending(true);
    const res = await sendOtp(digits);
    setSending(false);
    if (!res.success) {
      showToast(res.error || "Couldn't send OTP. Please try again.", 'error');
      return;
    }
    showToast(`OTP sent to +91 ${digits}`, 'success');
    setOtp('');
    setCountdown(OTP_DURATION);
    setStep('otp');
  };

  const handleVerify = async (code) => {
    const entered = (code || otp).trim();
    if (entered.length !== 6) {
      setError('Enter the complete 6-digit code.');
      return;
    }
    setError('');
    setVerifying(true);
    try {
      await changePhone(phoneDigits.replace(/\D/g, ''), entered);
      setVerifying(false);
      showToast('Mobile number updated successfully.', 'success');
      onUpdated && onUpdated();
      setTimeout(onClose, 900);
    } catch (e) {
      setVerifying(false);
      setError(e?.message || 'Invalid OTP. Please check the code and try again.');
      showToast(e?.message || 'Could not verify OTP.', 'error');
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    const digits = phoneDigits.replace(/\D/g, '');
    const res = await sendOtp(digits);
    if (!res.success) {
      showToast(res.error || "Couldn't send OTP. Please try again.", 'error');
      return;
    }
    showToast(`OTP sent to +91 ${digits}`, 'success');
    setCountdown(OTP_DURATION);
  };

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Update Mobile Number</Text>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <X size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {step === 'phone' ? (
            <>
              <Input
                label="MOBILE NUMBER"
                value={phoneDigits}
                onChangeText={(v) => { setPhoneDigits(v.replace(/\D/g, '').slice(0, 10)); if (error) setError(''); }}
                leftIcon={Phone}
                keyboardType="number-pad"
                maxLength={10}
                placeholder="10-digit mobile number"
                autoFocus
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <View style={styles.actionsRow}>
                <Button title="Cancel" variant="outline" onPress={onClose} style={{ flex: 1, marginRight: spacing.sm }} />
                <Button title={sending ? 'Sending…' : 'Send OTP'} onPress={handleSendOtp} loading={sending} style={{ flex: 1 }} />
              </View>
            </>
          ) : (
            <>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to{'\n'}
                <Text style={styles.phone}>+91 {phoneDigits}</Text>
              </Text>
              <OtpBoxes
                value={otp}
                autoFocus
                onChange={(v) => { setOtp(v); if (error) setError(''); }}
                onComplete={handleVerify}
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Text style={styles.timer}>
                {countdown > 0 ? (
                  `Resend OTP in ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
                ) : (
                  <Text onPress={handleResend} style={styles.resendLink}>Resend OTP</Text>
                )}
              </Text>
              <Button
                title={verifying ? 'Verifying…' : 'Verify'}
                onPress={() => handleVerify()}
                loading={verifying}
                size="lg"
                style={{ marginTop: spacing.sm }}
              />
              <Button title="Back" variant="outline" onPress={() => setStep('phone')} style={{ marginTop: spacing.sm }} />
              {lastSentOtp ? (
                <Text style={styles.otpPreview}>OTP: {lastSentOtp}</Text>
              ) : null}
            </>
          )}
        </View>
      </View>

      <Snackbar
        visible={snackbar.visible}
        message={snackbar.message}
        type={snackbar.type}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.65)', justifyContent: 'center', padding: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radii.lg, padding: spacing.lg, maxWidth: 420, width: '100%', alignSelf: 'center' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: { ...typography.titleSmall, color: colors.textPrimary },
  subtitle: { ...typography.bodyMedium, color: colors.textSecondary, marginBottom: spacing.md, lineHeight: 20 },
  phone: { fontWeight: '700', color: colors.textPrimary },
  error: { color: colors.danger, fontSize: 13, marginTop: -4, marginBottom: spacing.sm },
  actionsRow: { flexDirection: 'row', marginTop: spacing.sm },
  timer: { textAlign: 'center', fontSize: 13, color: colors.textMuted, marginTop: spacing.md, marginBottom: 4 },
  resendLink: { color: colors.primary, fontWeight: '600' },
  otpPreview: {
    marginTop: spacing.md,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 1
  }
});
