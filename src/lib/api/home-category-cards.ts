import { api } from './client';

export interface HomeCategoryCard {
  _id: string;
  title: string;
  subtitle: string;
  backgroundColor: string;
  iconKey: string;
  iconUrl: string;
  iconColor: string;
  categoryId: string;
  order: number;
  isVisible: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHomeCategoryCardDto {
  title: string;
  subtitle?: string;
  backgroundColor?: string;
  iconKey?: string;
  iconUrl?: string;
  iconColor?: string;
  categoryId: string;
  order: number;
  isVisible?: boolean;
}

export type UpdateHomeCategoryCardDto = Partial<CreateHomeCategoryCardDto>;

export const homeCategoryCardsApi = {
  getAll: async (): Promise<HomeCategoryCard[]> => {
    return api.get<HomeCategoryCard[]>('/home-category-cards');
  },

  getVisible: async (): Promise<HomeCategoryCard[]> => {
    return api.get<HomeCategoryCard[]>('/home-category-cards/visible');
  },

  getOne: async (id: string): Promise<HomeCategoryCard> => {
    return api.get<HomeCategoryCard>(`/home-category-cards/${id}`);
  },

  create: async (data: CreateHomeCategoryCardDto): Promise<HomeCategoryCard> => {
    return api.post<HomeCategoryCard>('/home-category-cards', data);
  },

  update: async (
    id: string,
    data: UpdateHomeCategoryCardDto,
  ): Promise<HomeCategoryCard> => {
    return api.patch<HomeCategoryCard>(`/home-category-cards/${id}`, data);
  },

  delete: async (id: string): Promise<HomeCategoryCard> => {
    return api.delete<HomeCategoryCard>(`/home-category-cards/${id}`);
  },

  reorder: async (updates: { id: string; order: number }[]): Promise<void> => {
    await api.post<void>('/home-category-cards/reorder', updates);
  },
};
