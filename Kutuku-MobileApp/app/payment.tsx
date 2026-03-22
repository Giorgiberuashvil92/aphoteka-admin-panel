import { PaymentScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function Payment() {
  const router = useRouter();

  return (
    <PaymentScreen
      onBack={() => router.back()}
      onCheckout={() => {
        console.log('Checkout confirmed');
        router.push('/order-success' as any);
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
