import { CartProvider, FavoritesProvider } from '@/src/contexts';
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <CartProvider>
      <FavoritesProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
        </Stack>
      </FavoritesProvider>
    </CartProvider>
  );
}
