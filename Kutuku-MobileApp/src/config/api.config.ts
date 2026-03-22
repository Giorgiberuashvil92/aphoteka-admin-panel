/**
 * Aphoteka Backend API – მობილური აპისთვის
 * დროებით: ყოველთვის Railway, თუ EXPO_PUBLIC_API_URL არ არის (dev + production).
 * ლოკალური Nest-ისთვის მერე: დააყენე .env-ში EXPO_PUBLIC_API_URL=http://IP:3001/api
 */
const RAILWAY_API_BASE =
  'https://aphoteka-backend-production.up.railway.app/api';

export function getApiBaseUrl(): string {
  const raw =
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL?.trim() : '';
  if (raw) return raw.replace(/\/$/, '');
  return RAILWAY_API_BASE.replace(/\/$/, '');
}

export const API_CONFIG = {
  get BASE_URL() {
    return getApiBaseUrl();
  },
  endpoints: {
    auth: {
      loginMobile: '/auth/login-mobile',
      registerMobile: '/auth/register-mobile',
      login: '/auth/login',
      register: '/auth/register',
      me: '/auth/me',
      forgotPassword: '/auth/forgot-password',
      resetPassword: '/auth/reset-password',
    },
    products: {
      list: '/products',
      categories: '/products/categories',
      byId: (id: string) => `/products/${id}`,
    },
    orders: {
      create: '/orders',
      myOrders: '/orders',
      byId: (id: string) => `/orders/${id}`,
    },
    promotions: {
      active: '/promotions/active',
      list: '/promotions',
    },
    categories: {
      mobile: '/categories/mobile',
    },
  },
};

export const getAuthHeaders = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
  Accept: 'application/json',
});
