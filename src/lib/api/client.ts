import { getApiBaseUrl } from '@/lib/apiBaseUrl';
import { getAuthToken } from '@/lib/authToken';

// Mock მხოლოდ local dev-ში, როცა NEXT_PUBLIC_API_URL არ არის; production / Vercel → რეალური API
const USE_MOCK_DATA =
  process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL?.trim();

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Route to appropriate handler
  const path = endpoint.split('?')[0];
  const method = options.method || 'GET';
  
  // Products, Inventory, Warehouses, Users, Auth, Promotions - always use real API, skip mock data
  if (path === '/products' || path.startsWith('/products/') ||
      path === '/inventory' || path.startsWith('/inventory/') ||
      path === '/warehouses' || path.startsWith('/warehouses/') ||
      path === '/users' || path.startsWith('/users/') ||
      path === '/auth' || path.startsWith('/auth/') ||
      path === '/promotions' || path.startsWith('/promotions/') ||
      path === '/categories' || path.startsWith('/categories/') ||
      path === '/orders' || path.startsWith('/orders/')) {
    // Skip mock data, go directly to real API
  } else if (USE_MOCK_DATA) {
    // Use mock data for other endpoints if enabled
    // Import mock data dynamically to avoid issues
    const { mockApiResponses } = await import('./mockData');
    
    if (path === '/orders' && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const status = params.get('status') || undefined;
      const paymentStatus = params.get('paymentStatus') || undefined;
      return mockApiResponses.orders.getAll({ status, paymentStatus }) as T;
    }
    
    if (path.startsWith('/orders/') && method === 'GET') {
      const id = path.split('/orders/')[1];
      return mockApiResponses.orders.getById(id) as T;
    }
    
    if (path.startsWith('/orders/') && method === 'PATCH' && path.includes('status')) {
      const id = path.split('/orders/')[1].split('/')[0];
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.orders.updateStatus(id, body.status) as T;
    }
    
    if (path.startsWith('/orders/') && method === 'POST' && path.includes('cancel')) {
      const id = path.split('/orders/')[1].split('/')[0];
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.orders.cancel(id, body.reason) as T;
    }
    
    // Categories
    if (path === '/categories' && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const search = params.get('search') || undefined;
      const active = params.get('active') === 'true' ? true : params.get('active') === 'false' ? false : undefined;
      return mockApiResponses.categories.getAll({ search, active }) as T;
    }
    
    if (path.startsWith('/categories/') && method === 'GET') {
      const id = path.split('/categories/')[1];
      return mockApiResponses.categories.getById(id) as T;
    }
    
    if (path === '/categories' && method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.categories.create(body) as T;
    }
    
    if (path.startsWith('/categories/') && method === 'PUT') {
      const id = path.split('/categories/')[1];
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.categories.update(id, body) as T;
    }
    
    if (path.startsWith('/categories/') && method === 'PATCH' && path.includes('toggle-status')) {
      const id = path.split('/categories/')[1].split('/')[0];
      return mockApiResponses.categories.toggleStatus(id) as T;
    }
    
    // Promotions
    if (path === '/promotions' && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const search = params.get('search') || undefined;
      const active = params.get('active') === 'true' ? true : params.get('active') === 'false' ? false : undefined;
      return mockApiResponses.promotions.getAll({ search, active }) as T;
    }
    
    if (path.startsWith('/promotions/') && method === 'GET') {
      const id = path.split('/promotions/')[1];
      return mockApiResponses.promotions.getById(id) as T;
    }
    
    if (path === '/promotions' && method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.promotions.create(body) as T;
    }
    
    if (path.startsWith('/promotions/') && method === 'PUT') {
      const id = path.split('/promotions/')[1];
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.promotions.update(id, body) as T;
    }
    
    if (path.startsWith('/promotions/') && method === 'PATCH' && path.includes('toggle-status')) {
      const id = path.split('/promotions/')[1].split('/')[0];
      return mockApiResponses.promotions.toggleStatus(id) as T;
    }
    
    // Suppliers
    if (path === '/suppliers' && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const search = params.get('search') || undefined;
      const active = params.get('active') === 'true' ? true : params.get('active') === 'false' ? false : undefined;
      return mockApiResponses.suppliers.getAll({ search, active }) as T;
    }
    
    if (path.startsWith('/suppliers/') && method === 'GET') {
      const id = path.split('/suppliers/')[1];
      return mockApiResponses.suppliers.getById(id) as T;
    }
    
    if (path === '/suppliers' && method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.suppliers.create(body) as T;
    }
    
    if (path.startsWith('/suppliers/') && method === 'PUT') {
      const id = path.split('/suppliers/')[1];
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.suppliers.update(id, body) as T;
    }
    
    if (path.startsWith('/suppliers/') && method === 'PATCH' && path.includes('toggle-status')) {
      const id = path.split('/suppliers/')[1].split('/')[0];
      return mockApiResponses.suppliers.toggleStatus(id) as T;
    }
    
    // Delivery Zones
    if (path === '/delivery-zones' && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const city = params.get('city') || undefined;
      const active = params.get('active') === 'true' ? true : params.get('active') === 'false' ? false : undefined;
      const search = params.get('search') || undefined;
      return mockApiResponses.deliveryZones.getAll({ city, active, search }) as T;
    }
    
    if (path.startsWith('/delivery-zones/') && method === 'GET') {
      const id = path.split('/delivery-zones/')[1];
      return mockApiResponses.deliveryZones.getById(id) as T;
    }
    
    if (path === '/delivery-zones' && method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.deliveryZones.create(body) as T;
    }
    
    if (path.startsWith('/delivery-zones/') && method === 'PUT') {
      const id = path.split('/delivery-zones/')[1];
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.deliveryZones.update(id, body) as T;
    }
    
    if (path.startsWith('/delivery-zones/') && method === 'PATCH' && path.includes('toggle-status')) {
      const id = path.split('/delivery-zones/')[1].split('/')[0];
      return mockApiResponses.deliveryZones.toggleStatus(id) as T;
    }
    
    // Notifications
    if (path === '/notifications' && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const read = params.get('read') === 'true' ? true : params.get('read') === 'false' ? false : undefined;
      const type = params.get('type') || undefined;
      return mockApiResponses.notifications.getAll({ read, type }) as T;
    }
    
    if (path.startsWith('/notifications/') && method === 'PATCH' && path.includes('read')) {
      const id = path.split('/notifications/')[1].split('/')[0];
      return mockApiResponses.notifications.markAsRead(id) as T;
    }
    
    if (path === '/notifications/read-all' && method === 'POST') {
      return mockApiResponses.notifications.markAllAsRead() as T;
    }
    
    // Invoices - Purchase
    if (path === '/invoices/purchase' && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const supplierId = params.get('supplierId') || undefined;
      const status = params.get('status') || undefined;
      return mockApiResponses.invoices.purchase.getAll({ supplierId, status }) as T;
    }
    
    if (path.startsWith('/invoices/purchase/') && method === 'GET') {
      const id = path.split('/invoices/purchase/')[1];
      return mockApiResponses.invoices.purchase.getById(id) as T;
    }
    
    if (path === '/invoices/purchase' && method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.invoices.purchase.create(body) as T;
    }
    
    if (path.startsWith('/invoices/purchase/') && method === 'PUT') {
      const id = path.split('/invoices/purchase/')[1];
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.invoices.purchase.update(id, body) as T;
    }
    
    // Invoices - Sales
    if (path === '/invoices/sales' && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const orderId = params.get('orderId') || undefined;
      const customerId = params.get('customerId') || undefined;
      const status = params.get('status') || undefined;
      return mockApiResponses.invoices.sales.getAll({ orderId, customerId, status }) as T;
    }
    
    if (path.startsWith('/invoices/sales/') && method === 'GET') {
      const id = path.split('/invoices/sales/')[1];
      return mockApiResponses.invoices.sales.getById(id) as T;
    }
    
    if (path === '/invoices/sales' && method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.invoices.sales.create(body) as T;
    }
    
    if (path.startsWith('/invoices/sales/') && method === 'PUT') {
      const id = path.split('/invoices/sales/')[1];
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.invoices.sales.update(id, body) as T;
    }
    
    // Inventory dispatch
    if (path === '/inventory/dispatch' && method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.inventory.dispatch(body) as T;
    }
    
    if (path === '/inventory/adjust' && method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.inventory.adjust(body) as T;
    }
    
    if (path === '/inventory/adjustments' && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const inventoryId = params.get('inventoryId') || undefined;
      return mockApiResponses.inventory.getAdjustments(inventoryId) as T;
    }
    
    // Warehouses
    if (path === '/warehouses' && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const city = params.get('city') || undefined;
      const active = params.get('active') === 'true' ? true : params.get('active') === 'false' ? false : undefined;
      const search = params.get('search') || undefined;
      return mockApiResponses.warehouses.getAll({ city, active, search }) as T;
    }
    
    if (path.startsWith('/warehouses/') && method === 'GET') {
      const id = path.split('/warehouses/')[1];
      return mockApiResponses.warehouses.getById(id) as T;
    }
    
    if (path === '/warehouses' && method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.warehouses.create(body) as T;
    }
    
    if (path.startsWith('/warehouses/') && method === 'PUT') {
      const id = path.split('/warehouses/')[1];
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.warehouses.update(id, body) as T;
    }
    
    if (path.startsWith('/warehouses/') && method === 'PATCH' && path.includes('toggle-status')) {
      const id = path.split('/warehouses/')[1].split('/')[0];
      return mockApiResponses.warehouses.toggleStatus(id) as T;
    }
    
    // Warehouse Employees
    if (path === '/warehouses' && path.includes('/employees') && method === 'GET') {
      const warehouseId = path.split('/warehouses/')[1]?.split('/employees')[0];
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const role = params.get('role') || undefined;
      const active = params.get('active') === 'true' ? true : params.get('active') === 'false' ? false : undefined;
      const search = params.get('search') || undefined;
      return mockApiResponses.warehouseEmployees.getAll({ warehouseId, role, active, search }) as T;
    }
    
    if (path === '/warehouse-employees' && method === 'GET') {
      const params = new URLSearchParams(endpoint.split('?')[1] || '');
      const warehouseId = params.get('warehouseId') || undefined;
      const role = params.get('role') || undefined;
      const active = params.get('active') === 'true' ? true : params.get('active') === 'false' ? false : undefined;
      const search = params.get('search') || undefined;
      return mockApiResponses.warehouseEmployees.getAll({ warehouseId, role, active, search }) as T;
    }
    
    if (path.startsWith('/warehouse-employees/') && method === 'GET') {
      const id = path.split('/warehouse-employees/')[1];
      return mockApiResponses.warehouseEmployees.getById(id) as T;
    }
    
    if (path === '/warehouse-employees' && method === 'POST') {
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.warehouseEmployees.create(body) as T;
    }
    
    if (path.startsWith('/warehouse-employees/') && method === 'PUT') {
      const id = path.split('/warehouse-employees/')[1];
      const body = options.body ? JSON.parse(options.body as string) : {};
      return mockApiResponses.warehouseEmployees.update(id, body) as T;
    }
    
    if (path.startsWith('/warehouse-employees/') && method === 'PATCH' && path.includes('toggle-status')) {
      const id = path.split('/warehouse-employees/')[1].split('/')[0];
      return mockApiResponses.warehouseEmployees.toggleStatus(id) as T;
    }
    
    // Default mock response
    return {} as T;
  }

  const apiBase = getApiBaseUrl();
  const url = `${apiBase}${endpoint}`;
  const requestBody = options.body ? (typeof options.body === 'string' ? JSON.parse(options.body) : options.body) : undefined;
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 API Request:', {
      url,
      method: options.method || 'GET',
      apiBase,
      endpoint,
      body: requestBody,
    });
  }
  
  /** GET/HEAD + Content-Type: application/json → ყოველთვის CORS preflight; Railway/ვერსელი ზოგჯერ იქ ჩავარდება */
  const methodUpper = (options.method || 'GET').toUpperCase();
  const defaultHeaders: HeadersInit = {};
  if (methodUpper !== 'GET' && methodUpper !== 'HEAD') {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const token = getAuthToken();
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(response.status, response.statusText, errorData);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }

    return {} as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper methods
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: <T>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};
