import { api } from './client';

/** აქცია ბეკენდის მოდელის მიხედვით (მობილური სექცია "სპეციალური აქციები") */
export interface AdminPromotion {
  id: string;
  name: string;
  description?: string;
  backgroundColor?: string;
  logoUrl?: string;
  productIds: string[];
  discountPercent: number;
  startDate?: string | null;
  endDate?: string | null;
  active: boolean;
  order: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePromotionPayload {
  name: string;
  description?: string;
  backgroundColor?: string;
  logoUrl?: string;
  productIds?: string[];
  discountPercent: number;
  startDate?: string;
  endDate?: string;
  active?: boolean;
  order?: number;
}

export const promotionsApi = {
  getAll: async (params?: { active?: boolean }): Promise<AdminPromotion[]> => {
    const query = params?.active !== undefined
      ? `?active=${params.active}`
      : '';
    return api.get<AdminPromotion[]>(`/promotions${query}`);
  },

  getById: async (id: string): Promise<AdminPromotion | null> => {
    const data = await api.get<AdminPromotion | null>(`/promotions/${id}`);
    return data;
  },

  create: async (payload: CreatePromotionPayload): Promise<AdminPromotion> => {
    return api.post<AdminPromotion>('/promotions', payload);
  },

  update: async (
    id: string,
    payload: Partial<CreatePromotionPayload>,
  ): Promise<AdminPromotion> => {
    return api.patch<AdminPromotion>(`/promotions/${id}`, payload);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/promotions/${id}`);
  },
};
