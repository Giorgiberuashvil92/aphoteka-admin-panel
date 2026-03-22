import { SearchResultsScreen } from '@/src/screens';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function SearchResults() {
  const router = useRouter();
  const params = useLocalSearchParams<{ q?: string; category?: string }>();
  const searchQuery = (params.q as string) || '';
  const category = (params.category as string) || '';

  return (
    <SearchResultsScreen
      searchQuery={searchQuery}
      initialCategory={category || undefined}
      onBack={() => router.back()}
      onProductPress={(id: string) => router.push(`/product/${id}` as any)}
    />
  );
}
