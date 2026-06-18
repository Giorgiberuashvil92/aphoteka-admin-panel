import { api } from './client';

export interface SectionType {
  _id: string;
  key: string;
  label: string;
  description: string;
  isActive: boolean;
  isBuiltIn: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSectionTypeDto {
  key: string;
  label: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateSectionTypeDto {
  key?: string;
  label?: string;
  description?: string;
  isActive?: boolean;
}

export const sectionTypesApi = {
  getAll: async (): Promise<SectionType[]> => {
    return api.get<SectionType[]>('/section-types');
  },

  getActive: async (): Promise<SectionType[]> => {
    return api.get<SectionType[]>('/section-types/active');
  },

  getOne: async (id: string): Promise<SectionType> => {
    return api.get<SectionType>(`/section-types/${id}`);
  },

  create: async (data: CreateSectionTypeDto): Promise<SectionType> => {
    return api.post<SectionType>('/section-types', data);
  },

  update: async (
    id: string,
    data: UpdateSectionTypeDto,
  ): Promise<SectionType> => {
    return api.patch<SectionType>(`/section-types/${id}`, data);
  },

  delete: async (id: string): Promise<SectionType> => {
    return api.delete<SectionType>(`/section-types/${id}`);
  },
};
