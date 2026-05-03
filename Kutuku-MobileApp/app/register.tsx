import { useRouter } from 'expo-router';
import { RegisterScreen } from '@/src/screens';

export default function RegisterPage() {
  const router = useRouter();

  return (
    <RegisterScreen
      onRegister={(email, phone) =>
        router.push(
          `/verification?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}` as any,
        )
      }
      onLoginPress={() => router.push('/login' as any)}
    />
  );
}
