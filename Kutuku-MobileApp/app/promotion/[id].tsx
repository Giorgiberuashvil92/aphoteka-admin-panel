import { PromotionProductsScreen } from '@/src/screens/PromotionProductsScreen';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function PromotionProductsPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const promotionId = params.id || '';

  return (
    <PromotionProductsScreen
      promotionId={promotionId}
      onBack={() => router.back()}
      onProductPress={(productId) => router.push(`/product/${productId}` as any)}
    />
  );
}
