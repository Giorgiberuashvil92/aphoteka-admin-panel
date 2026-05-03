import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { Button, InputWithIcon } from '@/src/components/ui';
import { EmailService } from '@/src/services/email.service';

type ForgotPasswordScreenProps = {
  onSendCode: (email: string, phone: string) => void;
  onBack: () => void;
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordScreen({ onSendCode, onBack }: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    const emailTrim = email.trim();
    const phoneTrim = phone.trim();
    if (!emailTrim || !phoneTrim) {
      setError('შეიყვანეთ ელფოსტა და ტელეფონი');
      return;
    }
    if (!emailRegex.test(emailTrim)) {
      setError('არასწორი ელფოსტა');
      return;
    }

    setLoading(true);
    setError('');

    const result = await EmailService.sendOTP(emailTrim, 'forgot', {
      phone: phoneTrim,
    });

    setLoading(false);

    if (!result.success) {
      Alert.alert('შეცდომა', result.error || 'კოდის გაგზავნა ვერ მოხერხდა');
      return;
    }

    Alert.alert(
      'გაგზავნილია',
      'ვერიფიკაციის კოდი გამოგიგზავნეთ SMS-ით მითითებულ ნომერზე.',
      [{ text: 'კარგი', onPress: () => onSendCode(emailTrim, phoneTrim) }],
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>ანგარიში</Text>
          <View style={{ width: 24 }} />
        </View>

        <Text style={styles.title}>პაროლის აღდგენა</Text>
        <Text style={styles.subtitle}>
          მიუთითეთ რეგისტრაციისას გამოყენებული ელფოსტა და ტელეფონი — კოდი SMS-ით მოგივათ.
        </Text>

        {error ? (
          <Text style={styles.formError}>{error}</Text>
        ) : null}

        <InputWithIcon
          label="ელფოსტა"
          placeholder="example@mail.com"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            if (error) setError('');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          leftIcon={<Ionicons name="mail-outline" size={20} color={theme.colors.gray[400]} />}
        />

        <InputWithIcon
          label="ტელეფონი"
          placeholder="5XXXXXXXX ან +995..."
          value={phone}
          onChangeText={(text) => {
            setPhone(text);
            if (error) setError('');
          }}
          keyboardType="phone-pad"
          leftIcon={<Ionicons name="call-outline" size={20} color={theme.colors.gray[400]} />}
        />

        <Button
          title="კოდის გაგზავნა"
          onPress={handleSendCode}
          size="lg"
          disabled={!email.trim() || !phone.trim() || loading}
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
    marginBottom: theme.spacing.md,
  },
  formError: {
    color: theme.colors.error,
    fontSize: theme.typography.fontSize.sm,
    marginBottom: theme.spacing.lg,
  },
});
