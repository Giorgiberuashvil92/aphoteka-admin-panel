import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { Button } from '@/src/components/ui';

type RegisterSuccessScreenProps = {
  onContinue: () => void;
};

export function RegisterSuccessScreen({ onContinue }: RegisterSuccessScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon with Animation */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <View style={styles.checkmarkCircle}>
              <Ionicons name="checkmark" size={50} color={theme.colors.white} />
            </View>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Register Success</Text>

        {/* Description */}
        <Text style={styles.description}>
          Congratulations, your account has been{'\n'}
          successfully created.{'\n'}
          Please login to get amazing experience.
        </Text>

        {/* Continue Button */}
        <Button
          title="Go to Homepage"
          onPress={onContinue}
          size="lg"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: theme.spacing.xxxl,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.primary + '20', // 20% opacity
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.xxxl,
  },
});
