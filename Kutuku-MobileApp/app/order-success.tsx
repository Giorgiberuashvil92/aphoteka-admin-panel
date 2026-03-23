import { OrderSuccessScreen } from '@/src/screens';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function OrderSuccess() {
  const router = useRouter();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const id = typeof orderId === 'string' ? orderId : Array.isArray(orderId) ? orderId[0] : '';

  return (
    <OrderSuccessScreen
      orderId={id}
      onOrderTracking={() => {
        if (id) {
          router.push(`/order-tracking?id=${encodeURIComponent(id)}` as any);
        } else {
          router.push('/my-order' as any);
        }
      }}
      onBackToHome={() => {
        router.replace('/home' as any);
      }}
    />
  );
}
