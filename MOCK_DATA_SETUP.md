# Mock Data Setup - დროებითი გამოსაყენებლად

## Overview

პროექტი კონფიგურირებულია რომ გამოიყენოს **Mock Data** API-ს ნაცვლად, სანამ Backend API არ იქნება მზად.

## როგორ მუშაობს

### 1. Automatic Mock Mode

Mock data ავტომატურად გამოიყენება თუ:
- `NEXT_PUBLIC_API_URL` environment variable არ არის დაყენებული
- ან `NODE_ENV === 'development'`

### 2. Mock Data Location

**File**: `src/lib/api/mockData.ts`

შეიცავს:
- `mockProducts` - პროდუქტების mock data
- `mockInventory` - ინვენტარის mock data
- `mockOrders` - შეკვეთების mock data
- `mockCategories` - კატეგორიების mock data
- `mockPromotions` - ფასდაკლებების mock data
- `mockSuppliers` - მომწოდებლების mock data
- `mockDeliveryZones` - მიტანის ზონების mock data
- `mockNotifications` - შეტყობინებების mock data
- `mockPurchaseInvoices` - შესყიდვის ინვოისების mock data
- `mockSalesInvoices` - გაყიდვის ინვოისების mock data
- `mockWarehouseReceipts` - საწყობში აყვანის mock data
- `mockWarehouseDispatches` - საწყობიდან გაცემის mock data

### 3. API Client Integration

API Client (`src/lib/api/client.ts`) ავტომატურად გადადის Mock Mode-ზე თუ:
```typescript
const USE_MOCK_DATA = !process.env.NEXT_PUBLIC_API_URL || process.env.NODE_ENV === 'development';
```

## Mock Data Structure

### Products
```typescript
{
  id: string;
  name: string;
  description?: string;
  price: number;
  active: boolean;
  category?: string;
  sku?: string;
  genericName?: string;
  strength?: string;
  dosageForm?: string;
  packSize?: string;
  barcode?: string;
  unitOfMeasure?: string;
  // ...
}
```

### Inventory
```typescript
{
  id: string;
  productId: string;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  state: InventoryState;
  warehouseLocation: string;
  // ...
}
```

## Real API-ზე გადასვლა

როდესაც Backend API მზად იქნება:

1. **დაამატეთ Environment Variable**:
   ```env
   NEXT_PUBLIC_API_URL=https://your-api-domain.com/api
   ```

2. **Mock Mode ავტომატურად გამორთული იქნება**

3. **ყველა API calls გადავა Real API-ზე**

## Mock API Responses

Mock API responses სიმულირებს network delay-ს:
- `delay(300-1000ms)` - სიმულირებული network latency
- Realistic response structure
- Error handling simulation

## Testing

Mock data-ს შეგიძლიათ გამოიყენოთ:
- Development-ში
- Testing-ში
- Demo-სთვის
- API-ს გარეშე მუშაობისთვის

## Benefits

✅ **No Backend Required** - მუშაობს API-ს გარეშე
✅ **Fast Development** - სწრაფი development
✅ **Easy Testing** - მარტივი testing
✅ **Demo Ready** - მზადაა demo-სთვის

## Mock API Endpoints

ყველა endpoint მხარდება Mock Mode-ში:

### Products
- `GET /products` - პროდუქტების სია
- `GET /products/:id` - პროდუქტი ID-ით
- `POST /products` - ახალი პროდუქტის შექმნა
- `PUT /products/:id` - პროდუქტის განახლება
- `PATCH /products/:id/toggle-status` - სტატუსის შეცვლა

### Inventory
- `GET /inventory` - ინვენტარის სია
- `GET /inventory/:id` - ინვენტარი ID-ით
- `POST /inventory/receive` - საწყობში აყვანა
- `POST /inventory/dispatch` - საწყობიდან გაცემა
- `POST /inventory/adjust` - ინვენტარის კორექტირება
- `GET /inventory/adjustments` - კორექტირებების სია

### Orders
- `GET /orders` - შეკვეთების სია
- `GET /orders/:id` - შეკვეთა ID-ით
- `PATCH /orders/:id/status` - შეკვეთის სტატუსის განახლება
- `POST /orders/:id/cancel` - შეკვეთის გაუქმება

### Categories
- `GET /categories` - კატეგორიების სია
- `GET /categories/:id` - კატეგორია ID-ით
- `POST /categories` - ახალი კატეგორიის შექმნა
- `PUT /categories/:id` - კატეგორიის განახლება
- `PATCH /categories/:id/toggle-status` - სტატუსის შეცვლა

### Promotions
- `GET /promotions` - ფასდაკლებების სია
- `GET /promotions/:id` - ფასდაკლება ID-ით
- `POST /promotions` - ახალი ფასდაკლების შექმნა
- `PUT /promotions/:id` - ფასდაკლების განახლება
- `PATCH /promotions/:id/toggle-status` - სტატუსის შეცვლა

### Suppliers
- `GET /suppliers` - მომწოდებლების სია
- `GET /suppliers/:id` - მომწოდებელი ID-ით
- `POST /suppliers` - ახალი მომწოდებლის შექმნა
- `PUT /suppliers/:id` - მომწოდებლის განახლება
- `PATCH /suppliers/:id/toggle-status` - სტატუსის შეცვლა

### Delivery Zones
- `GET /delivery-zones` - მიტანის ზონების სია
- `GET /delivery-zones/:id` - მიტანის ზონა ID-ით
- `POST /delivery-zones` - ახალი მიტანის ზონის შექმნა
- `PUT /delivery-zones/:id` - მიტანის ზონის განახლება
- `PATCH /delivery-zones/:id/toggle-status` - სტატუსის შეცვლა

### Notifications
- `GET /notifications` - შეტყობინებების სია
- `PATCH /notifications/:id/read` - შეტყობინების წაკითხულად მონიშვნა
- `POST /notifications/read-all` - ყველა შეტყობინების წაკითხულად მონიშვნა

### Invoices
#### Purchase Invoices
- `GET /invoices/purchase` - შესყიდვის ინვოისების სია
- `GET /invoices/purchase/:id` - შესყიდვის ინვოისი ID-ით
- `POST /invoices/purchase` - ახალი შესყიდვის ინვოისის შექმნა
- `PUT /invoices/purchase/:id` - შესყიდვის ინვოისის განახლება

#### Sales Invoices
- `GET /invoices/sales` - გაყიდვის ინვოისების სია
- `GET /invoices/sales/:id` - გაყიდვის ინვოისი ID-ით
- `POST /invoices/sales` - ახალი გაყიდვის ინვოისის შექმნა
- `PUT /invoices/sales/:id` - გაყიდვის ინვოისის განახლება

## Next Steps

1. ✅ Mock Data შექმნილია
2. ✅ API Client კონფიგურირებულია
3. ✅ Components იყენებენ Mock Data-ს
4. ✅ ყველა endpoints მხარდება Mock Mode-ში
5. ⏳ Backend API-ს მზადების შემდეგ დაამატეთ `NEXT_PUBLIC_API_URL`
