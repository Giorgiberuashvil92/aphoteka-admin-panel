import { CategoryScreen } from '@/src/screens';
import { useRouter } from 'expo-router';

export default function Category() {
  const router = useRouter();

  return (
    <CategoryScreen
      onSearch={() => {
        console.log('Search pressed');
        router.push('/search' as any);
      }}
      onCategoryPress={(categoryName: string) => {
        router.push(`/search-results?category=${encodeURIComponent(categoryName)}` as any);
      }}
      onHomePress={() => {
        console.log('Home pressed');
        router.back();
      }}
      onMyOrderPress={() => {
        console.log('My Order pressed');
        router.push('/my-order' as any);
      }}
      onFavoritePress={() => {
        console.log('Favorite pressed');
        router.push('/favorite' as any);
      }}
      onProfilePress={() => {
        console.log('Profile pressed');
        router.push('/settings' as any);
      }}
      onCartPress={() => {
        console.log('Cart pressed');
        router.push('/cart' as any);
      }}
    />
  );
}
