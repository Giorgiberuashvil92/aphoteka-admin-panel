/**
 * Aphoteka Backend API – მობილური აპისთვის
 * 1) EXPO_PUBLIC_API_URL — .env / EAS env (უპირატესია)
 * 2) production build (__DEV__ === false) — Railway Nest (იგივე რაც admin apiBaseUrl)
 * 3) dev — localhost (სიმულატორი); ფიზიკური მოწყობილობა: EXPO_PUBLIC_API_URL=http://IP:3001/api
 */
const PRODUCTION_DEFAULT_API_BASE =
  'https://aphoteka-backend-production.up.railway.app/api';

export function getApiBaseUrl(): string {
  const raw =
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL?.trim() : '';
  if (raw) return raw.replace(/\/$/, '');
  if (!__DEV__) {
    return PRODUCTION_DEFAULT_API_BASE.replace(/\/$/, '');
  }
  return 'http://localhost:3001/api';
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
