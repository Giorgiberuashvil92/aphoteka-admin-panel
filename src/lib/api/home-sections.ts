import { api } from './client';

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
  type: string; // Can be built-in or custom type
  categoryFilter: string;
  searchQuery: string;
  order: number;
  isVisible: boolean;
  limit: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateHomeSectionDto {
  title: string;
  type: string; // Can be built-in or custom type
  categoryFilter?: string;
  searchQuery?: string;
  order: number;
  isVisible?: boolean;
  limit?: number;
}

export interface UpdateHomeSectionDto {
  title?: string;
  type?: string; // Can be built-in or custom type
  categoryFilter?: string;
  searchQuery?: string;
  order?: number;
  isVisible?: boolean;
  limit?: number;
}

export const homeSectionsApi = {
  getAll: async (): Promise<HomeSection[]> => {
    return api.get<HomeSection[]>('/home-sections');
  },

  getVisible: async (): Promise<HomeSection[]> => {
    return api.get<HomeSection[]>('/home-sections/visible');
  },

  getOne: async (id: string): Promise<HomeSection> => {
    return api.get<HomeSection>(`/home-sections/${id}`);
  },

  create: async (data: CreateHomeSectionDto): Promise<HomeSection> => {
    return api.post<HomeSection>('/home-sections', data);
  },

  update: async (
    id: string,
    data: UpdateHomeSectionDto,
  ): Promise<HomeSection> => {
    return api.patch<HomeSection>(`/home-sections/${id}`, data);
  },

  delete: async (id: string): Promise<HomeSection> => {
    return api.delete<HomeSection>(`/home-sections/${id}`);
  },

  reorder: async (updates: { id: string; order: number }[]): Promise<void> => {
    await api.post<void>('/home-sections/reorder', updates);
  },
};
