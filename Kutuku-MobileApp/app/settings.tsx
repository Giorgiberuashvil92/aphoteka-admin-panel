import { SettingsScreen } from '@/src/screens';
import { UserService } from '@/src/services/user.service';
import { useRouter } from 'expo-router';
import { Alert } from 'react-native';

export default function Settings() {
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await UserService.logout();
            router.replace('/login' as any);
          },
        },
      ]
    );
  };

  return (
    <SettingsScreen
      onBack={() => {
        console.log('Back pressed');
        router.back();
      }}
      onEditProfile={() => {
        console.log('Edit Profile pressed');
        router.push('/edit-profile' as any);
      }}
      onMyOrders={() => {
        console.log('My Orders pressed');
        router.push('/my-order' as any);
      }}
      onAddresses={() => {
        console.log('Addresses pressed');
        // TODO: Navigate to addresses
      }}
      onPaymentMethods={() => {
        console.log('Payment Methods pressed');
        // TODO: Navigate to payment methods
      }}
      onNotifications={() => {
        console.log('Notifications pressed');
        router.push('/notification-settings' as any);
      }}
      onLanguage={() => {
        console.log('Language pressed');
        router.push('/language' as any);
      }}
      onHelpSupport={() => {
        console.log('Help & Support pressed');
        // TODO: Navigate to help and support
      }}
      onAbout={() => {
        console.log('About pressed');
        // TODO: Navigate to about
      }}
      onDoctorPrescribe={() => router.push('/doctor-prescribe' as any)}
      onLogout={handleLogout}
    />
  );
}
