import { SearchResultsScreen } from '@/src/screens';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function SearchResults() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; category?: string; subcategory?: string }>();
  const searchQuery = (params.q as string) || '';
  const category = (params.category as string) || '';
  const subcategoryParam = (params.subcategory as string) || '';
  const initialSubcategories = subcategoryParam
    ? subcategoryParam.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  return (
    <SearchResultsScreen
      searchQuery={searchQuery}
      initialCategory={category || undefined}
      initialSubcategories={initialSubcategories}
      onBack={() => router.back()}
      onProductPress={(id: string) => router.push(`/product/${id}` as any)}
    />
  );
}
