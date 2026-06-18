import { api } from './client';

export type FilterFieldType = 'select' | 'multi' | 'boolean' | 'range';

export interface FilterField {
  id: string;
  _id?: string;
  key: string;
  label: string;
  type: FilterFieldType;
  options: string[];
  sortOrder: number;
  isActive: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFilterFieldDto {
  key: string;
  label: string;
  type: FilterFieldType;
  options?: string[];
  sortOrder?: number;
  isActive?: boolean;
  description?: string;
}

export interface UpdateFilterFieldDto {
  key?: string;
  label?: string;
  type?: FilterFieldType;
  options?: string[];
  sortOrder?: number;
  isActive?: boolean;
  description?: string;
}

export const filterFieldsApi = {
  getAll: async (): Promise<FilterField[]> => {
    return api.get<FilterField[]>('/filter-fields');
  },

  getActive: async (): Promise<FilterField[]> => {
    return api.get<FilterField[]>('/filter-fields/active');
  },

  create: async (data: CreateFilterFieldDto): Promise<FilterField> => {
    return api.post<FilterField>('/filter-fields', data);
  },

  update: async (
    id: string,
    data: UpdateFilterFieldDto,
  ): Promise<FilterField> => {
    return api.patch<FilterField>(`/filter-fields/${id}`, data);
  },

  delete: async (id: string): Promise<FilterField> => {
    return api.delete<FilterField>(`/filter-fields/${id}`);
  },
};
