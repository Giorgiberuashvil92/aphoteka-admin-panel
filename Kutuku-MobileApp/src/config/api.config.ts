/**
 * Aphoteka Backend API – მობილური აპისთვის
 * ბეკენდი: .env PORT (ხშირად 3001) ან default 3002 – იხ. aphoteka-backend
 * რეალურ მოწყობილობაზე: EXPO_PUBLIC_API_URL=http://თქვენი_IP:3001/api
 */
const getBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // ლოკალური – იგივე პორტი რაც ბეკენდზე (.env PORT ან 3001)
  return 'http://localhost:3001/api';
};

export const API_CONFIG = {
  BASE_URL: getBaseUrl(),
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
