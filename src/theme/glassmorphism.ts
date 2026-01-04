// Glassmorphism Utilities - Sadece Dark Mode
import { ViewStyle } from 'react-native';
import { colors } from './colors';

export const createGlassStyle = (
  _isDark: boolean = true,
  variant: 'default' | 'accent' | 'subtle' = 'default'
): ViewStyle => {
  const variants = {
    default: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: 1,
    },
    accent: {
      backgroundColor: colors.glass,
      borderColor: colors.primary,
      borderWidth: 1.5,
    },
    subtle: {
      backgroundColor: 'rgba(255,255,255,0.03)',
      borderColor: 'transparent',
      borderWidth: 0,
    },
  };

  return {
    ...variants[variant],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  };
};

export const glassCard = {
  dark: createGlassStyle(true, 'default'),
  darkAccent: createGlassStyle(true, 'accent'),
};
