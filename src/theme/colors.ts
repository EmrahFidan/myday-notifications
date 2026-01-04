// MYday Color Palette - Sadece Dark Mode
export const colors = {
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceVariant: '#252525',
  primary: '#8B5CF6', // Purple
  primaryVariant: '#7C3AED',
  secondary: '#06B6D4', // Cyan
  success: '#22C55E',
  warning: '#F59E0B',
  error: '#EF4444',
  text: {
    primary: '#FFFFFF',
    secondary: '#A3A3A3',
    muted: '#525252',
    inverse: '#0F0F0F',
  },
  border: '#2A2A2A',
  overlay: 'rgba(0, 0, 0, 0.7)',
  card: 'rgba(26, 26, 26, 0.8)',
  glass: 'rgba(139, 92, 246, 0.1)',
};

export type ColorScheme = typeof colors;
