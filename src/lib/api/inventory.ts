import { Inventory, InventoryAdjustment, WarehouseReceipt, WarehouseDispatch } from '@/types';
import { api } from './client';

export interface InventoryResponse {
  data: Inventory[];
  total: number;
}

export interface InventoryItemResponse {
  data: Inventory;
}

export interface InventoryAdjustmentResponse {
  data: InventoryAdjustment;
}

export interface WarehouseReceiptResponse {
  data: WarehouseReceipt;
}

export interface WarehouseDispatchResponse {
  data: WarehouseDispatch;
}

export const inventoryApi = {
  // Get all inventory
  getAll: async (params?: {
    warehouseId?: string;
    productId?: string;
    state?: string;
    search?: string;
  }): Promise<InventoryResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.warehouseId) queryParams.append('warehouseId', params.warehouseId);
    if (params?.productId) queryParams.append('productId', params.productId);
    if (params?.state) queryParams.append('state', params.state);
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return api.get<InventoryResponse>(`/inventory${query ? `?${query}` : ''}`);
  },

  // Get inventory by ID
  getById: async (id: string): Promise<InventoryItemResponse> => {
    return api.get<InventoryItemResponse>(`/inventory/${id}`);
  },

  // Receive inventory (warehouse receipt)
  receive: async (receipt: Partial<WarehouseReceipt>): Promise<WarehouseReceiptResponse> => {
    return api.post<WarehouseReceiptResponse>('/inventory/receive', receipt);
  },

  // Dispatch inventory (warehouse dispatch)
  dispatch: async (dispatch: Partial<WarehouseDispatch>): Promise<WarehouseDispatchResponse> => {
    return api.post<WarehouseDispatchResponse>('/inventory/dispatch', dispatch);
  },

  // Adjust inventory
  adjust: async (adjustment: Partial<InventoryAdjustment>): Promise<InventoryAdjustmentResponse> => {
    return api.post<InventoryAdjustmentResponse>('/inventory/adjust', adjustment);
  },

  // Get inventory adjustments
  getAdjustments: async (inventoryId?: string): Promise<{ data: InventoryAdjustment[] }> => {
    const query = inventoryId ? `?inventoryId=${inventoryId}` : '';
    return api.get<{ data: InventoryAdjustment[] }>(`/inventory/adjustments${query}`);
  },
};
