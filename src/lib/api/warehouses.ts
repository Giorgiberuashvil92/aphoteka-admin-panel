import { Warehouse, WarehouseEmployee } from '@/types';
import { api } from './client';

export interface WarehousesResponse {
  data: Warehouse[];
  total: number;
}

export interface WarehouseResponse {
  data: Warehouse;
}

export interface WarehouseEmployeesResponse {
  data: WarehouseEmployee[];
  total: number;
}

export interface WarehouseEmployeeResponse {
  data: WarehouseEmployee;
}

export const warehousesApi = {
  getAll: async (params?: {
    city?: string;
    active?: boolean;
    search?: string;
  }): Promise<WarehousesResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.city) queryParams.append('city', params.city);
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return api.get<WarehousesResponse>(`/warehouses${query ? `?${query}` : ''}`);
  },

  // Get warehouse by ID
  getById: async (id: string): Promise<WarehouseResponse> => {
    return api.get<WarehouseResponse>(`/warehouses/${id}`);
  },

  // Create warehouse
  create: async (warehouse: Partial<Warehouse>): Promise<WarehouseResponse> => {
    return api.post<WarehouseResponse>('/warehouses', warehouse);
  },

  // Update warehouse (Nest: PATCH /warehouses/:id)
  update: async (id: string, warehouse: Partial<Warehouse>): Promise<WarehouseResponse> => {
    return api.patch<WarehouseResponse>(`/warehouses/${id}`, warehouse);
  },

  // Toggle warehouse status
  toggleStatus: async (id: string): Promise<WarehouseResponse> => {
    return api.patch<WarehouseResponse>(`/warehouses/${id}/toggle-status`);
  },

  // Get warehouse employees
  getEmployees: async (warehouseId: string, params?: {
    role?: string;
    active?: boolean;
    search?: string;
  }): Promise<WarehouseEmployeesResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.role) queryParams.append('role', params.role);
    if (params?.active !== undefined) queryParams.append('active', params.active.toString());
    if (params?.search) queryParams.append('search', params.search);
    
    const query = queryParams.toString();
    return api.get<WarehouseEmployeesResponse>(`/warehouses/${warehouseId}/employees${query ? `?${query}` : ''}`);
  },

  // Get warehouse employee by ID (Nest: @Controller('warehouses') + 'warehouse-employees/:id')
  getEmployeeById: async (id: string): Promise<WarehouseEmployeeResponse> => {
    return api.get<WarehouseEmployeeResponse>(
      `/warehouses/warehouse-employees/${id}`,
    );
  },

  // Create warehouse employee
  createEmployee: async (employee: Partial<WarehouseEmployee>): Promise<WarehouseEmployeeResponse> => {
    return api.post<WarehouseEmployeeResponse>(
      '/warehouses/warehouse-employees',
      employee,
    );
  },

  // Update warehouse employee
  updateEmployee: async (id: string, employee: Partial<WarehouseEmployee>): Promise<WarehouseEmployeeResponse> => {
    return api.put<WarehouseEmployeeResponse>(
      `/warehouses/warehouse-employees/${id}`,
      employee,
    );
  },

  // Toggle warehouse employee status
  toggleEmployeeStatus: async (id: string): Promise<WarehouseEmployeeResponse> => {
    return api.patch<WarehouseEmployeeResponse>(
      `/warehouses/warehouse-employees/${id}/toggle-status`,
    );
  },
};
