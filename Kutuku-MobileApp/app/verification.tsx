import { useRouter, useLocalSearchParams } from 'expo-router';
import { VerificationScreen } from '@/src/screens';

export default function VerificationPage() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const email = (params.email as string) || 'your email';
  const phone = (params.phone as string) || '';
  const type = (params.type as string) || 'register'; // 'register' or 'forgot'

  const otpPurpose = type === 'forgot' ? 'forgot' : 'register';

  const handleVerify = (ctx?: { resetToken?: string }) => {
    if (type === 'forgot' && ctx?.resetToken) {
      router.push(
        `/create-new-password?resetToken=${encodeURIComponent(ctx.resetToken)}` as any,
      );
      return;
    }
    if (type === 'forgot') {
      router.push('/create-new-password' as any);
      return;
    }
    router.push('/register-success' as any);
  };

  return (
    <VerificationScreen
      email={email}
      phone={phone}
      otpPurpose={otpPurpose}
      onVerify={handleVerify}
      onResend={() => {}}
      onBack={() => router.back()}
    />
  );
}
