import { RequireAuth } from '@/src/components/auth/RequireAuth';
import { useTabNavigation } from '@/src/hooks/useTabNavigation';
import { DoctorPrescriptionScreen } from '@/src/screens/DoctorPrescriptionScreen';
import { useRouter } from 'expo-router';

export default function DoctorPrescriptionPage() {
  const router = useRouter();
  const tabNav = useTabNavigation();

  return (
    <RequireAuth loginTab="cabinet">
      <DoctorPrescriptionScreen
        onBack={() => router.back()}
        onProductPress={(productId) => router.push(`/product/${productId}` as any)}
        onNavigateToCart={tabNav.onCartPress}
      />
    </RequireAuth>
  );
}
