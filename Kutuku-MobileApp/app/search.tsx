import { SearchScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function Search() {
  const router = useRouter();

  return (
    <SearchScreen
      onBack={() => router.back()}
      onSearch={(query) => {
        router.push(`/search-results?q=${encodeURIComponent(query)}` as any);
      }}
      onProductPress={(id) => {
        router.push(`/product/${id}` as any);
      }}
    />
  );
}
