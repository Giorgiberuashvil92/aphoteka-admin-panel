import { WelcomeScreen } from '@/src/screens';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';

// Set to false to skip registration/onboarding and go directly to home
const SHOW_REGISTRATION = false;

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Show welcome screen for 2 seconds then avigate
    const timer = setTimeout(() => {
      if (SHOW_REGISTRATION) {
        router.replace('/onboarding' as any);
      } else {
        router.replace('/home' as any);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return <WelcomeScreen />;
}
