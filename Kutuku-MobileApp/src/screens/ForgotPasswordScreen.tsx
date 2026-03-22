import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { Button, InputWithIcon } from '@/src/components/ui';
import { EmailService } from '@/src/services/email.service';

type ForgotPasswordScreenProps = {
  onSendCode: (email: string) => void;
  onBack: () => void;
};

export function ForgotPasswordScreen({ onSendCode, onBack }: ForgotPasswordScreenProps) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmailOrPhone = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{9,}$/;
    return emailRegex.test(value) || phoneRegex.test(value);
  };

  const handleSendCode = async () => {
    if (!emailOrPhone.trim()) {
      setError('Email or phone number is required');
      return;
    }
    if (!isValidEmailOrPhone(emailOrPhone)) {
      setError('Please enter a valid email or phone number');
      return;
    }
    
    // Check if email (not phone)
    if (!emailOrPhone.includes('@')) {
      Alert.alert('Email Required', 'Please use an email address. Phone verification is not available yet.');
      return;
    }

    setLoading(true);
    
    const result = await EmailService.sendOTP(emailOrPhone, 'forgot');
    
    if (result.success) {
      setLoading(false);
      Alert.alert(
        'Success',
        `Verification code sent to ${emailOrPhone}\n\nCheck your email inbox (and spam folder).`,
        [{ text: 'OK', onPress: () => onSendCode(emailOrPhone) }]
      );
    } else {
      setLoading(false);
      Alert.alert('Error', result.error || 'Failed to send code');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Login Account</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Title */}
        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          Please sign in to your existing account
        </Text>

        {/* Email Input */}
        <InputWithIcon
          label="Email or Phone Number"
          placeholder="magdaburja5@gmail.com"
          value={emailOrPhone}
          onChangeText={(text) => {
            setEmailOrPhone(text);
            if (error) setError('');
          }}
          keyboardType="email-address"
          error={error}
          leftIcon={<Ionicons name="mail-outline" size={20} color={theme.colors.gray[400]} />}
          rightIcon={
            emailOrPhone && isValidEmailOrPhone(emailOrPhone) ? (
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            ) : undefined
          }
        />

        {/* Send Code Button */}
        <Button
          title="Send Code"
          onPress={handleSendCode}
          size="lg"
          disabled={!emailOrPhone || loading}
          loading={loading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.xxxl,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  title: {
    fontSize: theme.typography.fontSize.xxxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing.xxxl,
  },
});
