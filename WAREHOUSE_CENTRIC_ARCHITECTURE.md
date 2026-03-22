# საწყობზე დაფუძნებული არქიტექტურა (Warehouse-Centric Architecture)

## 🎯 კონცეფცია

**საწყობი არის მთავარი ელემენტი** - ყველა ოპერაცია და ლოგიკა უნდა იყოს საწყობზე დაფუძნებული.

---

## 📋 სტრუქტურა

### 1. **Navigation სტრუქტურა** (პრიორიტეტი #1)

```
Menu:
├── Dashboard (მთავარი)
├── საწყობები (WAREHOUSES) ⭐ მთავარი სექცია
│   ├── ყველა საწყობი (/warehouses)
│   ├── ახალი საწყობი (/warehouses/new)
│   └── [საწყობის ID] (/warehouses/[id])
│       ├── ინვენტარი (/warehouses/[id]/inventory)
│       ├── მიღება (/warehouses/[id]/receive)
│       ├── გაცემა (/warehouses/[id]/dispatch)
│       ├── შეკვეთები (/warehouses/[id]/orders)
│       ├── თანამშრომლები (/warehouses/[id]/employees)
│       └── რეპორტები (/warehouses/[id]/reports)
├── პროდუქტები
├── შეკვეთები (ზოგადი ხედვა)
├── მომხმარებლები
└── ...
```

### 2. **Warehouse-Centric Routes**

#### 2.1. მთავარი Warehouse გვერდი
- **Route**: `/warehouses`
- **ფუნქციონალი**:
  - ყველა საწყობის სია (ქარდების სახით)
  - საწყობის სტატისტიკა (ინვენტარი, შეკვეთები, თანამშრომლები)
  - ძიება და ფილტრაცია
  - ახალი საწყობის დამატება

#### 2.2. Warehouse Detail გვერდი
- **Route**: `/warehouses/[id]`
- **ფუნქციონალი**:
  - საწყობის ინფორმაცია
  - Quick stats (ინვენტარი, შეკვეთები, თანამშრომლები)
  - Navigation tabs:
    - ინვენტარი
    - მიღება
    - გაცემა
    - შეკვეთები
    - თანამშრომლები
    - რეპორტები

#### 2.3. Warehouse Inventory
- **Route**: `/warehouses/[id]/inventory`
- **ფუნქციონალი**:
  - ამ საწყობის ინვენტარი (იერარქიულად დაჯგუფებული)
  - ძიება და ფილტრაცია
  - Batch details
  - Expiry warnings

#### 2.4. Warehouse Receive
- **Route**: `/warehouses/[id]/receive`
- **ფუნქციონალი**:
  - ინვენტარის მიღება ამ საწყობში
  - Warehouse Receipt form
  - Purchase Invoice linking

#### 2.5. Warehouse Dispatch
- **Route**: `/warehouses/[id]/dispatch`
- **ფუნქციონალი**:
  - ინვენტარის გაცემა ამ საწყობიდან
  - Warehouse Dispatch form
  - Sales Invoice linking
  - Order linking

#### 2.6. Warehouse Orders
- **Route**: `/warehouses/[id]/orders`
- **ფუნქციონალი**:
  - ამ საწყობის შეკვეთები
  - Order status tracking
  - Picking list
  - Dispatch list

#### 2.7. Warehouse Employees
- **Route**: `/warehouses/[id]/employees`
- **ფუნქციონალი**:
  - ამ საწყობის თანამშრომლების სია
  - Role management
  - Employee CRUD

#### 2.8. Warehouse Reports
- **Route**: `/warehouses/[id]/reports`
- **ფუნქციონალი**:
  - ამ საწყობის რეპორტები
  - Inventory reports
  - Sales reports
  - Movement reports

---

## 🔄 Business Logic - Warehouse-Centric

### 1. **Inventory Operations**

#### 1.1. Inventory Receive
```typescript
// Warehouse-ში მიღება
warehouse.receive({
  warehouseId: "warehouse-1",
  items: [...],
  purchaseInvoiceId: "...",
  receivedBy: "user-id",
  receivedDate: new Date()
})
```

#### 1.2. Inventory Dispatch
```typescript
// Warehouse-დან გაცემა
warehouse.dispatch({
  warehouseId: "warehouse-1",
  items: [...],
  orderId: "...",
  salesInvoiceId: "...",
  dispatchedBy: "user-id",
  dispatchedDate: new Date()
})
```

