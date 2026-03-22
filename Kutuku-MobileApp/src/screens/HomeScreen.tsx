import { theme } from '@/src/theme';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';
import { HomeMainScreen } from './HomeMainScreen';

export function HomeScreen() {
  const router = useRouter();

  const handleSearch = () => {
    console.log('Search pressed');
    router.push('/search' as any);
  };

  const handleCategory = () => {
    console.log('Category pressed');
    router.push('/category' as any);
  };

  const handleProductPress = (productId: string) => {
    console.log('Product pressed:', productId);
    router.push(`/product/${productId}` as any);
  };

  const handleNotifications = () => {
    console.log('Notifications pressed');
    router.push('/notification' as any);
  };

  const handleMyOrder = () => {
    console.log('My Order pressed');
    router.push('/my-order' as any);
  };

  const handleSeeAll = () => {
    console.log('See All pressed');
    router.push('/search-results?q=' as any);
  };

  const handleFavorite = () => {
    console.log('Favorite pressed');
    router.push('/favorite' as any);
  };

  const handleProfile = () => {
    console.log('Profile pressed');
    router.push('/settings' as any);
  };

  const handleCart = () => {
    console.log('Cart pressed');
    router.push('/cart' as any);
  };

  return (
    <HomeMainScreen
      onSearch={handleSearch}
      onCategory={handleCategory}
      onProductPress={handleProductPress}
      onNotifications={handleNotifications}
      onMyOrderPress={handleMyOrder}
      onSeeAllPress={handleSeeAll}
      onFavoritePress={handleFavorite}
      onProfilePress={handleProfile}
      onCartPress={handleCart}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background.primary,
  },
});
