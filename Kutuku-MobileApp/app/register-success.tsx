import { useRouter } from 'expo-router';
import { RegisterSuccessScreen } from '@/src/screens';

export default function RegisterSuccessPage() {
  const router = useRouter();

  return (
    <RegisterSuccessScreen
      onContinue={() => router.replace('/home' as any)}
    />
  );
}
