import { API_CONFIG } from '../config/api.config';

/**
 * Built-in section types (for reference)
 * Admin can create custom types dynamically
 */
export enum HomeSectionType {
  CATEGORY = 'category',
  DISCOUNTED = 'discounted',
  FAVORITES = 'favorites',
  ALL = 'all',
}

export interface HomeSection {
  _id: string;
  title: string;
  type: string;
  categoryFilter: string;
  searchQuery: string;
  order: number;
  isVisible: boolean;
  limit: number;
}

export const HomeSectionService = {
  getVisible: async (): Promise<HomeSection[]> => {
    try {
      const url = `${API_CONFIG.BASE_URL}${API_CONFIG.endpoints.homeSections.visible}`;
      console.log('[HomeSectionService] Fetching from:', url);
      
      const response = await fetch(url);
      
      console.log('[HomeSectionService] Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch home sections: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('[HomeSectionService] Received sections:', data.length);
      
      return data;
    } catch (error) {
      console.error('[HomeSectionService] Error fetching home sections:', error);
      return [];
    }
  },
};
