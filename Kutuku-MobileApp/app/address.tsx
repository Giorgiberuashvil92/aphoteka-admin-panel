import { AddressScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function Address() {
  const router = useRouter();

  return (
    <AddressScreen
      onBack={() => router.back()}
      onConfirm={(location) => {
        console.log('Location confirmed:', location);
        router.back();
      }}
    />
  );
}
