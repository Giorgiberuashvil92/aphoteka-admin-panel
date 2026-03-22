import { ChangePasswordScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function ChangePassword() {
  const router = useRouter();

  return (
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
  );
}
