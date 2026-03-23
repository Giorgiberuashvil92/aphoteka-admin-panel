import { AddressScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function AddressRoute() {
  const router = useRouter();

  return (
    <AddressScreen
      onBack={() => router.back()}
      onSaved={() => router.back()}
    />
  );
}
