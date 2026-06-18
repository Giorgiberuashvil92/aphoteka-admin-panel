import { DeliveryOptionsScreen } from '@/src/screens';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { DeliveryAddress, SelectedDelivery } from '@/src/services/delivery.service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function DeliveryOptions() {
  const router = useRouter();
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress | null>(null);

  useEffect(() => {
    loadDeliveryAddress();
  }, []);

  const loadDeliveryAddress = async () => {
    try {
      const addressJson = await AsyncStorage.getItem('deliveryAddress');
      if (addressJson) {
        setDeliveryAddress(JSON.parse(addressJson));
      } else {
        // No address found, go back to address screen
        router.replace('/delivery-address' as any);
      }
    } catch (error) {
      console.error('Error loading delivery address:', error);
      router.replace('/delivery-address' as any);
    }
  };

  const handleSelectDelivery = async (delivery: SelectedDelivery) => {
    try {
      // Save selected delivery to AsyncStorage for payment
      await AsyncStorage.setItem('selectedDelivery', JSON.stringify(delivery));
      
      // Navigate to payment
      router.push('/payment' as any);
    } catch (error) {
      console.error('Error saving selected delivery:', error);
    }
  };

  if (!deliveryAddress) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5B5FC7" />
        <Text style={styles.loadingText}>იტვირთება...</Text>
      </View>
    );
  }

  return (
    <DeliveryOptionsScreen
      deliveryAddress={deliveryAddress}
      onBack={() => router.back()}
      onSelectDelivery={handleSelectDelivery}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    color: '#666',
  },
});
