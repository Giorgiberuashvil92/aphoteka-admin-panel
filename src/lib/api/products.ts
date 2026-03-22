import { Product } from '@/types';
import { api } from './client';

export interface ProductsResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductResponse {
  data: Product;
}

export const productsApi = {
  // Get all products
  getAll: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
    active?: boolean;
  }): Promise<ProductsResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());
    
    const query = queryParams.toString();
    return api.get<ProductsResponse>(`/products${query ? `?${query}` : ''}`);
  },

  // Get product by ID
  getById: async (id: string): Promise<ProductResponse> => {
    return api.get<ProductResponse>(`/products/${id}`);
  },

  // Create product
  create: async (product: Partial<Product>): Promise<ProductResponse> => {
    return api.post<ProductResponse>('/products', product);
  },

  // Bulk create products (Excel import)
  bulkCreate: async (products: Partial<Product>[]): Promise<{
    success: number;
    failed: number;
    total: number;
    data: Product[];
    errors?: Array<{ index: number; message: string }>;
  }> => {
    return api.post('/products/bulk', products);
  },

  // Update product
  update: async (id: string, product: Partial<Product>): Promise<ProductResponse> => {
    return api.patch<ProductResponse>(`/products/${id}`, product);
  },

  // Delete product
  delete: async (id: string): Promise<void> => {
    return api.delete<void>(`/products/${id}`);
  },

  // Toggle product status
  toggleStatus: async (id: string): Promise<ProductResponse> => {
    return api.patch<ProductResponse>(`/products/${id}/toggle-status`);
  },
};