#### 1.3. Inventory Adjustment
```typescript
// Warehouse-ში რეგულირება
warehouse.adjust({
  warehouseId: "warehouse-1",
  inventoryId: "...",
  adjustmentType: "damage",
  quantity: -10,
  reason: "...",
  authorizedBy: "user-id"
})
```

### 2. **Order Processing**

#### 2.1. Order Creation
```typescript
// Order-ის შექმნა warehouse-ის მიხედვით
order.create({
  warehouseId: "warehouse-1", // მთავარი!
  userId: "...",
  items: [...],
  deliveryAddress: "..."
})
```

#### 2.2. Order Confirmation
```typescript
// Order-ის დადასტურება → Inventory Reservation
order.confirm({
  orderId: "...",
  warehouseId: "warehouse-1", // ამ warehouse-იდან უნდა გაიცეს
  // FEFO allocation ამ warehouse-ში
  // Inventory reservation ამ warehouse-ში
})
```

#### 2.3. Order Packing
```typescript
// Order-ის დაფასვა → FEFO Allocation
order.pack({
  orderId: "...",
  warehouseId: "warehouse-1",
  // FEFO allocation ამ warehouse-ში
  // State transition: Reserved → Picked
})
```

#### 2.4. Order Dispatch
```typescript
// Order-ის გაგზავნა → Inventory Deduction
order.dispatch({
  orderId: "...",
  warehouseId: "warehouse-1",
  // Final inventory deduction ამ warehouse-ში
  // State transition: Picked → Dispatched
})
```

### 3. **FEFO Allocation (Warehouse-Specific)**

```typescript
// FEFO allocation მხოლოდ ამ warehouse-ში
function allocateFEFO(
  warehouseId: string,
  productId: string,
  quantity: number
): Inventory[] {
  // 1. მხოლოდ ამ warehouse-ის inventory
  const warehouseInventory = getInventoryByWarehouse(warehouseId);
  
  // 2. მხოლოდ ამ product-ის batches
  const productBatches = warehouseInventory.filter(
    item => item.productId === productId
  );
  
  // 3. FEFO sorting (expiry date ascending)
  const sortedBatches = productBatches.sort(
    (a, b) => a.expiryDate.getTime() - b.expiryDate.getTime()
  );
  
  // 4. Allocation logic
  return allocateFromBatches(sortedBatches, quantity);
}
```

### 4. **Availability Calculation (Warehouse-Specific)**

```typescript
// Availability calculation მხოლოდ ამ warehouse-ში
function calculateAvailability(
  warehouseId: string,
  productId: string
): number {
  const warehouseInventory = getInventoryByWarehouse(warehouseId);
  const productBatches = warehouseInventory.filter(
    item => item.productId === productId
  );
  
  return productBatches.reduce((total, batch) => {
    if (batch.state === InventoryState.EXPIRED) return total;
    if (isExpired(batch.expiryDate)) return total;
    
    return total + batch.availableQuantity;
  }, 0);
}
```

---

## 📊 Data Flow

### 1. **Inventory Flow**
```
Purchase Invoice → Warehouse Receipt → Inventory (warehouse-1)
                                              ↓
                                         Available State
                                              ↓
                                    Order Confirmation
                                              ↓
                                         Reserved State
                                              ↓
                                    Order Packing (FEFO)
                                              ↓
                                          Picked State
                                              ↓
                                    Order Dispatch
                                              ↓
                                        Dispatched State
                                              ↓
                                        Consumed State
```

### 2. **Order Flow (Warehouse-Centric)**
```
Order Creation
    ↓
Warehouse Selection (warehouse-1) ⭐
    ↓
Order Confirmation
    ↓
Inventory Reservation (warehouse-1) ⭐
    ↓
Order Packing
    ↓
FEFO Allocation (warehouse-1) ⭐
    ↓
Order Dispatch
    ↓
Inventory Deduction (warehouse-1) ⭐
```

---

## 🗂️ File Structure

```
src/app/(admin)/
├── (warehouses)/                    ⭐ ახალი - მთავარი სექცია
│   └── warehouses/
│       ├── page.tsx                 # ყველა საწყობი
│       ├── new/
│       │   └── page.tsx             # ახალი საწყობი
│       └── [id]/
│           ├── page.tsx             # საწყობის დეტალები
│           ├── inventory/
│           │   └── page.tsx         # ამ საწყობის ინვენტარი
│           ├── receive/
│           │   └── page.tsx         # ამ საწყობში მიღება
│           ├── dispatch/
│           │   └── page.tsx         # ამ საწყობიდან გაცემა
│           ├── orders/
│           │   └── page.tsx        # ამ საწყობის შეკვეთები
│           ├── employees/
│           │   └── page.tsx        # ამ საწყობის თანამშრომლები
│           └── reports/
│               └── page.tsx        # ამ საწყობის რეპორტები
├── (inventory)/                     # ზოგადი ინვენტარი (warehouse-agnostic)
│   └── inventory/
│       └── page.tsx                 # ყველა warehouse-ის ინვენტარი
├── (orders)/                        # ზოგადი შეკვეთები
│   └── orders/
│       └── page.tsx                 # ყველა warehouse-ის შეკვეთები
└── ...
```

