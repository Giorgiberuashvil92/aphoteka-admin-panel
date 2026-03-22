// Aversi-inspired Typography System
// Note: For Georgian text, consider using NotoSansGeorgian font family
export const typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
    // For future: NotoSansGeorgian-Regular, NotoSansGeorgian-Medium, NotoSansGeorgian-SemiBold
  },
  
  // Font sizes (Aversi scale)
  fontSize: {
    caption: 10,   // Caption
    xs: 13,        // Body S
    sm: 14,        
    md: 16,        // Body L, Title M
    lg: 18,        
    xl: 20,        // Title L
    xxl: 25,       // H5
    xxxl: 31,      // H4
    h3: 39,        // H3
    h2: 49,        // H2
    h1: 61,        // H1
  },
  
  // Font weights
  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  
  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Text variants (predefined combinations)
  variants: {
    h1: {
      fontSize: 61,
      fontWeight: '600' as const,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: 49,
      fontWeight: '600' as const,
      lineHeight: 1.2,
    },
    h3: {
      fontSize: 39,
      fontWeight: '600' as const,
      lineHeight: 1.3,
    },
    h4: {
      fontSize: 31,
      fontWeight: '600' as const,
      lineHeight: 1.3,
    },
    h5: {
      fontSize: 25,
      fontWeight: '600' as const,
      lineHeight: 1.4,
    },
    titleL: {
      fontSize: 20,
      fontWeight: '400' as const,
      lineHeight: 1.4,
    },
    titleM: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 1.5,
    },
    bodyL: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 1.5,
    },
    bodyLMedium: {
      fontSize: 16,
      fontWeight: '500' as const,
      lineHeight: 1.5,
    },
    bodyLSemiBold: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 1.5,
    },
    bodyS: {
      fontSize: 13,
      fontWeight: '400' as const,
      lineHeight: 1.5,
    },
    bodySMedium: {
      fontSize: 13,
      fontWeight: '500' as const,
      lineHeight: 1.5,
    },
    bodySSemiBold: {
      fontSize: 13,
      fontWeight: '600' as const,
      lineHeight: 1.5,
    },
    caption: {
      fontSize: 10,
      fontWeight: '400' as const,
      lineHeight: 1.4,
    },
  },
};
