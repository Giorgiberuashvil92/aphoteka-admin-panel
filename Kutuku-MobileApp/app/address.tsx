import { RequireAuth } from '@/src/components/auth/RequireAuth';
import { AddressScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function AddressRoute() {
  const router = useRouter();

  return (
    <RequireAuth>
    <AddressScreen
      onBack={() => router.back()}
      onSaved={() => router.back()}
    />
    </RequireAuth>
  );
}
