import { Button } from '@/src/components/ui';
import { EmailService } from '@/src/services/email.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type VerificationScreenProps = {
  email: string;
  /** SMS OTP (Sender.ge) — ნომერი უნდა ემთხვეოდეს ბექენდის გაგზავნას */
  phone?: string;
  otpPurpose: 'register' | 'forgot';
  onVerify: (ctx?: { resetToken?: string }) => void;
  onResend: () => void;
  onBack: () => void;
};

export function VerificationScreen({
  email,
  phone = '',
  otpPurpose,
  onVerify,
  onResend,
  onBack,
}: VerificationScreenProps) {
  const [code, setCode] = useState(['', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const handleCodeChange = (text: string, index: number) => {
    // Only allow numbers
    if (text && !/^\d+$/.test(text)) return;

    const newCode = [...code];
    newCode[index] = text;
    setCode(newCode);

    // Auto-focus next input
    if (text && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace
    if (e.nativeEvent.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async () => {
    const verificationCode = code.join('');
    if (verificationCode.length !== 4) {
      Alert.alert('შეცდომა', 'შეიყვანეთ 4-ციფრიანი კოდი');
      return;
    }

    setLoading(true);

    const result = await EmailService.verifyOTP(email, verificationCode);

    if (!result.success) {
      Alert.alert('ვერიფიკაცია ვერ მოხერხდა', result.error || 'კოდი არასწორია');
      setCode(['', '', '', '']);
      inputRefs[0].current?.focus();
      setLoading(false);
      return;
    }

    if (otpPurpose === 'forgot' && !result.resetToken) {
      Alert.alert('შეცდომა', 'სესიის ტოკენი ვერ მოიძებნა. თავიდან სცადეთ.');
      setLoading(false);
      return;
    }

    setLoading(false);
    const title = 'წარმატება';
    const body =
      otpPurpose === 'forgot'
        ? 'კოდი დადასტურდა. შემდეგ ეკრანზე შეიყვანეთ ახალი პაროლი.'
        : 'ანგარიში დადასტურდა!';
    Alert.alert(title, body, [
      {
        text: 'კარგი',
        onPress: () =>
          otpPurpose === 'forgot' && result.resetToken
            ? onVerify({ resetToken: result.resetToken })
            : onVerify(),
      },
    ]);
  };

  const handleResend = async () => {
    setLoading(true);
    onResend();
    const result = await EmailService.sendOTP(email, otpPurpose, {
      phone: phone.trim() || undefined,
    });

    if (result.success) {
      Alert.alert('გაგზავნილია', 'ახალი კოდი გამოგიგზავნეთ SMS-ით.');
    } else {
      Alert.alert('შეცდომა', result.error || 'კოდის თავიდან გაგზავნა ვერ მოხერხდა');
    }

    setLoading(false);
  };

  const isCodeComplete = code.every(digit => digit !== '');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Verification</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="mail" size={40} color={theme.colors.white} />
          </View>
        </View>

        {/* Title and Description */}
        <Text style={styles.title}>Verification Code</Text>
        <Text style={styles.description}>
          კოდი გამოგიგზავნეთ SMS-ით ნომერზე:
          {'\n'}
          <Text style={styles.email}>{phone.trim() || email}</Text>
        </Text>

        {/* OTP Input */}
        <View style={styles.otpContainer}>
          {code.map((digit, index) => (
            <TextInput
              key={index}
              ref={inputRefs[index]}
              style={[
                styles.otpInput,
                digit && styles.otpInputFilled,
              ]}
              value={digit}
              onChangeText={(text) => handleCodeChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        {/* Submit Button */}
        <Button
          title="Submit"
          onPress={handleSubmit}
          size="lg"
          disabled={!isCodeComplete || loading}
          loading={loading}
        />

        {/* Resend Code */}
        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code? </Text>
          <TouchableOpacity onPress={handleResend} disabled={loading}>
            <Text style={styles.resendLink}>Resend</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xxxl,
    paddingBottom: theme.spacing.lg,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
    textAlign: 'center',
    marginBottom: theme.spacing.sm,
  },
  description: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    textAlign: 'center',
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
    marginBottom: theme.spacing.xxxl,
  },
  email: {
    color: theme.colors.text.primary,
    fontWeight: theme.typography.fontWeight.semibold,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.md,
    marginBottom: theme.spacing.xxxl,
  },
  otpInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: theme.colors.gray[200],
    borderRadius: theme.borderRadius.lg,
    fontSize: theme.typography.fontSize.xxl,
    fontWeight: theme.typography.fontWeight.bold,
    textAlign: 'center',
    color: theme.colors.text.primary,
    backgroundColor: theme.colors.white,
  },
  otpInputFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.gray[50],
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.lg,
  },
  resendText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
  },
  resendLink: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: theme.typography.fontWeight.semibold,
    textDecorationLine: 'underline',
  },
});
