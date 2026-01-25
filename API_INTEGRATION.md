# API Integration Guide

## Overview

პროექტი მზადაა API-სთან ინტეგრაციისთვის. ყველა მონაცემი მოდის ბაზიდან API-ის მეშვეობით.

## API Structure

### Base URL
```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
```

### API Client
- **Location**: `src/lib/api/client.ts`
- **Features**:
  - Automatic error handling
  - Authentication token management
  - Type-safe requests

### API Modules

#### 1. Products API (`src/lib/api/products.ts`)
```typescript
productsApi.getAll(params)
productsApi.getById(id)
productsApi.create(product)
productsApi.update(id, product)
productsApi.delete(id)
productsApi.toggleStatus(id)
```

#### 2. Inventory API (`src/lib/api/inventory.ts`)
```typescript
inventoryApi.getAll(params)
inventoryApi.getById(id)
inventoryApi.receive(receipt) // Warehouse receipt
inventoryApi.dispatch(dispatch) // Warehouse dispatch
inventoryApi.adjust(adjustment)
inventoryApi.getAdjustments(inventoryId)
```

#### 3. Orders API (`src/lib/api/orders.ts`)
```typescript
ordersApi.getAll(params)
ordersApi.getById(id)
ordersApi.updateStatus(id, status)
ordersApi.cancel(id, reason)
```

#### 4. Invoices API (`src/lib/api/invoices.ts`)
```typescript
// Purchase Invoices
invoicesApi.purchase.getAll(params)
invoicesApi.purchase.getById(id)
invoicesApi.purchase.create(invoice)
invoicesApi.purchase.update(id, invoice)

// Sales Invoices
invoicesApi.sales.getAll(params)
invoicesApi.sales.getById(id)
invoicesApi.sales.create(invoice)
invoicesApi.sales.update(id, invoice)
```

## React Hooks

### useApi Hook
Generic hook for API calls:
```typescript
const { data, loading, error, execute } = useApi(
  () => api.getData(),
  { immediate: true }
);
```

### useProducts Hook
```typescript
const { data, loading, error } = useProducts({
  page: 1,
  limit: 10,
  search: 'paracetamol'
});
```

## Data Flow

### 1. Accounting Purchase Side
- **API Endpoint**: `/invoices/purchase`
- **Data Fields**: 
  - მომწოდებლის ინვოისის ნომერი
  - SKU / internal product code
  - ინვოისის ნომერი
  - საქონლის კოდი, დასახელება
  - ზომის ერთეული, რაოდენობა
  - ერთეულის ფასი, საქონლის ფასი
  - დაბეგვრა
  - ზედნადების ნომერი, ტიპი
  - ტრანსპორტირების ინფორმაცია
  - მძღოლი, ა/მ ნომერი
  - გააქტიურების თარიღი
  - ტრანსპ. თანხა
  - შენიშვნა
  - ქვე-მომხმარებელი
  - ფირნიშის ან ცნობის ნომერი
  - დოკუმენტის N

### 2. Accounting Sell Side
- **API Endpoint**: `/invoices/sales`
- **Data Fields**: იგივე fields რაც purchase-ში + აპის ინვოისის ნომერი

### 3. Warehouse Receipt (საწყობში აყვანა)
- **API Endpoint**: `/inventory/receive`
- **Data Fields**:
  - მომწოდებლის ინვოისის ნომერი
  - დამატებითი ინფო სამ რეგულაციები
  - შიდა დამატებითი ინფორმაცია
  - სერიის ნომერი (batch number)
  - ვარგისიანობის ვადა (expiry date)
  - მწარმოებელი (ქვეყანა)
  - SKU / internal product code
  - Generic name
  - Product name (brand)
  - Strength (e.g., 500 mg)
  - Dosage form (tablet, syrup, injection)
  - Pack size (10 tablets, 100 ml)
  - Barcode (GTIN, if available)

### 4. Warehouse Dispatch (საწყობიდან გაცემა)
- **API Endpoint**: `/inventory/dispatch`
- **Data Fields**: იგივე fields რაც receipt-ში + აპის ინვოისის ნომერი

## Static Fields (რაც არ მოდის API-დან)

ეს ველები დამატებით უნდა დაემატოს UI-ში:
- UI labels და translations
- Validation rules
- Default values
- Formatting rules

## Environment Variables

დაამატეთ `.env.local` ფაილში:
```env
NEXT_PUBLIC_API_URL=https://your-api-url.com/api
```

## Usage Example

```typescript
import { productsApi } from '@/lib/api';
import { useProducts } from '@/hooks/useProducts';

function ProductsPage() {
  const { data, loading, error } = useProducts({
    page: 1,
    limit: 20,
    search: 'paracetamol'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      {data?.data.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

## Error Handling

```typescript
import { ApiError } from '@/lib/api/client';

try {
  const result = await productsApi.getAll();
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.status, error.statusText);
    console.error('Error Data:', error.data);
  }
}
```

## Authentication

API client ავტომატურად ამატებს auth token localStorage-დან:
```typescript
const token = localStorage.getItem('auth_token');
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}
```

## Next Steps

1. დააყენეთ API URL environment variable-ში
2. განაახლეთ components რომ იყენებდნენ API hooks-ს
3. დაამატეთ error boundaries
4. დაამატეთ loading states
5. დაამატეთ optimistic updates
