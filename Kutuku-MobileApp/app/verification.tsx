import { useRouter, useLocalSearchParams } from 'expo-router';
import { VerificationScreen } from '@/src/screens';

export default function VerificationPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = params.email as string || 'your email';
  const type = params.type as string || 'register'; // 'register' or 'forgot'

  const handleVerify = () => {
    if (type === 'forgot') {
      router.push('/create-new-password' as any);
    } else {
      router.push('/register-success' as any);
    }
  };

  return (
    <VerificationScreen
      email={email}
      onVerify={handleVerify}
      onResend={() => {
        // TODO: Implement resend OTP
        console.log('Resend OTP');
      }}
      onBack={() => router.back()}
    />
  );
}
