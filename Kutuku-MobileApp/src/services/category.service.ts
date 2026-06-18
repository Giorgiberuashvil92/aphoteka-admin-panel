import { API_CONFIG } from '@/src/config/api.config';

export interface CategoryItem {
  id: string;
  name: string;
  productCount: number;
  color?: string;
  icon?: string;
  imageUrl?: string;
}

export interface SubcategoryItem {
  id: string;
  name: string;
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

  async getSubcategories(categoryId: string): Promise<SubcategoryItem[]> {
    if (!USE_API) return [];
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/categories/${categoryId}/subcategories`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('Error fetching subcategories:', e);
      return [];
    }
  }
}

export const CategoryService = new CategoryServiceClass();
