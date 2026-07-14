import { CategoryScreen } from '@/src/screens';
import type { MainCategoryType } from '@/src/components/common/MainCategoryCard';
import { useLocalSearchParams, useRouter } from 'expo-router';

const MAIN_CATEGORY_TYPES = new Set<MainCategoryType>([
  'medications',
  'cosmetics',
  'mother-child',
]);

export default function Category() {
  const router = useRouter();
  const { main, categoryId } = useLocalSearchParams<{
    main?: string;
    categoryId?: string;
  }>();
  const initialMainCategory = MAIN_CATEGORY_TYPES.has(main as MainCategoryType)
    ? (main as MainCategoryType)
    : undefined;
  const initialCategoryId =
    typeof categoryId === 'string' && categoryId.trim()
      ? categoryId.trim()
      : undefined;

  return (
    <CategoryScreen
      initialMainCategory={initialMainCategory}
      initialCategoryId={initialCategoryId}
      onCategoryPress={(categoryName: string, subcategories?: string[]) => {
        const params = new URLSearchParams({ category: categoryName });
        if (subcategories?.length) {
          params.set('subcategory', subcategories.join(','));
        }
        router.push(`/search-results?${params.toString()}` as any);
      }}
      onHomePress={() => {
        router.push('/home' as any);
      }}
    />
  );
}
