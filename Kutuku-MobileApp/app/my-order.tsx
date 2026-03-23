import { MyOrderScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function MyOrder() {
  const router = useRouter();

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
