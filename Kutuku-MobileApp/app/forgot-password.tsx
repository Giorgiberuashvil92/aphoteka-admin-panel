import { useRouter } from 'expo-router';
import { ForgotPasswordScreen } from '@/src/screens';

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <ForgotPasswordScreen
      onSendCode={(email, phone) =>
        router.push(
          `/verification?email=${encodeURIComponent(email)}&phone=${encodeURIComponent(phone)}&type=forgot` as any,
        )
      }
      onBack={() => router.back()}
    />
  );
}
