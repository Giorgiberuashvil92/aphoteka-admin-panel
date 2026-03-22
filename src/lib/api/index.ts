// Centralized API exports
export * from './client';
export * from './products';
export * from './inventory';
export * from './orders';
export * from './invoices';
export * from './warehouses';
export * from './users';
export * from './auth';
export * from './promotions';
export * from './categories';
export {
  getBalanceTokenInstance,
  getEncodedToken,
  fetchBalanceStocks,
  BALANCE_STOCKS_URL,
} from './balanceClient';

// Re-export all API modules
export { productsApi } from './products';
export { inventoryApi } from './inventory';
export { ordersApi } from './orders';
export { invoicesApi } from './invoices';
export { warehousesApi } from './warehouses';
export { usersApi } from './users';
export { authApi } from './auth';
export { promotionsApi } from './promotions';
export { categoriesApi } from './categories';