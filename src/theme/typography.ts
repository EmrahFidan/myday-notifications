// MYday Typography - Inter & Poppins
import { TextStyle } from 'react-native';

export const fontFamilies = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  display: 'Poppins_600SemiBold',
  displayBold: 'Poppins_700Bold',
};

export const typography = {
  // Headings
  h1: {
    fontFamily: fontFamilies.displayBold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  } as TextStyle,
  h2: {
    fontFamily: fontFamilies.display,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.3,
  } as TextStyle,
  h3: {
    fontFamily: fontFamilies.semibold,
    fontSize: 20,
    lineHeight: 28,
  } as TextStyle,

  // Body
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  bodyMedium: {
    fontFamily: fontFamilies.medium,
    fontSize: 16,
    lineHeight: 24,
  } as TextStyle,
  bodySmall: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,

  // UI Elements
  button: {
    fontFamily: fontFamilies.semibold,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.3,
  } as TextStyle,
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    lineHeight: 16,
  } as TextStyle,
  label: {
    fontFamily: fontFamilies.medium,
    fontSize: 14,
    lineHeight: 20,
  } as TextStyle,
};

export type Typography = typeof typography;
