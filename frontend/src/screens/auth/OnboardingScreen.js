import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Search, Briefcase, CheckCircle2, User, Building, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { colors, radii, spacing, typography } from '../../theme';
import { Input } from '../../components/Input';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { useAuth } from '../../context/AuthContext';

export function OnboardingScreen({ onFinish }) {
  const { user, completeOnboarding } = useAuth();

  // Intent selection: 'user' (Browse/Search) vs 'owner' (Business Owner/Shop)
  const [selectedRole, setSelectedRole] = useState('user');
  const [name, setName] = useState(user?.name || '');
  const [dob, setDob] = useState('');
  const [city, setCity] = useState(user?.city || 'Coimbatore');
  const [state, setState] = useState(user?.state || 'Tamil Nadu');
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState('Manufacturing');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (selectedRole === 'owner' && !businessName.trim()) {
      setError('Please enter your business or shop name');
      return;
    }

    setError('');
    completeOnboarding({
      name: name.trim(),
      dob: dob.trim(),
      city: city.trim(),
      state: state.trim(),
      role: selectedRole,
      businessName: businessName.trim(),
      category: category
    });

    if (onFinish) onFinish();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.welcomeBadge}>FIRST-TIME SETUP</Text>
        <Text style={styles.title}>Welcome to CardFlow</Text>
        <Text style={styles.subtitle}>
          Choose how you would like to use CardFlow and complete your profile.
        </Text>
      </View>

      {/* Role / Intent Selection */}
      <Text style={styles.sectionTitle}>SELECT YOUR PRIMARY GOAL</Text>

      {/* Option 1: Discover & Browse Businesses */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedRole('user')}
        style={[
          styles.roleCard,
          selectedRole === 'user' && styles.roleCardActive
        ]}
      >
        <View style={styles.roleCardTop}>
          <View style={[styles.roleIconCircle, { backgroundColor: '#F1F5F9' }]}>
            <Search size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.roleTitle}>Looking to Discover & Browse</Text>
            <Text style={styles.roleSubtitle}>
              Find local verified MSMEs, shops, vendors, save digital business cards, and direct contact.
            </Text>
          </View>
          {selectedRole === 'user' && (
            <CheckCircle2 size={22} color={colors.primary} style={{ marginLeft: spacing.xs }} />
          )}
        </View>
      </TouchableOpacity>

      {/* Option 2: Business Owner / Shop Provider */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setSelectedRole('owner')}
        style={[
          styles.roleCard,
          selectedRole === 'owner' && styles.roleCardActive
        ]}
      >
        <View style={styles.roleCardTop}>
          <View style={[styles.roleIconCircle, { backgroundColor: '#EFF6FF' }]}>
            <Briefcase size={22} color={colors.accentBlue} />
          </View>
          <View style={{ flex: 1, marginLeft: spacing.md }}>
            <Text style={styles.roleTitle}>I am a Business Owner / Shop</Text>
            <Text style={styles.roleSubtitle}>
              List my business, generate Counter QR stands, collect WhatsApp leads, and share digital cards.
            </Text>
          </View>
          {selectedRole === 'owner' && (
            <CheckCircle2 size={22} color={colors.primary} style={{ marginLeft: spacing.xs }} />
          )}
        </View>
      </TouchableOpacity>

      {/* Profile Details Form */}
      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>YOUR PROFILE DETAILS</Text>

      <Card style={styles.formCard}>
        <Input
          label="FULL NAME *"
          placeholder="e.g. Ajay / Raj / Dharani"
          value={name}
          onChangeText={(val) => {
            setName(val);
            if (error) setError('');
          }}
          leftIcon={User}
        />

        <Input
          label="DATE OF BIRTH / YEAR OF BIRTH"
          placeholder="DD/MM/YYYY (e.g. 15/08/1995)"
          value={dob}
          onChangeText={setDob}
          leftIcon={Calendar}
        />

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Input
              label="CITY"
              placeholder="e.g. Coimbatore"
              value={city}
              onChangeText={setCity}
              leftIcon={MapPin}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Input
              label="STATE"
              placeholder="e.g. Tamil Nadu"
              value={state}
              onChangeText={setState}
            />
          </View>
        </View>

        {/* Business Details (If Owner) */}
        {selectedRole === 'owner' && (
          <View style={styles.bizFields}>
            <View style={styles.divider} />
            <Text style={styles.bizHeader}>BUSINESS / SHOP INFORMATION</Text>
            
            <Input
              label="BUSINESS OR SHOP NAME *"
              placeholder="e.g. Kovai CNC Tools / Raj Trading"
              value={businessName}
              onChangeText={(val) => {
                setBusinessName(val);
                if (error) setError('');
              }}
              leftIcon={Building}
            />

            <Input
              label="PRIMARY INDUSTRY / CATEGORY"
              placeholder="e.g. Manufacturing, IT & Software, Hardware"
              value={category}
              onChangeText={setCategory}
            />
          </View>
        )}

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Button
          title={selectedRole === 'owner' ? 'Register & Open Business Portal' : 'Save & Start Exploring'}
          onPress={handleSubmit}
          icon={ArrowRight}
          size="lg"
          style={{ marginTop: spacing.md }}
        />
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
    marginTop: spacing.sm,
    marginBottom: spacing.lg
  },
  welcomeBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 1,
    marginBottom: 4
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.sm
  },
  roleCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    cursor: 'pointer'
  },
  roleCardActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4'
  },
  roleCardTop: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  roleIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center'
  },
  roleTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary
  },
  roleSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 16
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    padding: spacing.lg
  },
  bizFields: {
    marginTop: spacing.sm
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md
  },
  bizHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.accentBlue,
    letterSpacing: 0.5,
    marginBottom: spacing.sm
  },
  errorText: {
    fontSize: 12,
    color: colors.danger,
    marginTop: spacing.xs,
    fontWeight: '600'
  }
});
