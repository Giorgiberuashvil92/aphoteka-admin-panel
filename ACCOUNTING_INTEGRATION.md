# Accounting Integration - დეტალური ინფორმაცია

## განხორციელებული ცვლილებები

### 1. Product Entity გაფართოება ✅

დაემატა შემდეგი ველები:
- `sku` - SKU / internal product code
- `genericName` - Generic name
- `strength` - Strength (e.g., 500 mg)
- `dosageForm` - Dosage form (tablet, syrup, injection)
- `packSize` - Pack size (10 tablets, 100 ml)
- `barcode` - Barcode (GTIN, if available)
- `unitOfMeasure` - ზომის ერთეული

### 2. Purchase Invoice Entity ✅

შექმნილია `PurchaseInvoice` და `PurchaseInvoiceItem` entities accounting purchase side-ისთვის:

**PurchaseInvoice ველები:**
- `supplierInvoiceNumber` - მომწოდებლის ინვოისის ნომერი
- `invoiceNumber` - ინვოისის ნომერი
- `supplierId` - გამყიდველი
- `buyerId` - მყიდველი
- `status` - სტატუსი (draft, pending, approved, rejected, paid)
- `waybillNumber` - ზედნადების ნომერი
- `waybillType` - ზედნადების ტიპი
- `transportStartDate` - ტრანსპორტირების დაწყება
- `transportEndDate` - ტრანსპორტირების დასრულება
- `driver` - მძღოლი
- `vehicleNumber` - ა/მ ნომერი
- `activationDate` - გააქტიურების თარიღი
- `transportStartDateActual` - ტრანსპორტირების დაწყების თარიღი
- `transportAmount` - ტრანსპ. თანხა
- `notes` - შენიშვნა
- `subCustomer` - ქვე-მომხმარებელი
- `certificateNumber` - ფირნიშის ან ცნობის ნომერი
- `documentNumber` - დოკუმენტის N
- `items` - PurchaseInvoiceItem[]

**PurchaseInvoiceItem ველები:**
- `productId` - პროდუქტის ID
- `productCode` - საქონლის კოდი
- `productName` - საქონლის დასახელება
- `unitOfMeasure` - ზომის ერთეული
- `quantity` - რაოდენობა
- `unitPrice` - ერთეულის ფასი
- `totalPrice` - საქონლის ფასი
- `tax` - დაბეგვრა
- `batchNumber` - სერიის ნომერი
- `expiryDate` - ვარგისიანობის ვადა
- `manufacturer` - მწარმოებელი (ქვეყანა)

### 3. Sales Invoice Entity ✅

შექმნილია `SalesInvoice` და `SalesInvoiceItem` entities accounting sell side-ისთვის:

**SalesInvoice ველები:**
- `appInvoiceNumber` - აპის ინვოისის ნომერი
- `invoiceNumber` - ინვოისის ნომერი
- `orderId` - დაკავშირებული შეკვეთა
- `customerId` - მყიდველი
- `sellerId` - გამყიდველი
- (იგივე ველები რაც PurchaseInvoice-ში)
- `items` - SalesInvoiceItem[]

**SalesInvoiceItem ველები:**
- (იგივე ველები რაც PurchaseInvoiceItem-ში)

### 4. Warehouse Receipt Entity ✅

შექმნილია `WarehouseReceipt` და `WarehouseReceiptItem` entities საწყობში აყვანისთვის:

**WarehouseReceipt ველები:**
- `supplierInvoiceNumber` - მომწოდებლის ინვოისის ნომერი
- `purchaseInvoiceId` - დაკავშირებული purchase invoice
- `warehouseId` - საწყობი
- `receiptNumber` - შიდა receipt ნომერი
- `status` - სტატუსი (draft, pending, received, rejected)
- `receivedBy` - ვინ მიიღო
- `receivedDate` - მიღების თარიღი
- `items` - WarehouseReceiptItem[]

**WarehouseReceiptItem ველები:**
- `productId` - პროდუქტის ID
- `batchNumber` - სერიის ნომერი
- `expiryDate` - ვარგისიანობის ვადა
- `manufacturer` - მწარმოებელი (ქვეყანა)
- `sku` - SKU / internal product code
- `genericName` - Generic name
- `strength` - Strength (e.g., 500 mg)
- `dosageForm` - Dosage form
- `packSize` - Pack size
- `barcode` - Barcode (GTIN)
- `regulatoryInfo` - დამატებითი ინფო სამ რეგულაციები
- `internalNotes` - შიდა დამატებითი ინფორმაცია
- (ფასების ველები: unitPrice, totalPrice, tax)

### 5. Warehouse Dispatch Entity ✅

შექმნილია `WarehouseDispatch` და `WarehouseDispatchItem` entities საწყობიდან გაცემისთვის:

**WarehouseDispatch ველები:**
- `appInvoiceNumber` - აპის ინვოისის ნომერი
- `salesInvoiceId` - დაკავშირებული sales invoice
- `orderId` - დაკავშირებული შეკვეთა
- `warehouseId` - საწყობი
- `dispatchNumber` - შიდა dispatch ნომერი
- `status` - სტატუსი (draft, pending, dispatched, rejected)
- `dispatchedBy` - ვინ გაიცა
- `dispatchedDate` - გაცემის თარიღი
- `items` - WarehouseDispatchItem[]

**WarehouseDispatchItem ველები:**
- `inventoryId` - რომელი batch-იდან გაიცა
- (იგივე ველები რაც WarehouseReceiptItem-ში)

### 6. UI განახლებები ✅

#### Product Form (`/products/new`)
- დაემატა ველები: SKU, Generic Name, Strength, Dosage Form, Pack Size, Barcode, Unit of Measure

#### Inventory Receive Form (`/inventory/receive`)
- დაემატა სექციები:
  - **Batch ინფორმაცია** - მომწოდებლის ინვოისის ნომერი
  - **პროდუქტის დეტალური ინფორმაცია** - SKU, Generic Name, Strength, Dosage Form, Pack Size, Barcode, Manufacturer
  - **ფასების ინფორმაცია** - ერთეულის ფასი, საქონლის ფასი, დაბეგვრა
  - **ტრანსპორტირების ინფორმაცია** - ზედნადების ნომერი, ტიპი, დაწყება/დასრულება, მძღოლი, ა/მ ნომერი, ტრანსპ. თანხა
  - **დამატებითი ინფორმაცია** - რეგულაციური ინფო, შიდა შენიშვნები

## შემდეგი ნაბიჯები

1. **Purchase Invoice UI** - `/purchase-invoices` გვერდი
2. **Sales Invoice UI** - `/sales-invoices` გვერდი
3. **Warehouse Receipt UI** - `/warehouse-receipts` გვერდი
4. **Warehouse Dispatch UI** - `/warehouse-dispatches` გვერდი
5. **API Integration** - Backend API-სთან ინტეგრაცია

## მნიშვნელობა

ეს entities საშუალებას იძლევა:
- სრული accounting integration
- Purchase და Sales invoices-ის tracking
- Warehouse receipts და dispatches-ის მენეჯმენტი
- Batch-level tracking ყველა დოკუმენტში
- სრული audit trail accounting-ისთვის
