import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { ReactNode } from 'react';
import { theme } from '@/src/theme';

type InputWithIconProps = TextInputProps & {
  label?: string;
  error?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

export function InputWithIcon({ 
  label, 
  error, 
  leftIcon, 
  rightIcon, 
  style, 
  ...props 
}: InputWithIconProps) {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
            error ? styles.inputError : undefined,
            style
          ]}
          placeholderTextColor={theme.colors.gray[400]}
          autoCorrect={false}
          autoCapitalize="none"
          {...props}
        />
        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  inputContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.gray[50],
    height: 56,
  },
  inputWithLeftIcon: {
    paddingLeft: theme.spacing.xl + theme.spacing.lg,
  },
  inputWithRightIcon: {
    paddingRight: theme.spacing.xl + theme.spacing.lg,
  },
  leftIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 1,
  },
  rightIcon: {
    position: 'absolute',
    right: theme.spacing.md,
    zIndex: 1,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  error: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
  },
});
