import { useCart } from '@/src/contexts';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';

/** ქვედა ტაბების ნავიგაცია — ერთიანი მარშრუტები ყველა ეკრანზე */
export function useTabNavigation() {
  const router = useRouter();
  const { itemCount } = useCart();

  return useMemo(
    () => ({
      cartCount: itemCount,
      onHomePress: () => router.push('/home' as any),
      onCategoriesPress: () => router.push('/category' as any),
      onCabinetPress: () => router.push('/settings' as any),
      onCartPress: () => router.push('/cart' as any),
      onProfilePress: () => router.push('/profile' as any),
    }),
    [router, itemCount],
  );
}
