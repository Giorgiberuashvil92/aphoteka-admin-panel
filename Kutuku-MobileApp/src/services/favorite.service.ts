import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from './product.service';

class FavoriteServiceClass {
  private FAVORITES_KEY = '@kutuku_favorites';

  // Get all favorite products
  async getFavorites(): Promise<Product[]> {
    try {
      const favoritesJson = await AsyncStorage.getItem(this.FAVORITES_KEY);
      return favoritesJson ? JSON.parse(favoritesJson) : [];
    } catch (error) {
      console.error('Error getting favorites:', error);
      return [];
    }
  }

  // Add product to favorites
  async addFavorite(product: Product): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      
      // Check if already exists
      const exists = favorites.some(fav => fav.id === product.id);
      if (exists) {
        return false;
      }

      favorites.push(product);
      await AsyncStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
      console.log('Product added to favorites:', product.name);
      return true;
    } catch (error) {
      console.error('Error adding favorite:', error);
      return false;
    }
  }

  // Remove product from favorites
  async removeFavorite(productId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      const filtered = favorites.filter(fav => fav.id !== productId);
      
      await AsyncStorage.setItem(this.FAVORITES_KEY, JSON.stringify(filtered));
      console.log('Product removed from favorites:', productId);
      return true;
    } catch (error) {
      console.error('Error removing favorite:', error);
      return false;
    }
  }

  // Check if product is favorite
  async isFavorite(productId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavorites();
      return favorites.some(fav => fav.id === productId);
    } catch (error) {
      console.error('Error checking favorite:', error);
      return false;
    }
  }

  // Toggle favorite status
  async toggleFavorite(product: Product): Promise<boolean> {
    try {
      const isFav = await this.isFavorite(product.id);
      
      if (isFav) {
        await this.removeFavorite(product.id);
        return false;
      } else {
        await this.addFavorite(product);
        return true;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      return false;
    }
  }

  // Clear all favorites
  async clearFavorites(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.FAVORITES_KEY);
      console.log('All favorites cleared');
    } catch (error) {
      console.error('Error clearing favorites:', error);
    }
  }

  // Get favorites count
  async getFavoritesCount(): Promise<number> {
    try {
      const favorites = await this.getFavorites();
      return favorites.length;
    } catch (error) {
      console.error('Error getting favorites count:', error);
      return 0;
    }
  }
}

export const FavoriteService = new FavoriteServiceClass();
