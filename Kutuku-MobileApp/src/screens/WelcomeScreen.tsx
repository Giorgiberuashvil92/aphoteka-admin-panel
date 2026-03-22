import { View, Text, StyleSheet } from 'react-native';
import { theme } from '@/src/theme';

export function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.logo}>Kutuku</Text>
        <Text style={styles.tagline}>Any shopping just from home</Text>
      </View>
      <Text style={styles.version}>Version 0.0.1</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.primary,
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.xxxl,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  tagline: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.white,
    opacity: 0.9,
  },
  version: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.white,
    opacity: 0.7,
    textAlign: 'center',
  },
});
