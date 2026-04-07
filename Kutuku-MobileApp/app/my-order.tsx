import { MyOrderScreen } from '@/src/screens';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

export default function MyOrder() {
  const router = useRouter();
  const params = useLocalSearchParams<{ bogReturn?: string }>();
  const bogAlertShown = useRef(false);

  useEffect(() => {
    const r = params.bogReturn;
    if (!r || bogAlertShown.current) return;
    bogAlertShown.current = true;
    if (r === 'success') {
      Alert.alert(
        'გადახდა',
        'თუ ბანკმა ოპერაცია დაადასტურა, შეკვეთის სტატუსი მალე განახლდება. გადაამოწმეთ სია ქვემოთ.',
      );
    } else if (r === 'fail') {
      Alert.alert(
        'გადახდა',
        'ოპერაცია ვერ დასრულდა ან გაუქმდა. სცადეთ ხელახლა შეკვეთიდან.',
      );
    }
  }, [params.bogReturn]);

  return (
    <MyOrderScreen
      onBack={() => router.back()}
      onLoginPress={() => router.push('/login' as any)}
      onOrderPress={(orderId: string) => {
        router.push(`/order-tracking?id=${encodeURIComponent(orderId)}` as any);
      }}
      onHomePress={() => {
        console.log('Home pressed');
        router.push('/home' as any);
      }}
      onWishlistPress={() => {
        console.log('Favorite pressed');
        router.push('/favorite' as any);
      }}
      onCategoriesPress={() => {
        console.log('Categories pressed');
        router.push('/category' as any);
      }}
      onCartPress={() => {
        console.log('Cart pressed');
        router.push('/cart' as any);
      }}
      onProfilePress={() => {
        console.log('Profile pressed');
        router.push('/settings' as any);
      }}
    />
  );
}
