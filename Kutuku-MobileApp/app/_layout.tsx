import { CartProvider, FavoritesProvider } from '@/src/contexts';
import { applyGlobalFonts } from '@/src/theme/fonts';
import {
  Montserrat_400Regular,
  Montserrat_500Medium,
  Montserrat_600SemiBold,
  Montserrat_700Bold,
  Montserrat_800ExtraBold,
} from '@expo-google-fonts/montserrat';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

SplashScreen.preventAutoHideAsync();

const TAB_SCREEN_NAMES = new Set([
  'index',
  'home',
  'category',
  'settings',
  'cart',
  'profile',
  'login',
]);

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_500Medium,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Montserrat_800ExtraBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      applyGlobalFonts();
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <CartProvider>
      <FavoritesProvider>
        <Stack
          screenOptions={({ route }) => ({
            headerShown: false,
            contentStyle: { backgroundColor: '#F7F9FE' },
            animation: TAB_SCREEN_NAMES.has(route.name) ? 'none' : 'default',
          })}
        >
          <Stack.Screen name="index" />
        </Stack>
      </FavoritesProvider>
    </CartProvider>
  );
}
