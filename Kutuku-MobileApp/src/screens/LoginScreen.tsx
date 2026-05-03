import { Button, InputWithIcon } from '@/src/components/ui';
import { UserService } from '@/src/services/user.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type LoginScreenProps = {
  onLogin: () => void;
  onRegisterPress: () => void;
  onForgotPassword: () => void;
};

export function LoginScreen({ onLogin, onRegisterPress, onForgotPassword }: LoginScreenProps) {
  const insets = useSafeAreaInsets();
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ emailOrPhone: '', password: '' });

  const validateForm = () => {
    const newErrors = { emailOrPhone: '', password: '' };
    let isValid = true;
    if (!emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'ელფოსტა ან ტელეფონი აუცილებელია';
      isValid = false;
    }
    if (!password) {
      newErrors.password = 'პაროლი აუცილებელია';
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!validateForm()) return;
    setLoading(true);
    try {
      const result = await UserService.login(emailOrPhone.trim(), password);
      if (!result.success) {
        setErrors((e) => ({ ...e, password: result.message || 'შესვლა ვერ მოხერხდა' }));
        return;
      }
      onLogin();
    } catch (err: unknown) {
      Alert.alert('შეცდომა', (err as Error)?.message || 'რაღაც არასწორად მოხდა');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {/* Hero section with gradient-like background */}
            <View style={styles.hero}>
              <View style={styles.blob1} />
              <View style={styles.blob2} />
              <View style={styles.blob3} />
              <View style={styles.heroInner}>
                <View style={styles.logoWrap}>
                  <View style={styles.logoCircle}>
                    <Ionicons name="medkit" size={44} color={theme.colors.white} />
                  </View>
                </View>
                <Text style={styles.brand}>Aphoteka</Text>
                <Text style={styles.title}>კეთილი იყოს თქვენი დაბრუნება</Text>
                <Text style={styles.subtitle}>შედით ანგარიშში</Text>
                <Text style={styles.loginHint}>
                  ტელეფონით შესვლა მუშაობს მაშინ, როცა რეგისტრაციისას მიუთითეთ იმავე ნომერი. ძველი ანგარიშით
                  შედით ელფოსტით.
                </Text>
              </View>
            </View>

            {/* Form card - overlaps hero */}
            <View style={styles.cardWrap}>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>შესვლა</Text>
                <InputWithIcon
                  label="ელფოსტა ან ტელეფონი"
                  placeholder="example@mail.com ან +995..."
                  value={emailOrPhone}
                  onChangeText={(text) => {
                    setEmailOrPhone(text);
                    if (errors.emailOrPhone) setErrors((e) => ({ ...e, emailOrPhone: '' }));
                  }}
                  keyboardType="default"
                  textContentType="username"
                  autoCapitalize="none"
                  autoCorrect={false}
                  error={errors.emailOrPhone}
                  leftIcon={<Ionicons name="mail-outline" size={20} color={theme.colors.primary} />}
                />

                <InputWithIcon
                  label="პაროლი"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors((e) => ({ ...e, password: '' }));
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  error={errors.password}
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={theme.colors.primary} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                      <Ionicons
                        name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                        size={20}
                        color={theme.colors.gray[1000]}
                      />
                    </TouchableOpacity>
                  }
                />

                <TouchableOpacity onPress={onForgotPassword} style={styles.forgotWrap}>
                  <Text style={styles.forgotText}>დაგავიწყდა პაროლი?</Text>
                  <Ionicons name="arrow-forward" size={14} color={theme.colors.primaryDark} />
                </TouchableOpacity>

                <Button title="შესვლა" onPress={handleLogin} size="lg" loading={loading} />
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>არ გაქვს ანგარიში? </Text>
              <TouchableOpacity onPress={onRegisterPress} activeOpacity={0.7}>
                <Text style={styles.footerLink}>რეგისტრაცია</Text>
              </TouchableOpacity>
            </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: theme.colors.background.purple.light,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 0,
  },
  hero: {
    height: 280,
    backgroundColor: theme.colors.background.purple.medium,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.purple[300],
  },
  blob1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: theme.colors.purple[400],
    opacity: 0.35,
    top: -60,
    right: -80,
  },
  blob2: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: theme.colors.primaryLight,
    opacity: 0.45,
    bottom: 20,
    left: -60,
  },
  blob3: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.colors.white,
    opacity: 0.55,
    top: 100,
    right: 40,
  },
  heroInner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
  },
  logoWrap: {
    marginBottom: 12,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primaryDark,
  },
  brand: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.primaryDark,
    letterSpacing: 2,
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.gray[1200],
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.gray[1100],
    textAlign: 'center',
  },
  loginHint: {
    marginTop: 14,
    marginHorizontal: 12,
    fontSize: 13,
    lineHeight: 19,
    color: theme.colors.gray[1000],
    textAlign: 'center',
    fontWeight: '500',
  },
  cardWrap: {
    marginTop: -32,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 24,
    padding: 24,
    minHeight: 320,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.purple[1200],
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 24,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.gray[1200],
    marginBottom: 20,
  },
  forgotWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: -4,
    marginBottom: 20,
  },
  forgotText: {
    fontSize: 14,
    color: theme.colors.primaryDark,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 28,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.gray[1100],
  },
  footerLink: {
    fontSize: 15,
    color: theme.colors.primaryDark,
    fontWeight: '800',
  },
});
