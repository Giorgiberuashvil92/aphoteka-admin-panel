import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Alert } from 'react-native';

// Favorite Item Interface
export interface FavoriteItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  image: string;
  rating?: number;
  reviewCount?: number;
  stock?: number;
  category?: string;
}

// Favorites Context Interface
interface FavoritesContextType {
  favorites: FavoriteItem[];
  favoriteCount: number;
  addToFavorites: (item: FavoriteItem) => void;
  removeFromFavorites: (itemId: string) => void;
  isFavorite: (itemId: string) => boolean;
  clearFavorites: () => void;
}

// Create Context
const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

// Provider Props
interface FavoritesProviderProps {
  children: ReactNode;
}

// Favorites Provider Component
export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  // Add to favorites
  const addToFavorites = useCallback((item: FavoriteItem) => {
    setFavorites((prevFavorites) => {
      // Check if already in favorites
      const exists = prevFavorites.find((fav) => fav.id === item.id);
      if (exists) {
        Alert.alert('ინფორმაცია', 'პროდუქტი უკვე დამატებულია ფავორიტებში');
        return prevFavorites;
      }

      Alert.alert('წარმატება', `${item.name} დაემატა ფავორიტებში`);
      return [...prevFavorites, item];
    });
  }, []);

  // Remove from favorites
  const removeFromFavorites = useCallback((itemId: string) => {
    setFavorites((prevFavorites) => {
      const item = prevFavorites.find((fav) => fav.id === itemId);
      if (item) {
        Alert.alert('ინფორმაცია', `${item.name} წაიშალა ფავორიტებიდან`);
      }
      return prevFavorites.filter((fav) => fav.id !== itemId);
    });
  }, []);

  // Check if item is in favorites
  const isFavorite = useCallback(
    (itemId: string): boolean => {
      return favorites.some((fav) => fav.id === itemId);
    },
    [favorites]
  );

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    Alert.alert(
      'დადასტურება',
      'დარწმუნებული ხართ რომ გსურთ ყველა ფავორიტის წაშლა?',
      [
        { text: 'გაუქმება', style: 'cancel' },
        {
          text: 'წაშლა',
          style: 'destructive',
          onPress: () => {
            setFavorites([]);
            Alert.alert('წარმატება', 'ყველა ფავორიტი წაიშალა');
          },
        },
      ]
    );
  }, []);

  // Calculate favorite count
  const favoriteCount = favorites.length;

  const value: FavoritesContextType = {
    favorites,
    favoriteCount,
    addToFavorites,
    removeFromFavorites,
    isFavorite,
    clearFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

// Custom hook to use Favorites context
export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
