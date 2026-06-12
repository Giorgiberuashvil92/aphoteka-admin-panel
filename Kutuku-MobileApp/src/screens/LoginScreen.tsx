import { AuthField, Button } from '@/src/components/ui';
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
  onGuestPress: () => void;
};

export function LoginScreen({
  onLogin,
  onRegisterPress,
  onForgotPassword,
  onGuestPress,
}: LoginScreenProps) {
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
    <View style={styles.wrapper}>
      <View style={styles.accentOrb} pointerEvents="none" />
      <View style={styles.accentLine} pointerEvents="none" />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 28 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoMark}>
              <Ionicons name="medkit" size={22} color={theme.colors.white} />
            </View>
            <Text style={styles.brand}>Aphoteka</Text>
          </View>

          <View style={styles.intro}>
            <Text style={styles.title}>კეთილი იყოს თქვენი დაბრუნება</Text>
            <Text style={styles.subtitle}>შედით ანგარიშში გასაგრძელებლად</Text>
          </View>

          <View style={styles.form}>
            <AuthField
              label="ელფოსტა ან ტელეფონი"
              placeholder="example@mail.com ან 5XX XXX XXX"
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
              leftIcon={
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={theme.colors.primary}
                />
              }
            />

            <AuthField
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
              leftIcon={
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={theme.colors.primary}
                />
              }
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={18}
                    color={theme.colors.gray[900]}
                  />
                </TouchableOpacity>
              }
            />

            <TouchableOpacity onPress={onForgotPassword} style={styles.forgotWrap} activeOpacity={0.6}>
              <Text style={styles.forgotText}>დაგავიწყდა პაროლი?</Text>
            </TouchableOpacity>

            <Button title="შესვლა" onPress={handleLogin} size="lg" loading={loading} />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ან</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity
            onPress={onRegisterPress}
            style={styles.secondaryBtn}
            activeOpacity={0.7}
          >
            <Ionicons name="person-add-outline" size={18} color={theme.colors.gray[1100]} />
            <Text style={styles.secondaryBtnText}>ახალი ანგარიშის შექმნა</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onGuestPress}
            style={styles.guestBtn}
            activeOpacity={0.7}
          >
            <View style={styles.guestIconWrap}>
              <Ionicons name="walk-outline" size={18} color={theme.colors.primary} />
            </View>
            <View style={styles.guestTextWrap}>
              <Text style={styles.guestTitle}>სტუმარად გაგრძელება</Text>
              <Text style={styles.guestSubtitle}>ავტორიზაცია საჭიროა მხოლოდ შეკვეთისას</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.gray[900]} />
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F8F9FC',
  },
  accentOrb: {
    position: 'absolute',
    top: -120,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: theme.colors.primary,
    opacity: 0.06,
  },
  accentLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: theme.colors.primary,
    opacity: 0.85,
  },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 28,
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 36,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  brand: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.gray[1200],
    letterSpacing: 0.5,
  },
  intro: { marginBottom: 28 },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.gray[1200],
    letterSpacing: -0.3,
    lineHeight: 32,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '400',
    color: theme.colors.gray[1000],
    lineHeight: 22,
  },
  form: { gap: 0 },
  forgotWrap: {
    alignSelf: 'flex-end',
    marginTop: -2,
    marginBottom: 22,
    paddingVertical: 4,
  },
  forgotText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 26,
    marginBottom: 18,
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.colors.gray[600],
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.gray[900],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[600],
    backgroundColor: theme.colors.white,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  secondaryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.gray[1200],
  },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: theme.colors.white,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: theme.colors.purple[300],
    paddingHorizontal: 14,
    paddingVertical: 14,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  guestIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.purple[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  guestTextWrap: { flex: 1 },
  guestTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.gray[1200],
    marginBottom: 2,
  },
  guestSubtitle: {
    fontSize: 12,
    color: theme.colors.gray[900],
    lineHeight: 16,
  },
});
