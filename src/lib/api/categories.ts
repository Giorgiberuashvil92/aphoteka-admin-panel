import { api } from './client';

export interface AdminCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  color?: string;
  icon?: string;
  imageUrl?: string;
  active: boolean;
  sortOrder: number;
  productCount: number;
}

export interface CreateCategoryPayload {
  name: string;
  description?: string;
  parentId?: string;
  color?: string;
  icon?: string;
  imageUrl?: string;
  active?: boolean;
  sortOrder?: number;
}

export const categoriesApi = {
  getAll: async (params?: {
    active?: boolean;
    parentId?: string;
    root?: boolean;
  }): Promise<AdminCategory[]> => {
    const search = new URLSearchParams();
    if (params?.active !== undefined) {
      search.set('active', String(params.active));
    }
    if (params?.parentId) search.set('parentId', params.parentId);
    if (params?.root) search.set('root', 'true');
    const query = search.toString() ? `?${search.toString()}` : '';
    return api.get<AdminCategory[]>(`/categories${query}`);
  },

  getRoots: async (): Promise<AdminCategory[]> => {
    return categoriesApi.getAll({ root: true });
  },

  getSubcategories: async (parentId: string): Promise<AdminCategory[]> => {
    return categoriesApi.getAll({ parentId });
  },

  getById: async (id: string): Promise<AdminCategory | null> => {
    const data = await api.get<AdminCategory | null>(`/categories/${id}`);
    return data;
  },

  create: async (payload: CreateCategoryPayload): Promise<AdminCategory> => {
    return api.post<AdminCategory>('/categories', payload);
  },

  update: async (
    id: string,
    payload: Partial<CreateCategoryPayload>,
  ): Promise<AdminCategory> => {
    return api.patch<AdminCategory>(`/categories/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/categories/${id}`);
  },
};
