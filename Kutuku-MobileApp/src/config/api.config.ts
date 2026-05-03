import { Platform } from 'react-native';

/**
 * Dev (__DEV__): ლოკალური Nest.
 * Android ემულატორზე `localhost` თავად ემულატორს ეკუთვნის — მაკზე Nest-ისთვის გამოიყენე `10.0.2.2`.
 * Production fallback: Railway (EAS-ში ხშირად EXPO_PUBLIC_API_URL იგივეა).
 * Override: EXPO_PUBLIC_API_URL (.env) — ყოველთვის უპირატესია.
 */
const LOCAL_API_HOST =
  typeof Platform !== 'undefined' && Platform.OS === 'android'
    ? 'http://10.0.2.2:3001'
    : 'http://localhost:3001';
const LOCAL_API_BASE = `${LOCAL_API_HOST}/api`;
const PRODUCTION_API_BASE =
  'https://aphoteka-admin-panel-production.up.railway.app/api';

export function getApiBaseUrl(): string {
  const raw =
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL?.trim() : '';
  if (raw) return raw.replace(/\/$/, '');

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return LOCAL_API_BASE.replace(/\/$/, '');
  }

  return PRODUCTION_API_BASE.replace(/\/$/, '');
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
      resetPasswordWithToken: '/auth/reset-password-with-token',
      sendVerificationOtp: '/auth/send-verification-otp',
      verifyVerificationOtp: '/auth/verify-verification-otp',
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
      /** დევ: BOG callback-ის იმიტაცია (იგივე ჩართვა რაც ბექის testPut) */
      bogDevSimulateCompleted: (id: string) =>
        `/orders/${encodeURIComponent(id)}/payment/bog/dev-simulate-completed`,
    },
    users: {
      lookupByEmail: '/users/lookup-by-email',
      update: (id: string) => `/users/${encodeURIComponent(id)}`,
    },
    prescriptions: {
      create: '/prescriptions',
      my: '/prescriptions/my',
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
