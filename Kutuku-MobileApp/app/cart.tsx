import { CartScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function Cart() {
  const router = useRouter();

  return (
    <CartScreen
      onBack={() => router.back()}
      onCheckout={() => {
        // Go to delivery address selection first
        router.push('/delivery-address' as any);
      }}
      onDevBogSimulateToPayment={
        typeof __DEV__ !== 'undefined' && __DEV__
          ? () =>
              router.push({
                pathname: '/payment',
                params: { bogDevSimulate: '1' },
              } as any)
          : undefined
      }
      onSearch={() => {
        router.push('/search' as any);
      }}
    />
  );
}
