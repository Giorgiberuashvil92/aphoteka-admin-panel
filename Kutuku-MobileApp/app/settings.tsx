import { RequireAuth } from '@/src/components/auth/RequireAuth';
import { SettingsScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function Settings() {
  const router = useRouter();

  return (
    <RequireAuth loginTab="cabinet">
      <SettingsScreen
        isMainTab
        onBack={() => router.push('/home' as any)}
        onMyOrders={() => router.push('/my-order' as any)}
        onFavorites={() => router.push('/favorite' as any)}
        onNotifications={() => router.push('/notification-settings' as any)}
        onLanguage={() => router.push('/language' as any)}
        onHelpSupport={() => {}}
        onAbout={() => {}}
        onDoctorPrescribe={() => router.push('/doctor-prescribe' as any)}
        onGoToProfile={() => router.push('/profile' as any)}
      />
    </RequireAuth>
  );
}
