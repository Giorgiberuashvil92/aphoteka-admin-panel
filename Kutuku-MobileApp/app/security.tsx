import { SecurityScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function Security() {
  const router = useRouter();

  return (
    <SecurityScreen
      onBack={() => {
        console.log('Back pressed');
        router.back();
      }}
      onMoreOptions={() => {
        console.log('More options pressed');
      }}
    />
  );
}
