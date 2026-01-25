// Centralized API exports
export * from './client';
export * from './products';
export * from './inventory';
export * from './orders';
export * from './invoices';

// Re-export all API modules
export { productsApi } from './products';
export { inventoryApi } from './inventory';
export { ordersApi } from './orders';
export { invoicesApi } from './invoices';
