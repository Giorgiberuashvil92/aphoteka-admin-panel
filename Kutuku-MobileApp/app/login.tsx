import { useRouter } from 'expo-router';
import { LoginScreen } from '@/src/screens';

export default function LoginPage() {
  const router = useRouter();

  return (
    <LoginScreen
      onLogin={() => router.push('/home' as any)}
      onRegisterPress={() => router.push('/register' as any)}
      onForgotPassword={() => router.push('/forgot-password' as any)}
    />
  );
}
