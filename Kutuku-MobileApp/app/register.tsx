import { useRouter } from 'expo-router';
import { RegisterScreen } from '@/src/screens';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <RegisterScreen
      onRegister={(email) => router.push(`/verification?email=${encodeURIComponent(email)}` as any)}
      onLoginPress={() => router.push('/login' as any)}
    />
  );
}
