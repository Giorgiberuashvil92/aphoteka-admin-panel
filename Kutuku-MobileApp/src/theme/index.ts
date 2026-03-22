import { Platform } from 'react-native';
import { colors } from './colors';
import { spacing } from './spacing';
import { typography } from './typography';

export const theme = {
  colors,
  spacing,
  typography,
  
  // Border radius (Aversi-inspired)
  borderRadius: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },
  
  // Shadows (Aversi shadow system - 5 levels)
  shadows: {
    xs: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.12,
        shadowRadius: 1,
      },
      android: {
        elevation: 1,
      },
    }),
    sm: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.14,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
    md: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.16,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
    lg: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
      android: {
        elevation: 6,
      },
    }),
    xl: Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
};

export type Theme = typeof theme;
