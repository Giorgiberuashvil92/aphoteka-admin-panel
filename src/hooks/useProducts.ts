import { useApi } from './useApi';
import { productsApi, ProductsResponse } from '@/lib/api/products';
import { Product } from '@/types';
import { useMemo } from 'react';

export function useProducts(params?: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  active?: boolean;
}) {
  // Memoize the API call function to prevent unnecessary re-renders
  const apiCall = useMemo(
    () => () => productsApi.getAll(params),
    [params?.page, params?.limit, params?.search, params?.category, params?.active]
  );

  return useApi<ProductsResponse>(
    apiCall,
    { 
      immediate: true,
      onError: (error) => {
        console.error('Failed to fetch products:', error);
      }
    }
  );
}

export function useProduct(id: string | null) {
  return useApi<Product>(
    () => {
      if (!id) throw new Error('Product ID is required');
      return productsApi.getById(id).then(res => res.data);
    },
    { 
      immediate: !!id,
      onError: (error) => {
        console.error('Failed to fetch product:', error);
      }
    }
  );
}
