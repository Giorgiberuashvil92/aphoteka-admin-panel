import { View, StyleSheet, ViewProps } from 'react-native';
import { theme } from '@/src/theme';

type CardProps = ViewProps & {
  children: React.ReactNode;
  variant?: 'elevated' | 'outlined' | 'filled';
};

export function Card({ children, variant = 'elevated', style, ...props }: CardProps) {
  return (
    <View style={[styles.card, styles[variant], style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
  },
  elevated: {
    backgroundColor: theme.colors.white,
    ...theme.shadows.md,
  },
  outlined: {
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
  },
  filled: {
    backgroundColor: theme.colors.background.secondary,
  },
});
