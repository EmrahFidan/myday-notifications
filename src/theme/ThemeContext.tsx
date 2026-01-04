// Theme Context - Sadece Dark Mode
import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { colors, ColorScheme } from './colors';
import { typography, Typography } from './typography';
import { spacing, borderRadius, Spacing, BorderRadius } from './spacing';
import { createGlassStyle } from './glassmorphism';

interface ThemeContextType {
  colors: ColorScheme;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  glassStyle: (variant?: 'default' | 'accent' | 'subtle') => object;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const glassStyle = useMemo(
    () => (variant: 'default' | 'accent' | 'subtle' = 'default') => {
      return createGlassStyle(true, variant); // Always dark
    },
    []
  );

  const value = useMemo(
    () => ({
      colors,
      typography,
      spacing,
      borderRadius,
      glassStyle,
    }),
    [glassStyle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
