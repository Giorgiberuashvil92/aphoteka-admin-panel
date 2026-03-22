import { AddCardScreen } from '@/src/screens';
import { useRouter } from 'expo-router';
import { PaymentService } from '@/src/services/payment.service';

export default function AddCard() {
  const router = useRouter();

  return (
    <AddCardScreen
      onBack={() => router.back()}
      onAddCard={(card) => {
        console.log('Card added:', card);
        PaymentService.addCard(card);
        router.back();
      }}
    />
  );
}
