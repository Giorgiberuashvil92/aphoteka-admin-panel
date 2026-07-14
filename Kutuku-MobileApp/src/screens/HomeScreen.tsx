import { useRouter } from 'expo-router';
import type { HomeCategoryCardItem } from '@/src/services/home-category-card.service';
import { HomeMainScreen } from './HomeMainScreen';

export function HomeScreen() {
  const router = useRouter();

  return (
    <HomeMainScreen
      onSearch={() => router.push('/search' as any)}
      onCategory={() => router.push('/category' as any)}
      onMainCategoryPress={(card: HomeCategoryCardItem) => {
        if (card.categoryId) {
          router.push(`/category?categoryId=${encodeURIComponent(card.categoryId)}` as any);
          return;
        }
        // fallback: ძველი name-based deep link
        const mainByTitle: Record<string, string> = {
          მედიკამენტები: 'medications',
          კოსმეტიკა: 'cosmetics',
          'დედა და ბავშვი': 'mother-child',
        };
        const main = mainByTitle[card.title];
        if (main) {
          router.push(`/category?main=${main}` as any);
        } else {
          router.push('/category' as any);
        }
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
