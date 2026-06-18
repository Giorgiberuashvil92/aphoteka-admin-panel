import { useRouter } from 'expo-router';
import { HomeMainScreen } from './HomeMainScreen';

export function HomeScreen() {
  const router = useRouter();

  return (
    <HomeMainScreen
      onSearch={() => router.push('/search' as any)}
      onCategory={() => router.push('/category' as any)}
      onMainCategoryPress={(type) => {
        router.push(`/category?main=${type}` as any);
      }}
      onProductPress={(productId) => router.push(`/product/${productId}` as any)}
      onNotifications={() => router.push('/notification' as any)}
      onSeeAllPress={(category) => {
        if (category?.trim()) {
          router.push(`/search-results?category=${encodeURIComponent(category.trim())}` as any);
        } else {
          router.push('/search-results?q=' as any);
        }
      }}
      onFavoritesPress={() => router.push('/favorite' as any)}
    />
  );
}
