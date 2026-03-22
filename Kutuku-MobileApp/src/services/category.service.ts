import { API_CONFIG } from '@/src/config/api.config';

export interface CategoryItem {
  id: string;
  name: string;
  productCount: number;
  color?: string;
  icon?: string;
}

const USE_API = true;

export class CategoryServiceClass {
  async getCategories(): Promise<CategoryItem[]> {
    if (!USE_API) return [];
    try {
      const res = await fetch(API_CONFIG.BASE_URL + API_CONFIG.endpoints.categories.mobile);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('Error fetching categories:', e);
      return [];
    }
  }
}

export const CategoryService = new CategoryServiceClass();
