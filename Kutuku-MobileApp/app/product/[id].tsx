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
      onSearch={() => router.push('/search' as any)}
      onProductPress={(id: string) => router.push(`/product/${id}` as any)}
    />
  );
}
