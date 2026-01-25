import { PurchaseInvoice, SalesInvoice } from '@/types';
import { api } from './client';

export interface PurchaseInvoicesResponse {
  data: PurchaseInvoice[];
  total: number;
}

export interface PurchaseInvoiceResponse {
  data: PurchaseInvoice;
}

export interface SalesInvoicesResponse {
  data: SalesInvoice[];
  total: number;
}

export interface SalesInvoiceResponse {
  data: SalesInvoice;
}

export const invoicesApi = {
  // Purchase Invoices
  purchase: {
    getAll: async (params?: {
      supplierId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<PurchaseInvoicesResponse> => {
      const queryParams = new URLSearchParams();
      if (params?.supplierId) queryParams.append('supplierId', params.supplierId);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      
      const query = queryParams.toString();
      return api.get<PurchaseInvoicesResponse>(`/invoices/purchase${query ? `?${query}` : ''}`);
    },

    getById: async (id: string): Promise<PurchaseInvoiceResponse> => {
      return api.get<PurchaseInvoiceResponse>(`/invoices/purchase/${id}`);
    },

    create: async (invoice: Partial<PurchaseInvoice>): Promise<PurchaseInvoiceResponse> => {
      return api.post<PurchaseInvoiceResponse>('/invoices/purchase', invoice);
    },

    update: async (id: string, invoice: Partial<PurchaseInvoice>): Promise<PurchaseInvoiceResponse> => {
      return api.put<PurchaseInvoiceResponse>(`/invoices/purchase/${id}`, invoice);
    },
  },

  // Sales Invoices
  sales: {
    getAll: async (params?: {
      orderId?: string;
      customerId?: string;
      status?: string;
      startDate?: string;
      endDate?: string;
    }): Promise<SalesInvoicesResponse> => {
      const queryParams = new URLSearchParams();
      if (params?.orderId) queryParams.append('orderId', params.orderId);
      if (params?.customerId) queryParams.append('customerId', params.customerId);
      if (params?.status) queryParams.append('status', params.status);
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      
      const query = queryParams.toString();
      return api.get<SalesInvoicesResponse>(`/invoices/sales${query ? `?${query}` : ''}`);
    },

    getById: async (id: string): Promise<SalesInvoiceResponse> => {
      return api.get<SalesInvoiceResponse>(`/invoices/sales/${id}`);
    },

    create: async (invoice: Partial<SalesInvoice>): Promise<SalesInvoiceResponse> => {
      return api.post<SalesInvoiceResponse>('/invoices/sales', invoice);
    },

    update: async (id: string, invoice: Partial<SalesInvoice>): Promise<SalesInvoiceResponse> => {
      return api.put<SalesInvoiceResponse>(`/invoices/sales/${id}`, invoice);
    },
  },
};
