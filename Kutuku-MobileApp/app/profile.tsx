import { RequireAuth } from '@/src/components/auth/RequireAuth';
import { ProfileScreen } from '@/src/screens/ProfileScreen';
import { UserService } from '@/src/services/user.service';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export default function Profile() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert('გასვლა', 'დარწმუნებული ხართ, რომ გსურთ გასვლა?', [
      { text: 'გაუქმება', style: 'cancel' },
      {
        text: 'გასვლა',
        style: 'destructive',
        onPress: async () => {
          await UserService.logout();
          router.replace('/login?tab=profile' as any);
        },
      },
    ]);
  };

  return (
    <RequireAuth loginTab="profile">
      <ProfileScreen
        onLogout={handleLogout}
        onDoctorPrescribe={() => router.push('/doctor-prescribe' as any)}
        onPersonalInfoPress={() => router.push('/edit-profile' as any)}
        onAddressesPress={() => router.push('/address' as any)}
        onPaymentMethodsPress={() => router.push('/add-card' as any)}
        onChangePasswordPress={() => router.push('/change-password' as any)}
        onNotificationSettingsPress={() => router.push('/notification-settings' as any)}
        onLanguagePress={() => router.push('/language' as any)}
        onHelpSupportPress={() => {}}
        onAboutPress={() => {}}
      />
    </RequireAuth>
  );
}
