import { FavoriteScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function Favorite() {
  const router = useRouter();

  return (
    <FavoriteScreen
      onSearch={() => {
        console.log('Search pressed');
        router.push('/search' as any);
      }}
      onCategories={() => {
        console.log('Categories pressed');
        router.push('/category' as any);
      }}
      onProductPress={(productId) => {
        console.log('Product pressed:', productId);
        router.push(`/product/${productId}` as any);
      }}
      onHomePress={() => {
        console.log('Home pressed');
        router.push('/home' as any);
      }}
      onMyOrderPress={() => {
        console.log('My Order pressed');
        router.push('/my-order' as any);
      }}
      onProfilePress={() => {
        console.log('Profile pressed');
        router.push('/settings' as any);
      }}
      onCartPress={() => {
        console.log('Cart pressed');
        router.push('/cart' as any);
      }}
    />
  );
}
