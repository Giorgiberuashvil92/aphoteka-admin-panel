import { RequireAuth } from '@/src/components/auth/RequireAuth';
import { ChangePasswordScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function ChangePassword() {
  const router = useRouter();

  return (
    <RequireAuth>
    <ChangePasswordScreen
      onBack={() => {
        console.log('Back pressed');
        router.back();
      }}
      onSuccess={() => {
        console.log('Password changed successfully');
        router.back();
      }}
      onMoreOptions={() => {
        console.log('More options pressed');
      }}
    />
    </RequireAuth>
  );
}
