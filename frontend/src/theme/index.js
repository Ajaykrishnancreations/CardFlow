// CardFlow Design System & Theme Tokens

export const colors = {
  // Brand colors
  primary: '#2563EB',       // Blue 600
  primaryHover: '#1D4ED8',  // Blue 700
  primaryLight: '#EFF6FF',  // Blue 50
  primaryDark: '#1E40AF',   // Blue 800

  secondary: '#4F46E5',     // Indigo 600
  secondaryLight: '#EEF2FF',

  accent: '#06B6D4',        // Cyan 500

  // Trust & Verification colors
  verifiedGst: '#059669',   // Emerald 600
  verifiedGstBg: '#ECFDF5', // Emerald 50
  verifiedId: '#0284C7',    // Sky 600
  verifiedIdBg: '#F0F9FF',  // Sky 50

  // Neutral palette
  bgDark: '#0B1120',        // Slate 950
  bgSurface: '#1E293B',     // Slate 800
  bgCard: '#FFFFFF',
  bgCardDark: '#1E293B',
  bgMuted: '#F8FAFC',       // Slate 50
  bgMutedDark: '#0F172A',   // Slate 900
  border: '#E2E8F0',        // Slate 200
  borderDark: '#334155',    // Slate 700

  // Typography
  textPrimary: '#0F172A',   // Slate 900
  textSecondary: '#64748B', // Slate 500
  textMuted: '#94A3B8',     // Slate 400
  textWhite: '#FFFFFF',

  // Feedback
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE'
};

export const typography = {
  titleLarge: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 32,
    color: colors.textPrimary
  },
  titleMedium: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 28,
    color: colors.textPrimary
  },
  titleSmall: {
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 24,
    color: colors.textPrimary
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textSecondary
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textSecondary
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.textMuted
  },
  button: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20
  },
  caption: {
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 14,
    color: colors.textMuted
  }
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32
};

export const radii = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8
  }
};
