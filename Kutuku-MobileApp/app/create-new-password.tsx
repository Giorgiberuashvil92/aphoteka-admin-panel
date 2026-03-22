import { useRouter } from 'expo-router';
import { CreateNewPasswordScreen } from '@/src/screens';

export default function CreateNewPasswordPage() {
  const router = useRouter();

  return (
    <CreateNewPasswordScreen
      onChangePassword={() => router.replace('/login' as any)}
      onBack={() => router.back()}
    />
  );
}
