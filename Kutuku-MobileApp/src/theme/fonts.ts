import { StyleSheet, Text, TextInput } from 'react-native';

export const fonts = {
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semibold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
  extraBold: 'Montserrat_800ExtraBold',
} as const;

type FontWeightKey = '400' | '500' | '600' | '700' | '800' | 'bold' | 'normal';

export function fontForWeight(weight?: FontWeightKey | string | number): string {
  const w = String(weight ?? '400');
  if (w === '800' || w === '900') return fonts.extraBold;
  if (w === '700' || w === 'bold') return fonts.bold;
  if (w === '600') return fonts.semibold;
  if (w === '500') return fonts.medium;
  return fonts.regular;
}

/** Montserrat as default for all Text / TextInput after fonts load */
export function applyGlobalFonts(): void {
  const base = StyleSheet.create({
    text: { fontFamily: fonts.regular },
  }).text;

  const textDefaults = (Text as unknown as { defaultProps?: { style?: object } }).defaultProps ?? {};
  (Text as unknown as { defaultProps: { style?: object } }).defaultProps = {
    ...textDefaults,
    style: [base, textDefaults.style],
  };

  const inputDefaults = (TextInput as unknown as { defaultProps?: { style?: object } }).defaultProps ?? {};
  (TextInput as unknown as { defaultProps: { style?: object } }).defaultProps = {
    ...inputDefaults,
    style: [base, inputDefaults.style],
  };
}