---

## 🔧 Implementation Plan

### Phase 1: Warehouse Management UI ✅
1. ✅ Warehouse CRUD pages
2. ✅ Warehouse list page
3. ✅ Warehouse detail page
4. ✅ Navigation update

### Phase 2: Warehouse-Centric Inventory ⏳
1. ⏳ Warehouse inventory page
2. ⏳ Warehouse receive page
3. ⏳ Warehouse dispatch page
4. ⏳ Inventory API updates (warehouse filtering)

### Phase 3: Warehouse-Centric Orders ⏳
1. ⏳ Warehouse orders page
2. ⏳ Order creation with warehouse selection
3. ⏳ Order processing (warehouse-specific)
4. ⏳ FEFO allocation (warehouse-specific)

### Phase 4: Warehouse Employees ⏳
1. ⏳ Warehouse employees page
2. ⏳ Employee management
3. ⏳ Role assignment

### Phase 5: Warehouse Reports ⏳
1. ⏳ Warehouse-specific reports
2. ⏳ Inventory reports
3. ⏳ Sales reports
4. ⏳ Movement reports

---

## 📝 API Changes

### 1. **Inventory API**
```typescript
// Warehouse filtering ყველა endpoint-ზე
inventoryApi.getAll({
  warehouseId: "warehouse-1" // ⭐ required/optional
})

inventoryApi.receive({
  warehouseId: "warehouse-1", // ⭐ required
  items: [...]
})

inventoryApi.dispatch({
  warehouseId: "warehouse-1", // ⭐ required
  items: [...]
})
```

### 2. **Orders API**
```typescript
// Warehouse filtering
ordersApi.getAll({
  warehouseId: "warehouse-1" // ⭐ optional
})

ordersApi.create({
  warehouseId: "warehouse-1", // ⭐ required
  userId: "...",
  items: [...]
})

ordersApi.confirm({
  orderId: "...",
  warehouseId: "warehouse-1" // ⭐ required for FEFO
})
```

### 3. **Warehouse API** (ახალი)
```typescript
warehouseApi.getAll()
warehouseApi.getById(id)
warehouseApi.create(data)
warehouseApi.update(id, data)
warehouseApi.delete(id)
warehouseApi.getEmployees(warehouseId)
warehouseApi.getInventory(warehouseId)
warehouseApi.getOrders(warehouseId)
warehouseApi.getReports(warehouseId)
```

---

## 🎨 UI/UX Changes

### 1. **Navigation**
- საწყობები პირველ ადგილზე
- Warehouse selection dropdown header-ში (თუ მომხმარებელი მუშაობს ერთ საწყობზე)

### 2. **Breadcrumbs**
```
საწყობები > თბილისი - ცენტრალური > ინვენტარი
```

### 3. **Context Switching**
- Warehouse selector header-ში
- Quick switch between warehouses
- Current warehouse indicator

### 4. **Dashboard**
- Warehouse-specific dashboard
- Warehouse stats
- Recent activity

---

## ✅ Benefits

1. **კლარიტეტი**: ყველა ოპერაცია არის warehouse-ზე დაფუძნებული
2. **ორგანიზება**: ყველა მონაცემი დაჯგუფებულია warehouse-ის მიხედვით
3. **პერფორმანსი**: Warehouse-specific queries უფრო სწრაფია
4. **მენეჯმენტი**: Warehouse managers ხედავენ მხოლოდ თავიანთ warehouse-ს
5. **სკალაბილობა**: ადვილია ახალი warehouse-ების დამატება

---

## 🚀 Next Steps

1. **Warehouse Management UI** - CRUD pages
2. **Navigation Update** - Warehouse section პირველ ადგილზე
3. **Warehouse-Centric Inventory** - Inventory pages warehouse-ის მიხედვით
4. **Warehouse-Centric Orders** - Order processing warehouse-ის მიხედვით
5. **FEFO Logic** - Warehouse-specific FEFO allocation
6. **API Updates** - Warehouse filtering ყველა endpoint-ზე

---

**ბოლო განახლება**: 2025-01-XX
**ვერსია**: 1.0.0
