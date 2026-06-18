import { DeliveryAddressScreen } from '@/src/screens';
import { useRouter } from 'expo-router';
import type { DeliveryAddress as DeliveryAddressType } from '@/src/services/delivery.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DeliveryAddress() {
  const router = useRouter();

  const handleContinue = async (address: DeliveryAddressType) => {
    try {
      await AsyncStorage.setItem('deliveryAddress', JSON.stringify(address));
      router.push('/delivery-options' as any);
    } catch (error) {
      console.error('Error saving delivery address:', error);
    }
  };

  const handleManageAddresses = () => {
    router.push('/manage-addresses' as any);
  };

  return (
    <DeliveryAddressScreen
      onBack={() => router.back()}
      onContinue={handleContinue}
      onManageAddresses={handleManageAddresses}
    />
  );
}
