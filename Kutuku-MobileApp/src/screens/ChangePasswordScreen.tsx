import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { UserService } from '@/src/services/user.service';

type ChangePasswordScreenProps = {
  onBack: () => void;
  onSuccess: () => void;
  onMoreOptions?: () => void;
};

export function ChangePasswordScreen({ onBack, onSuccess, onMoreOptions }: ChangePasswordScreenProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    // Validation
    if (!newPassword.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const user = await UserService.getCurrentUser();
      if (user) {
        await UserService.updateProfile(user.id, {
          password: newPassword,
        });

        Alert.alert('Success', 'Password changed successfully', [
          { text: 'OK', onPress: onSuccess }
        ]);
      } else {
        Alert.alert('Error', 'User not found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to change password');
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
        <Text style={styles.title}>Change Password</Text>
        <TouchableOpacity style={styles.moreButton} onPress={onMoreOptions}>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* New Password Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>New Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              placeholderTextColor={theme.colors.text.secondary}
              secureTextEntry={!showNewPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              <Ionicons 
                name={showNewPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={theme.colors.text.secondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Confirm Password Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Confirm Password</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color={theme.colors.text.secondary} />
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your new password"
              placeholderTextColor={theme.colors.text.secondary}
              secureTextEntry={!showConfirmPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
              <Ionicons 
                name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} 
                size={20} 
                color={theme.colors.text.secondary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Password Requirements */}
        <View style={styles.requirementsContainer}>
          <Text style={styles.requirementsTitle}>Password must contain:</Text>
          <View style={styles.requirement}>
            <Ionicons 
              name={newPassword.length >= 6 ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={newPassword.length >= 6 ? theme.colors.success : theme.colors.text.secondary} 
            />
            <Text style={[
              styles.requirementText,
              newPassword.length >= 6 && styles.requirementTextMet
            ]}>
              At least 6 characters
            </Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons 
              name={/[A-Z]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={/[A-Z]/.test(newPassword) ? theme.colors.success : theme.colors.text.secondary} 
            />
            <Text style={[
              styles.requirementText,
              /[A-Z]/.test(newPassword) && styles.requirementTextMet
            ]}>
              One uppercase letter
            </Text>
          </View>
          <View style={styles.requirement}>
            <Ionicons 
              name={/[0-9]/.test(newPassword) ? "checkmark-circle" : "ellipse-outline"} 
              size={16} 
              color={/[0-9]/.test(newPassword) ? theme.colors.success : theme.colors.text.secondary} 
            />
            <Text style={[
              styles.requirementText,
              /[0-9]/.test(newPassword) && styles.requirementTextMet
            ]}>
              One number
            </Text>
          </View>
        </View>

        {/* Change Password Button */}
        <TouchableOpacity 
          style={[styles.changeButton, loading && styles.changeButtonDisabled]}
          onPress={handleChangePassword}
          disabled={loading}
        >
          <Text style={styles.changeButtonText}>
            {loading ? 'Changing...' : 'Change Now'}
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
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.gray[50],
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
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
  requirementsContainer: {
    backgroundColor: theme.colors.gray[50],
    borderRadius: 12,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.xl,
  },
  requirementsTitle: {
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.text.primary,
    marginBottom: theme.spacing.sm,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
  },
  requirementText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.text.secondary,
    marginLeft: theme.spacing.xs,
  },
  requirementTextMet: {
    color: theme.colors.success,
  },
  changeButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  changeButtonDisabled: {
    opacity: 0.6,
  },
  changeButtonText: {
    fontSize: theme.typography.fontSize.md,
    fontWeight: theme.typography.fontWeight.bold,
    color: theme.colors.white,
  },
});
