import { FavoriteScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function Favorite() {
  const router = useRouter();

  return (
    <FavoriteScreen
      onSearch={() => router.push('/search' as any)}
      onCategories={() => router.push('/category' as any)}
      onProductPress={(productId) => router.push(`/product/${productId}` as any)}
      onMyOrderPress={() => router.push('/my-order' as any)}
    />
  );
}
