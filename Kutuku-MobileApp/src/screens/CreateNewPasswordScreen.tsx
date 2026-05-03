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
import { UserService } from '@/src/services/user.service';

type CreateNewPasswordScreenProps = {
  resetToken: string;
  onChangePassword: () => void;
  onBack: () => void;
};

export function CreateNewPasswordScreen({
  resetToken,
  onChangePassword,
  onBack,
}: CreateNewPasswordScreenProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({
    password: '',
    confirmPassword: '',
  });

  const validateForm = () => {
    const newErrors = { password: '', confirmPassword: '' };
    let isValid = true;

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleChangePassword = async () => {
    if (!validateForm()) return;
    if (!resetToken.trim()) {
      Alert.alert('შეცდომა', 'სესია ვადაგასულია. თავიდან მოითხოვეთ კოდი.');
      return;
    }
    setSaving(true);
    const res = await UserService.resetPasswordWithToken(resetToken.trim(), password);
    setSaving(false);
    if (!res.ok) {
      Alert.alert('შეცდომა', res.message || 'პაროლი ვერ შეიცვალა');
      return;
    }
    Alert.alert('წარმატება', 'პაროლი განახლებულია.', [{ text: 'კარგი', onPress: onChangePassword }]);
  };

  const isValid = password && confirmPassword && password === confirmPassword;

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
        <Text style={styles.title}>Create New Password</Text>
        <Text style={styles.subtitle}>
          Enter your email or phone number
        </Text>

        {/* Password Input */}
        <InputWithIcon
          label="Password"
          placeholder="magdalinenourusset3"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password) setErrors({ ...errors, password: '' });
          }}
          secureTextEntry={!showPassword}
          error={errors.password}
          leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.gray[400]} />}
          rightIcon={
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons 
                name={showPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={theme.colors.gray[400]} 
              />
            </TouchableOpacity>
          }
        />

        {/* Confirm Password Input */}
        <InputWithIcon
          label="Confirm Password"
          placeholder="••••••••••••"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
          }}
          secureTextEntry={!showConfirmPassword}
          error={errors.confirmPassword}
          leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.gray[400]} />}
          rightIcon={
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons 
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={theme.colors.gray[400]} 
              />
            </TouchableOpacity>
          }
        />

        {/* Change Password Button */}
        <Button
          title="Change Password"
          onPress={handleChangePassword}
          size="lg"
          disabled={!isValid || saving}
          loading={saving}
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
