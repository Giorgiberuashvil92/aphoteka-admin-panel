import Constants from 'expo-constants';
import { Platform } from 'react-native';

/**
 * იგივე Railway URL რაც admin: src/lib/apiBaseUrl.ts → RAILWAY_NEST_API_DEFAULT
 * Dev (__DEV__): ლოკალური Nest (იგივე პორტი რაც admin dev-ში — 3001, prefix /api).
 * Override: EXPO_PUBLIC_API_URL (.env) — ყოველთვის უპირატესია (მაგ. ტელეფონი სხვა IP-ზე).
 */
const RAILWAY_API_BASE =
  'https://aphoteka-admin-panel-production.up.railway.app/api';

const LOCAL_NEST_PORT = 3001;

/** dev-ში API host (Expo Go-ზე ხშირად LAN IP მოდის hostUri-დან) */
function getDevMachineHost(): string {
  const hostUri = Constants.expoConfig?.hostUri;
  const fromMetro = hostUri?.split(':')[0]?.trim();
  if (
    fromMetro &&
    fromMetro !== '127.0.0.1' &&
    fromMetro !== 'localhost'
  ) {
    return fromMetro;
  }
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

function getLocalNestApiBase(): string {
  const host = getDevMachineHost();
  return `http://${host}:${LOCAL_NEST_PORT}/api`;
}

export function getApiBaseUrl(): string {
  const raw =
    typeof process !== 'undefined' ? process.env?.EXPO_PUBLIC_API_URL?.trim() : '';
  if (raw) return raw.replace(/\/$/, '');

  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return getLocalNestApiBase();
  }

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
