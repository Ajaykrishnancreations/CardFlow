// CardFlow Royal Design System — matches cardflow-royal-connect.lovable.app
import { DEFAULT_PRIMARY, darken, lighten, withAlpha } from './palette';
import { loadThemePrefs } from './themeStorage';

// Exact original brand palette — always what "Reset to Default" restores.
const ORIGINAL_COLORS = {
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
  info: '#2563EB',
  infoLight: '#EFF6FF'
};

function buildColors(primary, secondary, isDark) {
  // A distinct, richer shade of the chosen color for "gold"/premium accents
  // (share icon, GST badges, premium card templates) — deep in light mode so
  // it reads as a deliberate second tone, lifted in dark mode so it doesn't
  // vanish against near-black backgrounds. Keeps everything in one color
  // family instead of a clashing unrelated hue, while avoiding a flat look
  // where every accent is the exact same shade as the primary buttons.
  const accentGold = isDark ? lighten(primary, 0.4) : darken(primary, 0.32);
  // "Info" (Enquire, etc.) is a fixed semantic blue, same idea as success/danger
  // staying green/red regardless of theme — guarantees it always reads as a
  // distinct action from "Call", instead of a subtle tint of the same hue.
  const infoColor = isDark ? '#60A5FA' : '#2563EB';
  const infoLightColor = isDark ? 'rgba(96, 165, 250, 0.18)' : '#EFF6FF';

  if (!isDark) {
    return {
      primary,
      primaryHover: darken(primary, 0.15),
      primaryLight: withAlpha(primary, 0.08),
      primaryMuted: withAlpha(primary, 0.08),

      gold: accentGold,
      goldLight: withAlpha(accentGold, 0.16),

      secondary,
      secondaryLight: withAlpha(secondary, 0.16),

      accent: primary,

      verifiedGst: accentGold,
      verifiedGstBg: withAlpha(accentGold, 0.16),
      verifiedId: primary,
      verifiedIdBg: withAlpha(primary, 0.08),

      bgDark: '#17151A',
      bgSurface: '#FFFFFF',
      bgCard: '#FFFFFF',
      bgCardDark: '#FFFFFF',
      bgMuted: '#FAFAF8',
      bgMutedDark: withAlpha(primary, 0.05),
      border: '#E8E4EA',
      borderDark: '#D5D0DA',

      textPrimary: '#17151A',
      textSecondary: '#77727D',
      textMuted: '#9B959F',
      textWhite: '#FFFFFF',

      success: '#059669',
      successLight: '#ECFDF5',
      warning: accentGold,
      warningLight: withAlpha(accentGold, 0.16),
      danger: '#DC2626',
      dangerLight: '#FEE2E2',
      info: infoColor,
      infoLight: infoLightColor
    };
  }

  return {
    primary,
    primaryHover: darken(primary, 0.18),
    primaryLight: withAlpha(primary, 0.18),
    primaryMuted: withAlpha(primary, 0.14),

    gold: accentGold,
    goldLight: withAlpha(accentGold, 0.2),

    secondary,
    secondaryLight: withAlpha(secondary, 0.2),

    accent: primary,

    verifiedGst: accentGold,
    verifiedGstBg: withAlpha(accentGold, 0.2),
    verifiedId: primary,
    verifiedIdBg: withAlpha(primary, 0.18),

    bgDark: '#0B0A0D',
    bgSurface: '#1C1A20',
    bgCard: '#231F29',
    bgCardDark: '#231F29',
    bgMuted: '#141218',
    bgMutedDark: '#231F29',
    border: '#322D3A',
    borderDark: '#3E3847',

    textPrimary: '#F5F3F7',
    textSecondary: '#B8B2C2',
    textMuted: '#7C7686',
    textWhite: '#FFFFFF',

    success: '#34D399',
    successLight: 'rgba(52, 211, 153, 0.16)',
    warning: accentGold,
    warningLight: withAlpha(accentGold, 0.2),
    danger: '#F87171',
    dangerLight: 'rgba(248, 113, 113, 0.16)',
    info: infoColor,
    infoLight: infoLightColor
  };
}

const savedPrefs = loadThemePrefs();
const activePrimary = savedPrefs?.primary || DEFAULT_PRIMARY;
const activeSecondary = activePrimary;
const activeDarkMode = !!savedPrefs?.darkMode;
const isCustomized = activePrimary !== DEFAULT_PRIMARY;

export const activeTheme = {
  primary: activePrimary,
  secondary: activeSecondary,
  darkMode: activeDarkMode
};

export const colors = (!isCustomized && !activeDarkMode)
  ? ORIGINAL_COLORS
  : buildColors(activePrimary, activeSecondary, activeDarkMode);

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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2
  },
  md: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4
  },
  lg: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8
  },
  scan: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 10
  }
};
