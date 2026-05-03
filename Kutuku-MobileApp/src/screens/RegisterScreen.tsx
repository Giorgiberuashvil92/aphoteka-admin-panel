import { Button, InputWithIcon } from '@/src/components/ui';
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
};

const iconMuted = theme.colors.gray[1000];

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function phoneDigits(raw: string): string {
  return raw.replace(/\D/g, '');
}

export function RegisterScreen({ onRegister, onLoginPress }: RegisterScreenProps) {
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

      if (!otpResult.success) {
        Alert.alert('შეცდომა', otpResult.error || 'ვერიფიკაციის კოდის გაგზავნა ვერ მოხერხდა');
        return;
      }

      const smsHint = `ვერიფიკაციის კოდი გამოგიგზავნეთ SMS-ით ნომერზე ${phoneTrim}.`;
      Alert.alert('წარმატება', `ანგარიში შექმნილია!\n\n${smsHint}`, [
        { text: 'კარგი', onPress: () => onRegister(emailNorm, phoneTrim) },
      ]);
    } catch (error: unknown) {
      Alert.alert('შეცდომა', (error as Error)?.message || 'რაღაც არასწორი მოხდა');
    } finally {
      registerInFlightRef.current = false;
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
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 28 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>რეგისტრაცია</Text>
          <Text style={styles.pageSubtitle}>აირჩიეთ ანგარიშის ტიპი და შეავსეთ ველები</Text>

          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeChip, accountType === 'individual' && styles.typeChipActive]}
              onPress={() => setType('individual')}
              activeOpacity={0.85}
            >
              <Ionicons
                name="person-outline"
                size={18}
                color={accountType === 'individual' ? theme.colors.white : theme.colors.gray[1100]}
              />
              <Text
                style={[styles.typeChipText, accountType === 'individual' && styles.typeChipTextActive]}
              >
                ფიზიკური პირი
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeChip, accountType === 'legal' && styles.typeChipActive]}
              onPress={() => setType('legal')}
              activeOpacity={0.85}
            >
              <Ionicons
                name="business-outline"
                size={18}
                color={accountType === 'legal' ? theme.colors.white : theme.colors.gray[1100]}
              />
              <Text style={[styles.typeChipText, accountType === 'legal' && styles.typeChipTextActive]}>
                იურიდიული პირი
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            {accountType === 'individual' ? (
              <>
                <InputWithIcon
                  label="სახელი"
                  placeholder="სახელი"
                  value={firstName}
                  onChangeText={(t) => {
                    setFirstName(t);
                    clearFieldError('firstName');
                  }}
                  error={errors.firstName}
                  autoCapitalize="words"
                  leftIcon={<Ionicons name="person-outline" size={20} color={iconMuted} />}
                />
                <InputWithIcon
                  label="გვარი"
                  placeholder="გვარი"
                  value={lastName}
                  onChangeText={(t) => {
                    setLastName(t);
                    clearFieldError('lastName');
                  }}
                  error={errors.lastName}
                  autoCapitalize="words"
                  leftIcon={<Ionicons name="person-outline" size={20} color={iconMuted} />}
                />
                <InputWithIcon
                  label="პირადი ნომერი"
                  placeholder="11 ციფრი"
                  value={personalId}
                  onChangeText={(t) => {
                    setPersonalId(t);
                    clearFieldError('personalId');
                  }}
                  keyboardType="number-pad"
                  error={errors.personalId}
                  leftIcon={<Ionicons name="id-card-outline" size={20} color={iconMuted} />}
                />
                <InputWithIcon
                  label="მისამართი"
                  placeholder="ფაქტიური ან იურიდიული მისამართი"
                  value={address}
                  onChangeText={(t) => {
                    setAddress(t);
                    clearFieldError('address');
                  }}
                  multiline
                  numberOfLines={4}
                  style={styles.addressInput}
                  error={errors.address}
                  leftIcon={<Ionicons name="location-outline" size={20} color={iconMuted} />}
                />
              </>
            ) : (
              <>
                <InputWithIcon
                  label="შპს / დასახელება"
                  placeholder="კომპანიის სრული დასახელება"
                  value={companyName}
                  onChangeText={(t) => {
                    setCompanyName(t);
                    clearFieldError('companyName');
                  }}
                  error={errors.companyName}
                  autoCapitalize="words"
                  leftIcon={<Ionicons name="business-outline" size={20} color={iconMuted} />}
                />
                <InputWithIcon
                  label="საიდენტიფიკაციო კოდი"
                  placeholder="ს/კ"
                  value={legalId}
                  onChangeText={(t) => {
                    setLegalId(t);
                    clearFieldError('legalId');
                  }}
                  error={errors.legalId}
                  leftIcon={<Ionicons name="barcode-outline" size={20} color={iconMuted} />}
                />
                <InputWithIcon
                  label="მისამართი"
                  placeholder="იურიდიული მისამართი"
                  value={address}
                  onChangeText={(t) => {
                    setAddress(t);
                    clearFieldError('address');
                  }}
                  multiline
                  numberOfLines={4}
                  style={styles.addressInput}
                  error={errors.address}
                  leftIcon={<Ionicons name="location-outline" size={20} color={iconMuted} />}
                />
                <InputWithIcon
                  label="წარმომადგენელი (არასავალდებულო)"
                  placeholder="სახელი გვარი"
                  value={representative}
                  onChangeText={(t) => {
                    setRepresentative(t);
                    clearFieldError('representative');
                  }}
                  error={errors.representative}
                  autoCapitalize="words"
                  leftIcon={<Ionicons name="person-circle-outline" size={20} color={iconMuted} />}
                />
              </>
            )}

            <InputWithIcon
              label="ქვეყანა (არასავალდებულო)"
              placeholder="მაგ. საქართველო"
              value={country}
              onChangeText={(t) => {
                setCountry(t);
                clearFieldError('country');
              }}
              autoCapitalize="words"
              error={errors.country}
              leftIcon={<Ionicons name="earth-outline" size={20} color={iconMuted} />}
            />

            <InputWithIcon
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
              leftIcon={<Ionicons name="mail-outline" size={20} color={iconMuted} />}
            />

            <InputWithIcon
              label="ტელეფონი"
              placeholder="მაგ. 557422634 ან +995..."
              value={phone}
              onChangeText={(t) => {
                setPhone(t);
                clearFieldError('phone');
              }}
              keyboardType="phone-pad"
              error={errors.phone}
              leftIcon={<Ionicons name="call-outline" size={20} color={iconMuted} />}
            />
            <Text style={styles.fieldHint}>იმავე ნომრით შეძლებთ შესვლას აპში.</Text>

            <InputWithIcon
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
              leftIcon={<Ionicons name="lock-closed-outline" size={20} color={iconMuted} />}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                    size={20}
                    color={iconMuted}
                  />
                </TouchableOpacity>
              }
            />

            <Button title="რეგისტრაცია" onPress={handleRegister} size="lg" loading={loading} disabled={loading} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>უკვე გაქვთ ანგარიში? </Text>
            <TouchableOpacity onPress={onLoginPress} activeOpacity={0.7}>
              <Text style={styles.footerLink}>შესვლა</Text>
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
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.gray[1200],
    marginBottom: 6,
  },
  pageSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.gray[1000],
    marginBottom: 18,
    lineHeight: 20,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  typeChipActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.gray[1100],
  },
  typeChipTextActive: {
    color: theme.colors.white,
  },
  card: {
    backgroundColor: theme.colors.white,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.purple[1200],
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.07,
        shadowRadius: 16,
      },
      android: { elevation: 6 },
    }),
  },
  addressInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  fieldHint: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.gray[1000],
    marginTop: -8,
    marginBottom: 4,
    lineHeight: 17,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 22,
  },
  footerText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.gray[1100],
  },
  footerLink: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.primaryDark,
  },
});
