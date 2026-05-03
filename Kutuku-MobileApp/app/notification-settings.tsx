import { RequireAuth } from '@/src/components/auth/RequireAuth';
import { NotificationSettingsScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function NotificationSettings() {
  const router = useRouter();

  return (
    <RequireAuth>
    <NotificationSettingsScreen
      onBack={() => {
        console.log('Back pressed');
        router.back();
      }}
      onMoreOptions={() => {
        console.log('More options pressed');
      }}
    />
    </RequireAuth>
  );
}
