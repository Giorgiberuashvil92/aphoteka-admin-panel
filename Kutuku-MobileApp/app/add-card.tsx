import { RequireAuth } from '@/src/components/auth/RequireAuth';
import { AddCardScreen } from '@/src/screens';
import { PaymentService } from '@/src/services/payment.service';
import { useRouter } from 'expo-router';

export default function AddCardRoute() {
  const router = useRouter();

  return (
    <RequireAuth>
    <AddCardScreen
      onBack={() => router.back()}
      onAddCard={(card) => {
        void PaymentService.addCard(card).then(() => router.back());
      }}
    />
    </RequireAuth>
  );
}
