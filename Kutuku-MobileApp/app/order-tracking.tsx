import { OrderTrackingScreen } from '@/src/screens';
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function OrderTracking() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = (params.id as string) || '1';

  return (
    <OrderTrackingScreen
      orderId={orderId}
      onBack={() => router.back()}
    />
  );
}
