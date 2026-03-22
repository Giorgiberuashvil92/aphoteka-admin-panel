import { OrderSuccessScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function OrderSuccess() {
  const router = useRouter();

  return (
    <OrderSuccessScreen
      onOrderTracking={() => {
        console.log('Order tracking');
        router.push('/order-tracking?id=1' as any);
      }}
      onBackToHome={() => {
        console.log('Back to home');
        // Navigate to home and reset navigation stack
        router.replace('/home' as any);
      }}
    />
  );
}
