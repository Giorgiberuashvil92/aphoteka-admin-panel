import { Order } from '@/types';
import { api } from './client';

export interface OrdersResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
}

export interface OrderResponse {
  data: Order;
}

export const ordersApi = {
  // Get all orders
  getAll: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    paymentStatus?: string;
    search?: string;
  }): Promise<OrdersResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.status) queryParams.append('status', params.status);
    if (params?.paymentStatus) queryParams.append('paymentStatus', params.paymentStatus);
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return api.get<OrdersResponse>(`/orders${query ? `?${query}` : ''}`);
  },

  // Get order by ID
  getById: async (id: string): Promise<OrderResponse> => {
    return api.get<OrderResponse>(`/orders/${id}`);
  },

  // Update order status
  updateStatus: async (id: string, status: string): Promise<OrderResponse> => {
    return api.patch<OrderResponse>(`/orders/${id}/status`, { status });
  },

  // Cancel order
  cancel: async (id: string, reason?: string): Promise<OrderResponse> => {
    return api.post<OrderResponse>(`/orders/${id}/cancel`, { reason });
  },
};
