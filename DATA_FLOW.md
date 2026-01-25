# Data Flow Documentation - API Integration

## Overview

პროექტი განკუთვნილია API-სთან ინტეგრაციისთვის. ყველა მონაცემი მოდის ბაზიდან API-ის მეშვეობით.

## API Endpoints Structure

### 1. Accounting Purchase Side (მომწოდებლისგან შეძენა)

**Endpoint**: `POST /api/invoices/purchase`

**Data Fields (მოდის API-დან)**:
```typescript
{
  supplierInvoiceNumber: string;      // მომწოდებლის ინვოისის ნომერი
  invoiceNumber: string;              // ინვოისის ნომერი
  supplierId: string;                 // გამყიდველი
  buyerId: string;                   // მყიდველი
  status: string;                     // სტატუსი
  waybillNumber: string;              // ზედნადების ნომერი
  waybillType: string;                // ზედნადების ტიპი
  transportStartDate: Date;           // ტრანსპორტირების დაწყება
  transportEndDate: Date;             // ტრანსპორტირების დასრულება
  driver: string;                     // მძღოლი
  vehicleNumber: string;              // ა/მ ნომერი
  activationDate: Date;               // გააქტიურების თარიღი
  transportStartDateActual: Date;     // ტრანსპორტირების დაწყების თარიღი
  transportAmount: number;            // ტრანსპ. თანხა
  notes: string;                      // შენიშვნა
  subCustomer: string;                // ქვე-მომხმარებელი
  certificateNumber: string;          // ფირნიშის ან ცნობის ნომერი
  documentNumber: string;             // დოკუმენტის N
  items: [{
    productId: string;
    productCode: string;              // საქონლის კოდი
    productName: string;              // საქონლის დასახელება
    unitOfMeasure: string;            // ზომის ერთეული
    quantity: number;                  // რაოდენობა
    unitPrice: number;                 // ერთეულის ფასი
    totalPrice: number;                // საქონლის ფასი
    tax: number;                       // დაბეგვრა
    batchNumber: string;               // სერიის ნომერი
    expiryDate: Date;                  // ვარგისიანობის ვადა
    manufacturer: string;              // მწარმოებელი (ქვეყანა)
    sku: string;                       // SKU / internal product code
  }]
}
```

### 2. Accounting Sell Side (გაყიდვა)

**Endpoint**: `POST /api/invoices/sales`

**Data Fields**: იგივე რაც Purchase-ში +:
```typescript
{
  appInvoiceNumber: string;           // აპის ინვოისის ნომერი
  orderId: string;                    // დაკავშირებული შეკვეთა
  // ... სხვა fields იგივე
}
```

### 3. Warehouse Receipt (საწყობში აყვანა)

**Endpoint**: `POST /api/inventory/receive`

**Data Fields (მოდის API-დან)**:
```typescript
{
  supplierInvoiceNumber: string;      // მომწოდებლის ინვოისის ნომერი
  purchaseInvoiceId: string;         // დაკავშირებული purchase invoice
  warehouseId: string;
  receiptNumber: string;              // შიდა receipt ნომერი
  status: string;
  receivedBy: string;
  receivedDate: Date;
  items: [{
    productId: string;
    productCode: string;               // საქონლის კოდი
    productName: string;               // საქონლის დასახელება
    unitOfMeasure: string;              // ზომის ერთეული
    quantity: number;                   // რაოდენობა
    unitPrice: number;                  // ერთეულის ფასი
    totalPrice: number;                 // საქონლის ფასი
    tax: number;                        // დაბეგვრა
    batchNumber: string;                // სერიის ნომერი
    expiryDate: Date;                  // ვარგისიანობის ვადა
    manufacturer: string;              // მწარმოებელი (ქვეყანა)
    sku: string;                        // SKU / internal product code
    genericName: string;                // Generic name
    strength: string;                   // Strength (e.g., 500 mg)
    dosageForm: string;                 // Dosage form (tablet, syrup, injection)
    packSize: string;                   // Pack size (10 tablets, 100 ml)
    barcode: string;                    // Barcode (GTIN, if available)
    regulatoryInfo: string;            // დამატებითი ინფო სამ რეგულაციები
    internalNotes: string;              // შიდა დამატებითი ინფორმაცია
  }]
}
```

### 4. Warehouse Dispatch (საწყობიდან გაცემა)

**Endpoint**: `POST /api/inventory/dispatch`

**Data Fields**: იგივე რაც Receipt-ში +:
```typescript
{
  appInvoiceNumber: string;            // აპის ინვოისის ნომერი
  salesInvoiceId: string;              // დაკავშირებული sales invoice
  orderId: string;                     // დაკავშირებული შეკვეთა
  dispatchNumber: string;              // შიდა dispatch ნომერი
  dispatchedBy: string;
  dispatchedDate: Date;
  // ... სხვა fields იგივე
}
```

## Static Fields (რაც არ მოდის API-დან)

ეს ველები დამატებით უნდა დაემატოს UI-ში:

### UI Labels & Translations
- ყველა label-ის თარგმანი ქართულად
- Error messages
- Success messages
- Placeholder texts

### Validation Rules
- Required field validation
- Format validation (dates, numbers, etc.)
- Business logic validation

### Default Values
- Default status values
- Default dates
- Default dropdown options

### Formatting Rules
- Date formatting (ka-GE locale)
- Number formatting (currency, decimals)
- Text formatting

### UI State Management
- Loading states
- Error states
- Success states
- Form state

## Implementation Example

### Component Structure
```typescript
"use client";

import { useApi } from '@/hooks/useApi';
import { inventoryApi } from '@/lib/api';

export default function InventoryReceivePage() {
  // API call - მონაცემები მოდის ბაზიდან
  const { data, loading, error, execute } = useApi(
    () => inventoryApi.receive(receiptData),
    { immediate: false }
  );

  // Static UI elements - არ მოდის API-დან
  const formLabels = {
    batchNumber: "Batch ნომერი",
    expiryDate: "ვადის გასვლის თარიღი",
    // ...
  };

  const validationRules = {
    batchNumber: { required: true, minLength: 3 },
    expiryDate: { required: true, futureDate: true },
    // ...
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
    </form>
  );
}
```

## API Response Format

ყველა API response არის შემდეგი ფორმატით:

```typescript
{
  data: T,           // მთავარი მონაცემები
  total?: number,    // Total count (pagination-ისთვის)
  page?: number,     // Current page
  limit?: number,    // Items per page
}
```

## Error Handling

API errors არის შემდეგი ფორმატით:

```typescript
{
  error: {
    status: number,
    statusText: string,
    message: string,
    details?: any
  }
}
```

## Next Steps

1. ✅ API Client შექმნილია
2. ✅ API Hooks შექმნილია
3. ⏳ Components განახლება API-ს გამოსაყენებლად
4. ⏳ Error boundaries დამატება
5. ⏳ Loading states გაუმჯობესება
6. ⏳ Optimistic updates დამატება
