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
  source?: 'balance-live';
}) {
  const page = params?.page;
  const limit = params?.limit;
  const search = params?.search;
  const category = params?.category;
  const active = params?.active;
  const source = params?.source;

  // Memoize the API call function to prevent unnecessary re-renders
  const apiCall = useMemo(
    () => () =>
      productsApi.getAll({
        page,
        limit,
        search,
        category,
        active,
        source,
      }),
    [page, limit, search, category, active, source]
  );

  return useApi<ProductsResponse>(
    apiCall,
    { 
      immediate: true,
      deps: [page, limit, search, category, active, source],
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
