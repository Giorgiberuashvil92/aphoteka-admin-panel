import { useRouter, useLocalSearchParams } from 'expo-router';
import { CreateNewPasswordScreen } from '@/src/screens';

export default function CreateNewPasswordPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const resetToken = typeof params.resetToken === 'string' ? params.resetToken : '';

  return (
    <CreateNewPasswordScreen
      resetToken={resetToken}
      onChangePassword={() => router.replace('/login' as any)}
      onBack={() => router.back()}
    />
  );
}
