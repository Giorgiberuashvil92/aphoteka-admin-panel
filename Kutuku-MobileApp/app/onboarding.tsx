import { useRouter } from 'expo-router';
import { OnboardingScreen } from '@/src/screens';

export default function OnboardingPage() {
  const router = useRouter();

  return (
    <OnboardingScreen
      onComplete={() => router.push('/register' as any)}
      onSkip={() => router.push('/login' as any)}
    />
  );
}
