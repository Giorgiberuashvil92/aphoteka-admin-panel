import { api } from './client';

export interface AdminCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  color?: string;
  icon?: string;
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
  active?: boolean;
  sortOrder?: number;
}

export const categoriesApi = {
  getAll: async (params?: { active?: boolean }): Promise<AdminCategory[]> => {
    const query =
      params?.active !== undefined ? `?active=${params.active}` : '';
    return api.get<AdminCategory[]>(`/categories${query}`);
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
