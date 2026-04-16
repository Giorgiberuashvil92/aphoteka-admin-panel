import { Button, InputWithIcon } from '@/src/components/ui';
import { EmailService } from '@/src/services/email.service';
import { UserService } from '@/src/services/user.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type RegisterScreenProps = {
  onRegister: (email: string) => void;
  onLoginPress: () => void;
};

export function RegisterScreen({ onRegister, onLoginPress }: RegisterScreenProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    emailOrPhone: '',
    password: '',
  });

  const validateForm = () => {
    const newErrors = { firstName: '', lastName: '', emailOrPhone: '', password: '' };
    let isValid = true;

    if (!firstName.trim()) {
      newErrors.firstName = 'სახელი საჭიროებაა';
      isValid = false;
    } else if (firstName.length < 2) {
      newErrors.firstName = 'სახელი უნდა იყოს მინიმუმ 2 სიმბოლო';
      isValid = false;
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'გვარი საჭიროებაა';
      isValid = false;
    } else if (lastName.length < 2) {
      newErrors.lastName = 'გვარი უნდა იყოს მინიმუმ 2 სიმბოლო';
      isValid = false;
    }

    if (!emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'ელ-ფოსტა საჭიროებაა';
      isValid = false;
    } else if (!isValidEmailOrPhone(emailOrPhone)) {
      newErrors.emailOrPhone = 'შეიყვანეთ სწორი ელ-ფოსტის მისამართი';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'პაროლი საჭიროებაა';
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = 'პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const isValidEmailOrPhone = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{9,}$/;
    return emailRegex.test(value) || phoneRegex.test(value);
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    // Check if email (not phone)
    if (!emailOrPhone.includes('@')) {
      Alert.alert('ელ-ფოსტა საჭიროებაა', 'გთხოვთ გამოიყენოთ ელ-ფოსტის მისამართი რეგისტრაციისთვის.');
      return;
    }

    setLoading(true);
    
    try {
      // Check if email already exists
      const emailExists = await UserService.emailExists(emailOrPhone);
      if (emailExists) {
        Alert.alert('ელ-ფოსტა უკვე რეგისტრირებულია', 'ეს ელ-ფოსტა უკვე რეგისტრირებულია. გთხოვთ შეკვეთ სისტემაში ან გამოიყენეთ სხვა ელ-ფოსტა.');
        setLoading(false);
        return;
      }

      // Register user
      const registerResult = await UserService.register(
        firstName,
        lastName,
        emailOrPhone,
        password,
        phone.trim() || undefined,
      );
      
      if (!registerResult.success) {
        Alert.alert('რეგისტრაცია ვერ მოხერხდა', registerResult.message);
        setLoading(false);
        return;
      }

      // Send OTP to email
      const result = await EmailService.sendOTP(emailOrPhone, 'register');
      
      if (!result.success) {
        Alert.alert('შეცდომა', result.error || 'ვერიფიკაციის კოდის გაგზავნა ვერ მოხერხდა');
        setLoading(false);
        return;
      }

      // Success - navigate to verification
      setLoading(false);
      Alert.alert(
        'წარმატება',
        `ანგარიში შექმნილია! ვერიფიკაციის კოდი გაგზავნილია ${emailOrPhone}-ზე\n\nგთხოვთ შეამოწმეთ თქვენი ელ-ფოსტა (და სპამის ფოლდერი).`,
        [{ text: 'კარგი', onPress: () => onRegister(emailOrPhone) }]
      );
    } catch (error: any) {
      Alert.alert('შეცდომა', error.message || 'რაღაც არასწორი მოხდა');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>ანგარიშის შექმნა</Text>
        <Text style={styles.subtitle}>დაიწყეთ ყიდვა და შექმენით თქვენი ანგარიში</Text>
      </View>

      <View style={styles.form}>
        {/* First Name Input */}
        <InputWithIcon
          label="სახელი"
          placeholder="შეიყვანეთ თქვენი სახელი"
          value={firstName}
          onChangeText={(text) => {
            setFirstName(text);
            if (errors.firstName) setErrors({ ...errors, firstName: '' });
          }}
          error={errors.firstName}
          leftIcon={<Ionicons name="person-outline" size={20} color={theme.colors.gray[400]} />}
        />

        <InputWithIcon
          label="გვარი"
          placeholder="შეიყვანეთ თქვენი გვარი"
          value={lastName}
          onChangeText={(text) => {
            setLastName(text);
            if (errors.lastName) setErrors({ ...errors, lastName: '' });
          }}
          error={errors.lastName}
          leftIcon={<Ionicons name="person-outline" size={20} color={theme.colors.gray[400]} />}
        />

        {/* Email Input */}
        <InputWithIcon
          label="ელ-ფოსტის მისამართი"
          placeholder="შეიყვანეთ თქვენი ელ-ფოსტა"
          value={emailOrPhone}
          onChangeText={(text) => {
            setEmailOrPhone(text);
            if (errors.emailOrPhone) setErrors({ ...errors, emailOrPhone: '' });
          }}
          keyboardType="email-address"
          error={errors.emailOrPhone}
          leftIcon={<Ionicons name="mail-outline" size={20} color={theme.colors.gray[400]} />}
        />

        <View>
          <InputWithIcon
            label="მობილური (არასავალდებულო)"
            placeholder="მაგ. 557422634 ან +995557422634"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            leftIcon={<Ionicons name="call-outline" size={20} color={theme.colors.gray[400]} />}
          />
          <Text style={styles.phoneHint}>
            თუ მიუთითებთ, შესვლა შეგიძლიათ ამ ნომრითაც (არა მხოლოდ ელფოსტით).
          </Text>
        </View>

        {/* Password Input */}
        <InputWithIcon
          label="პაროლი"
          placeholder="შექმენით თქვენი პაროლი"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            if (errors.password) setErrors({ ...errors, password: '' });
          }}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="newPassword"
          keyboardType="ascii-capable"
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

        {/* Create Account Button */}
        <Button
          title="ანგარიშის შექმნა"
          onPress={handleRegister}
          size="lg"
          loading={loading}
          disabled={loading}
        />

        {/* Or divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>ან სხვა მეთოდით</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Social Login Buttons */}
        <TouchableOpacity style={styles.socialButton}>
          <Ionicons name="logo-google" size={20} color="#DB4437" />
          <Text style={styles.socialButtonText}>Google-ით რეგისტრაცია</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton}>
          <Ionicons name="logo-facebook" size={20} color="#4267B2" />
          <Text style={styles.socialButtonText}>Facebook-ით რეგისტრაცია</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: theme.spacing.xxxl,
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
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
  form: {
    gap: theme.spacing.lg,
  },
  phoneHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginTop: -theme.spacing.sm,
    lineHeight: theme.typography.fontSize.sm * theme.typography.lineHeight.relaxed,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.gray[200],
  },
  dividerText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginHorizontal: theme.spacing.md,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.gray[200],
    backgroundColor: theme.colors.white,
    marginBottom: theme.spacing.sm,
  },
  socialButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.medium,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
});
