import { useCart } from '@/src/contexts';
import type { Href } from 'expo-router';
import { usePathname, useRouter } from 'expo-router';
import { useCallback, useMemo } from 'react';

export const TAB_PATHS = {
  home: '/home',
  categories: '/category',
  cabinet: '/settings',
  cart: '/cart',
  profile: '/profile',
} as const;

function isActiveTab(path: string, pathname: string): boolean {
  return pathname === path || pathname.startsWith(`${path}/`);
}

/** ქვედა ტაბების ნავიგაცია — slide ანიმაციის გარეშე */
export function useTabNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const { itemCount } = useCart();

  const goTab = useCallback(
    (path: Href) => {
      if (isActiveTab(String(path), pathname)) return;
      router.dismissTo(path);
    },
    [pathname, router],
  );

  return useMemo(
    () => ({
      cartCount: itemCount,
      onHomePress: () => goTab(TAB_PATHS.home),
      onCategoriesPress: () => goTab(TAB_PATHS.categories),
      onCabinetPress: () => goTab(TAB_PATHS.cabinet),
      onCartPress: () => goTab(TAB_PATHS.cart),
      onProfilePress: () => goTab(TAB_PATHS.profile),
    }),
    [goTab, itemCount],
  );
}
