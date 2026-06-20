"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  loadFavoriteItems,
  saveFavoriteItems,
} from "@/lib/favorites/storage";
import type { FavoriteItem } from "@/types/favorite";

interface FavoritesContextValue {
  items: FavoriteItem[];
  itemCount: number;
  addToFavorites: (item: FavoriteItem) => void;
  removeFromFavorites: (itemId: string) => void;
  toggleFavorite: (item: FavoriteItem) => void;
  isFavorite: (itemId: string) => boolean;
  clearFavorites: () => void;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadFavoriteItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveFavoriteItems(items);
  }, [items, hydrated]);

  const addToFavorites = useCallback((item: FavoriteItem) => {
    setItems((prev) => {
      if (prev.some((fav) => fav.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeFromFavorites = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
  }, []);

  const toggleFavorite = useCallback((item: FavoriteItem) => {
    setItems((prev) => {
      if (prev.some((fav) => fav.id === item.id)) {
        return prev.filter((fav) => fav.id !== item.id);
      }
      return [...prev, item];
    });
  }, []);

  const isFavorite = useCallback(
    (itemId: string) => items.some((item) => item.id === itemId),
    [items],
  );

  const clearFavorites = useCallback(() => {
    setItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemCount: items.length,
      addToFavorites,
      removeFromFavorites,
      toggleFavorite,
      isFavorite,
      clearFavorites,
    }),
    [
      items,
      addToFavorites,
      removeFromFavorites,
      toggleFavorite,
      isFavorite,
      clearFavorites,
    ],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }
  return context;
}
