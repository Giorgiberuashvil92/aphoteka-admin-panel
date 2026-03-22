import { useRouter } from 'expo-router';
import { ForgotPasswordScreen } from '@/src/screens';

export default function ForgotPasswordPage() {
  const router = useRouter();

  return (
    <ForgotPasswordScreen
      onSendCode={(email) => router.push(`/verification?email=${encodeURIComponent(email)}&type=forgot` as any)}
      onBack={() => router.back()}
    />
  );
}
