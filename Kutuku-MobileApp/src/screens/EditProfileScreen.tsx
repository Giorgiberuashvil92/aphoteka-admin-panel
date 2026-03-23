import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, TextInput, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { UserService } from '@/src/services/user.service';

type EditProfileScreenProps = {
  onBack: () => void;
  onSave: () => void;
};

export function EditProfileScreen({ onBack, onSave }: EditProfileScreenProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const user = await UserService.getCurrentUser();
    if (user) {
      setUsername(`${user.firstName} ${user.lastName}`);
      setEmail(user.email);
    }
  };

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('შეცდომა', 'სახელი და გვარი სავალდებულოა');
      return;
    }

    if (!email.trim()) {
      Alert.alert('შეცდომა', 'ელფოსტა სავალდებულოა');
      return;
    }

    const wantsPasswordChange =
      currentPassword.trim().length > 0 ||
      newPassword.trim().length > 0 ||
      confirmPassword.trim().length > 0;

    if (wantsPasswordChange) {
      if (!currentPassword.trim()) {
        Alert.alert('შეცდომა', 'მიმდინარე პაროლი სავალდებულოა');
        return;
      }
      if (!newPassword.trim()) {
        Alert.alert('შეცდომა', 'ახალი პაროლი სავალდებულოა');
        return;
      }
      if (newPassword.length < 6) {
        Alert.alert('შეცდომა', 'ახალი პაროლი მინიმუმ 6 სიმბოლო უნდა იყოს');
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert('შეცდომა', 'ახალი პაროლი და დადასტურება არ ემთხვევა');
        return;
      }
    }

    const user = await UserService.getCurrentUser();
    if (!user) {
      Alert.alert('შეცდომა', 'მომხმარებელი ვერ მოიძებნა. ხელახლა შედით სისტემაში.');
      return;
    }

    setLoading(true);
    try {
      const names = username.trim().split(/\s+/);
      const firstName = names[0] || '';
      const lastName = names.slice(1).join(' ') || '';

      const ok = await UserService.updateProfile(user.id, {
        firstName,
        lastName,
        email: email.trim(),
      });

      if (!ok) {
        Alert.alert(
          'შეცდომა',
          'პროფილის განახლება ვერ მოხერხდა. შეამოწმეთ კავშირი ან ხელახლა შედით ანგარიშში.'
        );
        return;
      }

      if (wantsPasswordChange) {
        const pwd = await UserService.changePassword(currentPassword, newPassword);
        if (!pwd.ok) {
          Alert.alert(
            'შეცდომა',
            `პროფილი განახლდა, მაგრამ პაროლი ვერ შეიცვალა: ${pwd.message}`
          );
          return;
        }
      }

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      Alert.alert('წარმატება', 'ცვლილებები შენახულია', [{ text: 'კარგი', onPress: onSave }]);
    } catch {
      Alert.alert('შეცდომა', 'შენახვა ვერ მოხერხდა');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={theme.colors.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>პროფილის რედაქტირება</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Image */}
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Image 
              source={{ uri: 'https://i.pravatar.cc/300?img=5' }}
              style={styles.image}
            />
          </View>
          <TouchableOpacity style={styles.editImageButton}>
            <Ionicons name="camera" size={20} color={theme.colors.white} />
          </TouchableOpacity>
        </View>

        {/* Username Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>სახელი და გვარი</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="მაგ. გიორგი გიორგაძე"
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>
        </View>

        {/* Email Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>ელფოსტა</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="email@example.com"
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <Text style={styles.sectionHeading}>პაროლი</Text>
        <Text style={styles.passwordHint}>
          პაროლის შესაცვლელად შეავსეთ სამივე ველი. თუ არ გსურთ ცვლილება, დატოვეთ ცარიელი.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>მიმდინარე პაროლი</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="••••••••"
              placeholderTextColor={theme.colors.text.secondary}
              secureTextEntry={!showCurrentPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowCurrentPassword((v) => !v)} hitSlop={12}>
              <Ionicons
                name={showCurrentPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>ახალი პაროლი</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="მინ. 6 სიმბოლო"
              placeholderTextColor={theme.colors.text.secondary}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowNewPassword((v) => !v)} hitSlop={12}>
              <Ionicons
                name={showNewPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>ახალი პაროლის დადასტურება</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="გაიმეორეთ ახალი პაროლი"
              placeholderTextColor={theme.colors.text.secondary}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword((v) => !v)} hitSlop={12}>
              <Ionicons
                name={showConfirmPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={theme.colors.text.secondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Linked With */}
        <View style={styles.linkedAccountContainer}>
          <Text style={styles.label}>დაკავშირებული ანგარიში</Text>
          <TouchableOpacity style={styles.linkedAccount}>
            <View style={styles.linkedAccountLeft}>
              <Image 
                source={{ uri: 'https://www.google.com/favicon.ico' }}
                style={styles.googleIcon}
              />
              <Text style={styles.linkedAccountText}>Google</Text>
            </View>
            <Ionicons name="link-outline" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'ინახება...' : 'შენახვა'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.text.primary,
  },
  headerSpacer: {
    width: 40,
    height: 40,
  },
  sectionHeading: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.text.primary,
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.xs,
  },
  passwordHint: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: '35%',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
  },
  input: {
    flex: 1,
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    marginLeft: theme.spacing.sm,
  },
  linkedAccountContainer: {
    marginBottom: theme.spacing.xl,
  },
  linkedAccount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.gray[50],
    borderRadius: 12,
    paddingHorizontal: theme.spacing.md,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.gray[100],
  },
  linkedAccountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: theme.spacing.sm,
  },
  linkedAccountText: {
    fontSize: theme.typography.fontSize.md,
    color: theme.colors.text.primary,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
});
