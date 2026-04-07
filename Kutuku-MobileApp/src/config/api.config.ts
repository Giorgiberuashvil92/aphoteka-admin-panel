/**
 * Default: ლოკალური Nest API.
 * Dev (__DEV__): პირდაპირ localhost.
 * Override: EXPO_PUBLIC_API_URL (.env) — ყოველთვის უპირატესია.
 */
const LOCAL_API_BASE = 'http://localhost:3001/api';

export function getApiBaseUrl(): string {
  const raw =
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL?.trim() : '';
  if (raw) return raw.replace(/\/$/, '');

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return LOCAL_API_BASE.replace(/\/$/, '');
  }

  return LOCAL_API_BASE.replace(/\/$/, '');
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
      changePassword: '/auth/change-password',
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
      bogPayment: (id: string) =>
        `/orders/${encodeURIComponent(id)}/payment/bog`,
    },
    users: {
      lookupByEmail: '/users/lookup-by-email',
      update: (id: string) => `/users/${encodeURIComponent(id)}`,
    },
    prescriptions: {
      create: '/prescriptions',
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
