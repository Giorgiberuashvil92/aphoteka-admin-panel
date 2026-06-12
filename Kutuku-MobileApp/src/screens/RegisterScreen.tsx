import { AuthField, Button } from '@/src/components/ui';
import { EmailService } from '@/src/services/email.service';
import { UserService, type RegisterMobilePayload } from '@/src/services/user.service';
import { theme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type AccountType = 'individual' | 'legal';

type FieldErrors = {
  firstName: string;
  lastName: string;
  personalId: string;
  companyName: string;
  legalId: string;
  address: string;
  representative: string;
  country: string;
  email: string;
  phone: string;
  password: string;
};

const emptyErrors = (): FieldErrors => ({
  firstName: '',
  lastName: '',
  personalId: '',
  companyName: '',
  legalId: '',
  address: '',
  representative: '',
  country: '',
  email: '',
  phone: '',
  password: '',
});

type RegisterScreenProps = {
  onRegister: (email: string, phone: string) => void;
  onLoginPress: () => void;
  onGuestPress: () => void;
};

const iconPrimary = theme.colors.primary;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function RegisterScreen({ onRegister, onLoginPress, onGuestPress }: RegisterScreenProps) {
  const insets = useSafeAreaInsets();
  const [accountType, setAccountType] = useState<AccountType>('individual');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [personalId, setPersonalId] = useState('');

  const [companyName, setCompanyName] = useState('');
  const [legalId, setLegalId] = useState('');
  const [address, setAddress] = useState('');
  const [representative, setRepresentative] = useState('');
  const [country, setCountry] = useState('');

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>(emptyErrors);
  const registerInFlightRef = useRef(false);

  const clearFieldError = (key: keyof FieldErrors) => {
    setErrors((e) => (e[key] ? { ...e, [key]: '' } : e));
  };

  const setType = (t: AccountType) => {
    setAccountType(t);
    setErrors(emptyErrors());
    setAddress('');
    setCountry('');
    if (t === 'individual') {
      setCompanyName('');
      setLegalId('');
      setRepresentative('');
    } else {
      setFirstName('');
      setLastName('');
      setPersonalId('');
    }
  };

  const validateForm = (): boolean => {
    const next = emptyErrors();
    let ok = true;

    if (!email.trim()) {
      next.email = 'ელფოსტა სავალდებულოა';
      ok = false;
    } else if (!isValidEmail(email)) {
      next.email = 'შეიყვანეთ სწორი ელფოსტა';
      ok = false;
    }

    const pDigits = phoneDigits(phone);
    if (pDigits.length < 9) {
      next.phone = 'ტელეფონი სავალდებულოა (მინ. 9 ციფრი)';
      ok = false;
    }

    if (!password) {
      next.password = 'პაროლი სავალდებულოა';
      ok = false;
    } else if (password.length < 8) {
      next.password = 'პაროლი მინიმუმ 8 სიმბოლო';
      ok = false;
    }

    if (accountType === 'individual') {
      if (!firstName.trim()) {
        next.firstName = 'სახელი სავალდებულოა';
        ok = false;
      } else if (firstName.trim().length < 2) {
        next.firstName = 'სახელი მინიმუმ 2 სიმბოლო';
        ok = false;
      }
      if (!lastName.trim()) {
        next.lastName = 'გვარი სავალდებულოა';
        ok = false;
      } else if (lastName.trim().length < 2) {
        next.lastName = 'გვარი მინიმუმ 2 სიმბოლო';
        ok = false;
      }
      const idDigits = personalId.replace(/\D/g, '');
      if (idDigits.length !== 11) {
        next.personalId = 'პირადი ნომერი — ზუსტად 11 ციფრი';
        ok = false;
      }
      if (!address.trim()) {
        next.address = 'მისამართი სავალდებულოა';
        ok = false;
      } else if (address.trim().length < 4) {
        next.address = 'მისამართი მინიმუმ 4 სიმბოლო';
        ok = false;
      }
    } else {
      if (!companyName.trim()) {
        next.companyName = 'დასახელება სავალდებულოა';
        ok = false;
      } else if (companyName.trim().length < 2) {
        next.companyName = 'დასახელება მინიმუმ 2 სიმბოლო';
        ok = false;
      }
      if (!legalId.trim()) {
        next.legalId = 'საიდენტიფიკაციო კოდი სავალდებულოა';
        ok = false;
      } else if (legalId.trim().length < 3) {
        next.legalId = 'კოდი მინიმუმ 3 სიმბოლო';
        ok = false;
      }
      if (!address.trim()) {
        next.address = 'მისამართი სავალდებულოა';
        ok = false;
      } else if (address.trim().length < 4) {
        next.address = 'მისამართი მინიმუმ 4 სიმბოლო';
        ok = false;
      }
      const rep = representative.trim();
      if (rep && rep.length < 2) {
        next.representative = 'წარმომადგენლის სახელი მინიმუმ 2 სიმბოლო';
        ok = false;
      }
    }

    const c = country.trim();
    if (c && c.length < 2) {
      next.country = 'ქვეყანა მინიმუმ 2 სიმბოლო';
      ok = false;
    }

    setErrors(next);
    return ok;
  };

  const handleRegister = async () => {
    if (registerInFlightRef.current) return;
    if (!validateForm()) return;

    registerInFlightRef.current = true;
    setLoading(true);
    const emailNorm = email.trim().toLowerCase();
    try {
      const emailExists = await UserService.emailExists(emailNorm);
      if (emailExists) {
        Alert.alert(
          'ელფოსტა დაკავებულია',
          'ეს ელფოსტა უკვე რეგისტრირებულია. შედით სისტემაში ან გამოიყენეთ სხვა ელფოსტა.',
        );
        return;
      }

      const countryTrim = country.trim();
      const payload: RegisterMobilePayload =
        accountType === 'individual'
          ? {
              accountType: 'individual',
              firstName: firstName.trim(),
              lastName: lastName.trim(),
              personalId: personalId.replace(/\D/g, ''),
              address: address.trim(),
              email: emailNorm,
              phone: phone.trim(),
              password,
              ...(countryTrim ? { country: countryTrim } : {}),
            }
          : {
              accountType: 'legal',
              companyName: companyName.trim(),
              legalId: legalId.trim(),
              address: address.trim(),
              email: emailNorm,
              phone: phone.trim(),
              password,
              ...(representative.trim() ? { representative: representative.trim() } : {}),
              ...(countryTrim ? { country: countryTrim } : {}),
            };

      const registerResult = await UserService.register(payload);

      if (!registerResult.success) {
        Alert.alert('რეგისტრაცია ვერ მოხერხდა', registerResult.message);
        return;
      }

      const phoneTrim = phone.trim();
      const otpResult = await EmailService.sendOTP(emailNorm, 'register', {
        phone: phoneTrim,
      });

      const goVerify = () => onRegister(emailNorm, phoneTrim);

      if (!otpResult.success) {
        Alert.alert(
          'SMS ვერ გაიგზავნა',
          `${otpResult.error || 'ვერიფიკაციის კოდის გაგზავნა ვერ მოხერხდა'}\n\nვერიფიკაციის გვერდზე დააჭირეთ «Resend» ახალი კოდის მოსათხოვნად.`,
          [{ text: 'გაგრძელება', onPress: goVerify }],
        );
        return;
      }

      const smsHint = `ვერიფიკაციის კოდი გამოგიგზავნეთ SMS-ით ნომერზე ${phoneTrim}.`;
      Alert.alert('წარმატება', `ანგარიში შექმნილია!\n\n${smsHint}`, [
        { text: 'კარგი', onPress: goVerify },
      ]);
    } catch (error: unknown) {
      Alert.alert('შეცდომა', (error as Error)?.message || 'რაღაც არასწორად მოხდა');
    } finally {
      registerInFlightRef.current = false;
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
            { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <TouchableOpacity onPress={onLoginPress} style={styles.backBtn} hitSlop={12}>
              <Ionicons name="arrow-back" size={22} color={theme.colors.gray[1100]} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.logoMark}>
                <Ionicons name="medkit" size={20} color={theme.colors.white} />
              </View>
              <Text style={styles.brand}>Aphoteka</Text>
            </View>
            <View style={styles.backSpacer} />
          </View>

          <View style={styles.intro}>
            <Text style={styles.title}>ახალი ანგარიში</Text>
            <Text style={styles.subtitle}>შეავსეთ მონაცემები რეგისტრაციის დასასრულებლად</Text>
          </View>

          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeChip, accountType === 'individual' && styles.typeChipActive]}
              onPress={() => setType('individual')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="person-outline"
                size={17}
                color={accountType === 'individual' ? theme.colors.primary : theme.colors.gray[900]}
              />
              <Text
                style={[
                  styles.typeChipText,
                  accountType === 'individual' && styles.typeChipTextActive,
                ]}
              >
                ფიზიკური
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeChip, accountType === 'legal' && styles.typeChipActive]}
              onPress={() => setType('legal')}
              activeOpacity={0.8}
            >
              <Ionicons
                name="business-outline"
                size={17}
                color={accountType === 'legal' ? theme.colors.primary : theme.colors.gray[900]}
              />
              <Text
                style={[styles.typeChipText, accountType === 'legal' && styles.typeChipTextActive]}
              >
                იურიდიული
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {accountType === 'individual' ? (
              <>
                <AuthField
                  label="სახელი"
                  placeholder="სახელი"
                  value={firstName}
                  onChangeText={(t) => {
                    setFirstName(t);
                    clearFieldError('firstName');
                  }}
                  error={errors.firstName}
                  autoCapitalize="words"
                  leftIcon={<Ionicons name="person-outline" size={18} color={iconPrimary} />}
                />
                <AuthField
                  label="გვარი"
                  placeholder="გვარი"
                  value={lastName}
                  onChangeText={(t) => {
                    setLastName(t);
                    clearFieldError('lastName');
                  }}
                  error={errors.lastName}
                  autoCapitalize="words"
                  leftIcon={<Ionicons name="person-outline" size={18} color={iconPrimary} />}
                />
                <AuthField
                  label="პირადი ნომერი"
                  placeholder="11 ციფრი"
                  value={personalId}
                  onChangeText={(t) => {
                    setPersonalId(t);
                    clearFieldError('personalId');
                  }}
                  keyboardType="number-pad"
                  error={errors.personalId}
                  leftIcon={<Ionicons name="id-card-outline" size={18} color={iconPrimary} />}
                />
                <AuthField
                  label="მისამართი"
                  placeholder="ფაქტიური ან იურიდიული მისამართი"
                  value={address}
                  onChangeText={(t) => {
                    setAddress(t);
                    clearFieldError('address');
                  }}
                  multiline
                  numberOfLines={4}
                  error={errors.address}
                  leftIcon={<Ionicons name="location-outline" size={18} color={iconPrimary} />}
                />
              </>
            ) : (
              <>
                <AuthField
                  label="შპს / დასახელება"
                  placeholder="კომპანიის სრული დასახელება"
                  value={companyName}
                  onChangeText={(t) => {
                    setCompanyName(t);
                    clearFieldError('companyName');
                  }}
                  error={errors.companyName}
                  autoCapitalize="words"
                  leftIcon={<Ionicons name="business-outline" size={18} color={iconPrimary} />}
                />
                <AuthField
                  label="საიდენტიფიკაციო კოდი"
                  placeholder="ს/კ"
                  value={legalId}
                  onChangeText={(t) => {
                    setLegalId(t);
                    clearFieldError('legalId');
                  }}
                  error={errors.legalId}
                  leftIcon={<Ionicons name="barcode-outline" size={18} color={iconPrimary} />}
                />
                <AuthField
                  label="მისამართი"
                  placeholder="იურიდიული მისამართი"
                  value={address}
                  onChangeText={(t) => {
                    setAddress(t);
                    clearFieldError('address');
                  }}
                  multiline
                  numberOfLines={4}
                  error={errors.address}
                  leftIcon={<Ionicons name="location-outline" size={18} color={iconPrimary} />}
                />
                <AuthField
                  label="წარმომადგენელი (არასავალდებულო)"
                  placeholder="სახელი გვარი"
                  value={representative}
                  onChangeText={(t) => {
                    setRepresentative(t);
                    clearFieldError('representative');
                  }}
                  error={errors.representative}
                  autoCapitalize="words"
                  leftIcon={<Ionicons name="person-circle-outline" size={18} color={iconPrimary} />}
                />
              </>
            )}

            <AuthField
              label="ქვეყანა (არასავალდებულო)"
              placeholder="მაგ. საქართველო"
              value={country}
              onChangeText={(t) => {
                setCountry(t);
                clearFieldError('country');
              }}
              autoCapitalize="words"
              error={errors.country}
              leftIcon={<Ionicons name="earth-outline" size={18} color={iconPrimary} />}
            />

            <Text style={styles.sectionLabel}>კონტაქტი და უსაფრთხოება</Text>

            <AuthField
              label="ელფოსტა"
              placeholder="example@mail.com"
              value={email}
              onChangeText={(t) => {
                setEmail(t);
                clearFieldError('email');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              error={errors.email}
              leftIcon={<Ionicons name="mail-outline" size={18} color={iconPrimary} />}
            />

            <AuthField
              label="ტელეფონი"
              placeholder="5XX XXX XXX"
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                clearFieldError('phone');
              }}
              keyboardType="phone-pad"
              error={errors.phone}
              leftIcon={<Ionicons name="call-outline" size={18} color={iconPrimary} />}
            />
            <Text style={styles.fieldHint}>იმავე ნომრით შეძლებთ შესვლას აპში.</Text>

            <AuthField
              label="პაროლი"
              placeholder="მინიმუმ 8 სიმბოლო"
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                clearFieldError('password');
              }}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="newPassword"
              error={errors.password}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color={iconPrimary} />}
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

            <Button
              title="რეგისტრაცია"
              onPress={handleRegister}
              size="lg"
              loading={loading}
              disabled={loading}
            />
          </View>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ან</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity onPress={onLoginPress} style={styles.secondaryBtn} activeOpacity={0.7}>
            <Ionicons name="log-in-outline" size={18} color={theme.colors.gray[1100]} />
            <Text style={styles.secondaryBtnText}>უკვე გაქვთ ანგარიში? შესვლა</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onGuestPress} style={styles.guestBtn} activeOpacity={0.7}>
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
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.gray[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backSpacer: { width: 40 },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brand: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.gray[1200],
    letterSpacing: 0.4,
  },
  intro: { marginBottom: 22 },
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
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 22,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.white,
    borderWidth: 1.5,
    borderColor: theme.colors.gray[500],
  },
  typeChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.purple[100],
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.gray[1000],
  },
  typeChipTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  form: { marginBottom: 4 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.gray[900],
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
    marginTop: 4,
  },
  fieldHint: {
    fontSize: 12,
    color: theme.colors.gray[900],
    marginTop: -10,
    marginBottom: 8,
    marginLeft: 4,
    lineHeight: 17,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
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
