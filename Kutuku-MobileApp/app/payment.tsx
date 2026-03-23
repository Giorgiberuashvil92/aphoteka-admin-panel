import { PaymentScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function Payment() {
  const router = useRouter();

  return (
    <PaymentScreen
      onBack={() => router.back()}
      onLoginRequired={() => router.push('/login' as any)}
      onOrderPlaced={(orderId) => {
        router.replace(
          `/order-success?orderId=${encodeURIComponent(orderId)}` as any
        );
      }}
      onEditAddress={() => {
        router.push('/address' as any);
      }}
      onAddPaymentMethod={() => {
        router.push('/add-card' as any);
      }}
    />
  );
}
