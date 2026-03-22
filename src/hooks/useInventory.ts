import { useState, useEffect } from 'react';
import { Inventory } from '@/types';
import { inventoryApi } from '@/lib/api';

interface UseInventoryParams {
  warehouseId?: string;
  productId?: string;
  state?: string;
  search?: string;
  immediate?: boolean;
}

export function useInventory(params?: UseInventoryParams) {
  const [data, setData] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [total, setTotal] = useState(0);

  const execute = async () => {
    if (!params?.immediate && params?.immediate !== undefined) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await inventoryApi.getAll({
        warehouseId: params?.warehouseId,
        productId: params?.productId,
        state: params?.state,
        search: params?.search,
      });

      setData(response.data || []);
      setTotal(response.total || 0);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.immediate !== false) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.warehouseId, params?.productId, params?.state, params?.search]);

  return {
    data,
    loading,
    error,
    total,
    execute,
    refresh: execute,
  };
}

// Hook საწყობის inventory-სთვის
export function useWarehouseInventory(warehouseId?: string, options?: { immediate?: boolean }) {
  return useInventory({
    warehouseId,
    immediate: options?.immediate !== false,
  });
}

// Hook პროდუქტის inventory-სთვის
export function useProductInventory(productId?: string, options?: { immediate?: boolean }) {
  return useInventory({
    productId,
    immediate: options?.immediate !== false,
  });
}

// Hook კონკრეტული პროდუქტის კონკრეტული საწყობიდან
export function useWarehouseProductInventory(
  warehouseId?: string,
  productId?: string,
  options?: { immediate?: boolean }
) {
  return useInventory({
    warehouseId,
    productId,
    immediate: options?.immediate !== false,
  });
}
