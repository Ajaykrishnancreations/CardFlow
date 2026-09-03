import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';
import { colors, radii, spacing, typography } from '../../theme';
import { Button } from '../../components/Button';
import { useAuth } from '../../context/AuthContext';

export function OnboardingScreen() {
  const { completeOnboarding } = useAuth();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    setLoading(true);
    try {
      await completeOnboarding({ name: name.trim() });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>What's your name?</Text>
      <Text style={styles.subtitle}>This will be shown on your CardFlow profile.</Text>

      <Text style={styles.label}>YOUR NAME</Text>
      <TextInput
        value={name}
        onChangeText={(v) => { setName(v); if (error) setError(''); }}
        placeholder="Enter name"
        placeholderTextColor={colors.textMuted}
        autoFocus
        style={styles.input}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button title="Continue" onPress={handleSubmit} loading={loading} size="lg" style={styles.cta} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bgMuted },
  content: { paddingHorizontal: spacing.xxl, paddingTop: 64, paddingBottom: spacing.xxxl },
  title: { ...typography.titleLarge, marginBottom: spacing.sm },
  subtitle: { ...typography.bodyMedium, marginBottom: spacing.xxxl },
  label: { ...typography.label, marginBottom: spacing.sm },
  input: {
    height: 52,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    outlineStyle: 'none'
  },
  error: { color: colors.danger, fontSize: 12, marginBottom: spacing.sm },
  cta: { marginTop: spacing.lg }
});
