// GlassCard Component - XELAY'dan
import React, { ReactNode } from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { borderRadius, spacing } from '../../theme';

interface GlassCardProps {
  children: ReactNode;
  variant?: 'default' | 'accent' | 'subtle';
  style?: ViewStyle;
  padding?: keyof typeof spacing;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  variant = 'default',
  style,
  padding = 'lg',
}) => {
  const { glassStyle, colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        glassStyle(variant),
        { padding: spacing[padding] },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
});

export default GlassCard;
