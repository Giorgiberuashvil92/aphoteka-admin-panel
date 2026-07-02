import { fonts } from './fonts';

export const typography = {
  fontFamily: {
    regular: fonts.regular,
    medium: fonts.medium,
    semibold: fonts.semibold,
    bold: fonts.bold,
    extraBold: fonts.extraBold,
  },

  fontSize: {
    caption: 9,
    xs: 11,
    sm: 12,
    md: 14,
    lg: 15,
    xl: 17,
    xxl: 20,
    xxxl: 24,
    h3: 28,
    h2: 34,
    h1: 42,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },

  lineHeight: {
    tight: 1.2,
    normal: 1.45,
    relaxed: 1.65,
  },

  variants: {
    h1: {
      fontFamily: fonts.extraBold,
      fontSize: 42,
      lineHeight: 1.2,
    },
    h2: {
      fontFamily: fonts.bold,
      fontSize: 34,
      lineHeight: 1.2,
    },
    h3: {
      fontFamily: fonts.bold,
      fontSize: 28,
      lineHeight: 1.3,
    },
    h4: {
      fontFamily: fonts.semibold,
      fontSize: 24,
      lineHeight: 1.3,
    },
    h5: {
      fontFamily: fonts.semibold,
      fontSize: 20,
      lineHeight: 1.35,
    },
    titleL: {
      fontFamily: fonts.medium,
      fontSize: 17,
      lineHeight: 1.4,
    },
    titleM: {
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 1.45,
    },
    bodyL: {
      fontFamily: fonts.regular,
      fontSize: 14,
      lineHeight: 1.45,
    },
    bodyLMedium: {
      fontFamily: fonts.medium,
      fontSize: 14,
      lineHeight: 1.45,
    },
    bodyLSemiBold: {
      fontFamily: fonts.semibold,
      fontSize: 14,
      lineHeight: 1.45,
    },
    bodyS: {
      fontFamily: fonts.regular,
      fontSize: 12,
      lineHeight: 1.45,
    },
    bodySMedium: {
      fontFamily: fonts.medium,
      fontSize: 12,
      lineHeight: 1.45,
    },
    bodySSemiBold: {
      fontFamily: fonts.semibold,
      fontSize: 12,
      lineHeight: 1.45,
    },
    caption: {
      fontFamily: fonts.regular,
      fontSize: 9,
      lineHeight: 1.4,
    },
  },
};
