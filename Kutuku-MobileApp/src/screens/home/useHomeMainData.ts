import { ProductService, type Product } from '@/src/services/product.service';
import { PromotionService, mapPromotionToBrandSlide } from '@/src/services/promotion.service';
import { FavoriteService } from '@/src/services/favorite.service';
import type { ImageSourcePropType } from 'react-native';
import { useCallback, useEffect, useState } from 'react';

export type PromotionBrandSlide = {
  id: string;
  backgroundColor: string;
  description?: string;
  name?: string;
  logo?: ImageSourcePropType;
  products: {
    id: string;
    name: string;
    currentPrice: number;
    originalPrice: number;
    discount: number;
    image: string;
  }[];
};

export function useHomeMainData() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [promotionBrands, setPromotionBrands] = useState<PromotionBrandSlide[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [menuVisible, setMenuVisible] = useState(false);

  const loadFeatured = useCallback(async () => {
    try {
      setFeaturedLoading(true);
      const list = await ProductService.getFeaturedProducts(8);
      setFeaturedProducts(list);
      const favorites = await FavoriteService.getFavorites();
      setFavoriteIds(new Set(favorites.map((f) => f.id)));
    } catch (e) {
      console.error('Home: featured products', e);
      setFeaturedProducts([]);
    } finally {
      setFeaturedLoading(false);
    }
  }, []);

  const loadPromotions = useCallback(async () => {
    try {
      const list = await PromotionService.getActivePromotions();
      setPromotionBrands(list.map(mapPromotionToBrandSlide));
    } catch (e) {
      console.error('Home: promotions', e);
      setPromotionBrands([]);
    }
  }, []);

  const refreshFavoritesOnly = useCallback(async () => {
    try {
      const favorites = await FavoriteService.getFavorites();
      setFavoriteIds(new Set(favorites.map((f) => f.id)));
    } catch {
      /* ignore */
    }
  }, []);

  const handleToggleFavorite = useCallback(async (product: Product) => {
    await FavoriteService.toggleFavorite(product);
    await refreshFavoritesOnly();
  }, [refreshFavoritesOnly]);

  useEffect(() => {
    void loadFeatured();
    void loadPromotions();
  }, [loadFeatured, loadPromotions]);

  return {
    featuredProducts,
    featuredLoading,
    promotionBrands,
    favoriteIds,
    menuVisible,
    setMenuVisible,
    loadFeatured,
    loadPromotions,
    handleToggleFavorite,
  };
}
