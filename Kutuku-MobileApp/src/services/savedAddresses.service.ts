import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DeliveryAddress } from './delivery.service';

export interface SavedAddress extends DeliveryAddress {
  id: string;
  label: string; // "სახლი", "სამსახური", etc.
  icon: string; // ionicon name
  createdAt: string;
}

const SAVED_ADDRESSES_KEY = '@saved_addresses';

class SavedAddressesService {
  /**
   * Get all saved addresses
   */
  async getAll(): Promise<SavedAddress[]> {
    try {
      const json = await AsyncStorage.getItem(SAVED_ADDRESSES_KEY);
      if (!json) return [];

      const addresses: SavedAddress[] = JSON.parse(json);
      return Array.isArray(addresses) ? addresses : [];
    } catch (error) {
      console.error('Error loading saved addresses:', error);
      return [];
    }
  }

  /**
   * Save a new address
   */
  async save(address: Omit<SavedAddress, 'id' | 'createdAt'>): Promise<void> {
    try {
      const addresses = await this.getAll();
      
      const newAddress: SavedAddress = {
        ...address,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      addresses.push(newAddress);
      await AsyncStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(addresses));
    } catch (error) {
      console.error('Error saving address:', error);
      throw error;
    }
  }

  /**
   * Update an existing address
   */
  async update(id: string, updates: Partial<SavedAddress>): Promise<void> {
    try {
      const addresses = await this.getAll();
      const index = addresses.findIndex((a) => a.id === id);
      
      if (index === -1) throw new Error('Address not found');

      addresses[index] = { ...addresses[index], ...updates };
      await AsyncStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(addresses));
    } catch (error) {
      console.error('Error updating address:', error);
      throw error;
    }
  }

  /**
   * Delete an address
   */
  async delete(id: string): Promise<void> {
    try {
      const addresses = await this.getAll();
      const filtered = addresses.filter((a) => a.id !== id);
      await AsyncStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error deleting address:', error);
      throw error;
    }
  }
}

export const savedAddressesService = new SavedAddressesService();
