import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, TextInput, Image, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '@/src/theme';
import { UserService } from '@/src/services/user.service';

type EditProfileScreenProps = {
  onBack: () => void;
  onSave: () => void;
  onMoreOptions?: () => void;
};

export function EditProfileScreen({ onBack, onSave, onMoreOptions }: EditProfileScreenProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
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
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    if (!email.trim()) {
      Alert.alert('Error', 'Email cannot be empty');
      return;
    }

    setLoading(true);
    try {
      const user = await UserService.getCurrentUser();
      if (user) {
        const names = username.trim().split(' ');
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';

        await UserService.updateProfile(user.id, {
          firstName,
          lastName,
          email: email.trim(),
        });

        Alert.alert('Success', 'Profile updated successfully', [
          { text: 'OK', onPress: onSave }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
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
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity style={styles.moreButton} onPress={onMoreOptions}>
          <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
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
          <Text style={styles.label}>Username</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={theme.colors.primary} />
            <TextInput
              style={styles.input}
              value={username}
              onChangeText={setUsername}
              placeholder="Enter username"
              placeholderTextColor={theme.colors.text.secondary}
            />
          </View>
        </View>

        {/* Email Field */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email or Phone Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color={theme.colors.primary} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter email"
              placeholderTextColor={theme.colors.text.secondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Account Linked With */}
        <View style={styles.linkedAccountContainer}>
          <Text style={styles.label}>Account Liked With</Text>
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
            {loading ? 'Saving...' : 'Save Changes'}
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
