import { API_CONFIG } from '@/src/config/api.config';

export type FilterFieldType = 'select' | 'multi' | 'boolean' | 'range';

export interface FilterField {
  id: string;
  key: string;
  label: string;
  type: FilterFieldType;
  options: string[];
  sortOrder: number;
  isActive: boolean;
  description?: string;
}

export type ProductFilterValues = Record<string, string | string[] | boolean>;

export class FilterFieldsService {
  async getActive(): Promise<FilterField[]> {
    try {
      const res = await fetch(`${API_CONFIG.BASE_URL}/filter-fields/active`);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('Error loading filter fields:', e);
      return [];
    }
  }
}

export const filterFieldsService = new FilterFieldsService();
