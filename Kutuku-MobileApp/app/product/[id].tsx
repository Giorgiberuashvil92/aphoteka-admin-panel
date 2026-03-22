import { ProductDetailScreen } from '@/src/screens';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function ProductDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const productId = (params.id as string) || '1';

  return (
    <ProductDetailScreen
      productId={productId}
      onBack={() => router.back()}
      onSearch={() => {
        console.log('Search pressed');
        router.push('/search' as any);
      }}
      onProductPress={(id: string) => {
        console.log('Product pressed:', id);
        router.push(`/product/${id}` as any);
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
