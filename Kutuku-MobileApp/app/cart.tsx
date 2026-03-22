import { CartScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function Cart() {
  const router = useRouter();

  return (
    <CartScreen
      onBack={() => router.back()}
      onCheckout={() => {
        console.log('Checkout pressed');
        router.push('/payment' as any);
      }}
      onSearch={() => {
        console.log('Search pressed');
        router.push('/search' as any);
      }}
      onHomePress={() => {
        console.log('Home pressed');
        router.push('/home' as any);
      }}
      onWishlistPress={() => {
        console.log('Wishlist pressed');
        router.push('/favorite' as any);
      }}
      onCategoriesPress={() => {
        console.log('Categories pressed');
        router.push('/category' as any);
      }}
      onProfilePress={() => {
        console.log('Profile pressed');
        router.push('/settings' as any);
      }}
    />
  );
}
