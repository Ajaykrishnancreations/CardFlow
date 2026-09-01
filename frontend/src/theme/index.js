// CardFlow Royal Design System — matches cardflow-royal-connect.lovable.app

export const colors = {
  primary: '#32145F',
  primaryHover: '#28104D',
  primaryLight: '#F3EDFA',
  primaryMuted: 'rgba(50, 20, 95, 0.08)',

  gold: '#B89445',
  goldLight: '#F5EDD8',

  secondary: '#32145F',
  secondaryLight: '#F3EDFA',

  accent: '#32145F',

  verifiedGst: '#B89445',
  verifiedGstBg: '#F5EDD8',
  verifiedId: '#32145F',
  verifiedIdBg: '#F3EDFA',

  bgDark: '#17151A',
  bgSurface: '#FFFFFF',
  bgCard: '#FFFFFF',
  bgCardDark: '#FFFFFF',
  bgMuted: '#FAFAF8',
  bgMutedDark: '#F3F1F5',
  border: '#E8E4EA',
  borderDark: '#D5D0DA',

  textPrimary: '#17151A',
  textSecondary: '#77727D',
  textMuted: '#9B959F',
  textWhite: '#FFFFFF',

  success: '#059669',
  successLight: '#ECFDF5',
  warning: '#B89445',
  warningLight: '#F5EDD8',
  danger: '#DC2626',
  dangerLight: '#FEE2E2',
  info: '#32145F',
  infoLight: '#F3EDFA'
};

export const fonts = {
  serif: '"Playfair Display", Georgia, "Times New Roman", serif',
  sans: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
};

export const typography = {
  titleLarge: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 36,
    color: colors.textPrimary,
    fontFamily: fonts.serif
  },
  titleMedium: {
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 30,
    color: colors.textPrimary,
    fontFamily: fonts.serif
  },
  titleSmall: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    color: colors.textPrimary,
    fontFamily: fonts.serif
  },
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 24,
    color: colors.textSecondary,
    fontFamily: fonts.sans
  },
  bodyMedium: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
    color: colors.textSecondary,
    fontFamily: fonts.sans
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
    color: colors.textMuted,
    fontFamily: fonts.sans
  },
  button: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
    fontFamily: fonts.sans
  },
  caption: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    color: colors.textMuted,
    fontFamily: fonts.sans,
    letterSpacing: 0.6,
    textTransform: 'uppercase'
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 14,
    color: colors.textMuted,
    fontFamily: fonts.sans,
    letterSpacing: 0.8,
    textTransform: 'uppercase'
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
  xs: 8,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 9999,
  // Semantic aliases — use these in screens
  card: 18,
  button: 14,
  input: 14,
  chip: 9999,
  tab: 9999,
  badge: 8,
  modal: 20
};

export const shadows = {
  sm: {
    shadowColor: '#32145F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2
  },
  md: {
    shadowColor: '#32145F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  lg: {
    shadowColor: '#32145F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8
  },
  scan: {
    shadowColor: '#32145F',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10
  }
};
