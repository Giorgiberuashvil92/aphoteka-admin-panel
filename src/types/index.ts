// User Roles
export enum UserRole {
  CONSUMER = "consumer",
  OPERATIONS = "operations",
  DELIVERY = "delivery",
  ADMIN = "admin",
}

// User Permissions
export enum UserPermission {
  // Product permissions
  VIEW_PRODUCTS = 'view_products',
  CREATE_PRODUCTS = 'create_products',
  EDIT_PRODUCTS = 'edit_products',
  DELETE_PRODUCTS = 'delete_products',
  
  // Inventory permissions
  VIEW_INVENTORY = 'view_inventory',
  MANAGE_INVENTORY = 'manage_inventory',
  RECEIVE_INVENTORY = 'receive_inventory',
  DISPATCH_INVENTORY = 'dispatch_inventory',
  
  // Warehouse permissions
  VIEW_WAREHOUSES = 'view_warehouses',
  MANAGE_WAREHOUSES = 'manage_warehouses',
  
  // User permissions
  VIEW_USERS = 'view_users',
  CREATE_USERS = 'create_users',
  EDIT_USERS = 'edit_users',
  DELETE_USERS = 'delete_users',
  
  // Order permissions
  VIEW_ORDERS = 'view_orders',
  MANAGE_ORDERS = 'manage_orders',
  
  // Reports permissions
  VIEW_REPORTS = 'view_reports',
  
  // Admin permissions
  ADMIN_ACCESS = 'admin_access',
}

// User Entity
export interface User {
  id: string;
  role: UserRole;
  phoneNumber: string;
  email?: string;
  fullName?: string;
  warehouseId?: string; // თუ თანამშრომელია საწყობში
  warehouse?: Warehouse; // Populated warehouse data
  status: "active" | "inactive" | "suspended";
  permissions?: UserPermission[];
  createdAt: Date;
  updatedAt: Date;
}

// Product Group - იერარქიის ზედა დონე (Generic Name)
export interface ProductGroup {
  id: string;
  genericName: string; // e.g., "Paracetamol"
  description?: string;
  category?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product Variant - იერარქიის მეორე დონე (Generic + Country)
export interface ProductVariant {
  id: string;
  productGroupId: string;
  productGroup?: ProductGroup;
  countryOfOrigin: string; // e.g., "საქართველო", "გერმანია", "ინდოეთი"
  manufacturer?: string; // მწარმოებელი კომპანიის სახელი
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product Strength - იერარქიის მესამე დონე (Generic + Country + Strength)
export interface ProductStrength {
  id: string;
  productVariantId: string;
  productVariant?: ProductVariant;
  strength: string; // e.g., "5 mg", "10 mg", "200 mg", "500 mg"
  dosageForm: string; // tablet, syrup, injection
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Product Entity - იერარქიის ქვედა დონე (კონკრეტული პროდუქტი)
export interface Product {
  id: string;
  productStrengthId: string; // Reference to ProductStrength
  productStrength?: ProductStrength; // Populated strength data
  
  name: string; // Product name (brand) - e.g., "Paracetamol 500mg - Bayer"
  description?: string;
  price: number;
  active: boolean;
  category?: string;
  imageUrl?: string;
  
  // Specific product information
  sku: string; // SKU / internal product code (unique)
  packSize?: string; // 10 tablets, 100 ml
  barcode?: string; // GTIN, if available (unique)
  unitOfMeasure?: string; // ზომის ერთეული
  
  // Computed fields for easy access (from hierarchy)
  genericName?: string; // From ProductGroup
  countryOfOrigin?: string; // From ProductVariant
  manufacturer?: string; // From ProductVariant
  strength?: string; // From ProductStrength
  dosageForm?: string; // From ProductStrength
  
  // Additional catalog fields
  productCode?: string; // საქონლის კოდი
  quantity?: number; // რაოდენობა
  /** Balance Exchange/Stocks Reserve ჯამი */
  reservedQuantity?: number;
  /** საწყობების მიხედვით დაშლილი ნაშთი (Balance) */
  balanceStockBreakdown?: Array<{
    balanceWarehouseUuid: string;
    balanceBranchUuid?: string;
    balanceWarehouseName?: string;
    quantity: number;
    reserve: number;
    seriesUuid?: string;
  }>;
  /** Balance ItemsSeries — სერიული ნომრები ნომენკლატურაზე */
  balanceItemSeries?: Array<{
    seriesNumber?: string;
    seriesUuid?: string;
    quantity?: number;
    expiryDate?: string;
    warehouseUuid?: string;
  }>;
  totalPrice?: number; // საქონლის ფასი (quantity * price)
  taxation?: string; // დაბეგვრა
  invoiceNumber?: string; // ზედნადების ნომერი
  buyer?: string; // მყიდველი
  seller?: string; // გამყიდველი
  activationDate?: Date | string; // გააქტიურების თარიღი
  transportStartDate?: Date | string; // ტრანსპორტირების დაწყების თარიღი
  certificateNumber?: string; // ფირნიშის ან ცნობის ნომერი
  documentNumber?: string; // დოკუმენტის N
  serialNumber?: string; // სერიის ნომერი
  expiryDate?: Date | string; // ვარგისიანობის ვადა
  packagingType?: string; // შეფუთვის სახეობა
  productNameBrand?: string; // Product name (brand)
  
  createdAt: Date;
  updatedAt: Date;
}

// Inventory States
export enum InventoryState {
  RECEIVED_BLOCKED = "received_blocked",
  AVAILABLE = "available",
  RESERVED = "reserved",
  PICKED = "picked",
  DISPATCHED = "dispatched",
  CONSUMED = "consumed",
  EXPIRED = "expired",
  REJECTED = "rejected",
}

// Inventory Entity (Batch-level)
export interface Inventory {
  id: string;
  productId: string;
  product?: Product;
  batchNumber: string;
  expiryDate: Date;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  state: InventoryState;
  warehouseLocation: string;
  warehouseName?: string;
  receivedDate: Date;
  supplier?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Order Status
export enum OrderStatus {
  CREATED = "created",
  CONFIRMED = "confirmed",
  PACKED = "packed",
  OUT_FOR_DELIVERY = "out_for_delivery",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
  FAILED = "failed",
}

// Payment Status
export enum PaymentStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

// Order Entity
export interface Order {
  id: string;
  userId: string;
  user?: User;
  status: OrderStatus;
  totalAmount: number;
  deliveryFee: number;
  paymentStatus: PaymentStatus;
  deliveryAddress: string;
  deliveryCity?: string;
  deliveryPhone?: string;
  warehouseLocation?: string;
  createdAt: Date;
  updatedAt: Date;
  confirmedAt?: Date;
  packedAt?: Date;
  dispatchedAt?: Date;
  deliveredAt?: Date;
  cancelledAt?: Date;
  items: OrderItem[];
}

// Order Item Entity
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product?: Product;
  quantity: number;
  priceAtOrderTime: number;
  batchNumber?: string;
  inventoryId?: string;
}

// Warehouse Employee Role
export enum WarehouseEmployeeRole {
  MANAGER = "manager", // მენეჯერი
  WAREHOUSE_KEEPER = "warehouse_keeper", // საწყობის მცველი
  PICKER = "picker", // შემკრები
  DISPATCHER = "dispatcher", // გამგზავნი
  RECEIVER = "receiver", // მიმღები
}

// Warehouse Employee
export interface WarehouseEmployee {
  id: string;
  warehouseId: string;
  warehouse?: Warehouse;
  userId: string;
  user?: User;
  role: WarehouseEmployeeRole;
  active: boolean;
  startedAt: Date; // როდის დაიწყო მუშაობა
  endedAt?: Date; // როდის დასრულდა (თუ აღარ მუშაობს)
  createdAt: Date;
  updatedAt: Date;
}

// Warehouse Location
export interface Warehouse {
  id: string;
  name: string;
  address: string;
  city: string;
  phoneNumber?: string;
  email?: string;
  managerId?: string; // მენეჯერის ID
  manager?: User; // Populated manager data
  employees?: WarehouseEmployee[]; // Populated employees list
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Inventory Adjustment
export interface InventoryAdjustment {
  id: string;
  inventoryId: string;
  inventory?: Inventory;
  adjustmentType: "damage" | "theft" | "expiry_writeoff" | "cycle_count" | "other";
  quantity: number; // negative for reductions
  reason: string;
  authorizedBy: string;
  createdAt: Date;
}

// Audit Log
export interface AuditLog {
  id: string;
  entityType: "order" | "inventory" | "payment" | "user" | "product";
  entityId: string;
  action: string;
  userId: string;
  user?: User;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

// Stock Movement Ledger Entry
export interface StockMovement {
  id: string;
  inventoryId: string;
  inventory?: Inventory;
  movementType: "inbound" | "outbound" | "adjustment" | "reservation" | "release" | "expiry";
  quantity: number;
  previousQuantity: number;
  newQuantity: number;
  orderId?: string;
  adjustmentId?: string;
  notes?: string;
  createdAt: Date;
  createdBy: string;
}

// Purchase Invoice Item (for accounting purchase side)
export interface PurchaseInvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  product?: Product;
  productCode?: string; // საქონლის კოდი
  productName?: string; // საქონლის დასახელება
  unitOfMeasure?: string; // ზომის ერთეული
  quantity: number; // რაოდენობა
  unitPrice: number; // ერთეულის ფასი
  totalPrice: number; // საქონლის ფასი
  tax?: number; // დაბეგვრა
  batchNumber?: string; // სერიის ნომერი
  expiryDate?: Date; // ვარგისიანობის ვადა
  manufacturer?: string; // მწარმოებელი (ქვეყანა)
}

// Purchase Invoice (მომწოდებლისგან შეძენა)
export interface PurchaseInvoice {
  id: string;
  supplierInvoiceNumber: string; // მომწოდებლის ინვოისის ნომერი
  invoiceNumber: string; // ინვოისის ნომერი
  supplierId?: string; // გამყიდველი
  buyerId?: string; // მყიდველი
  status: "draft" | "pending" | "approved" | "rejected" | "paid";
  waybillNumber?: string; // ზედნადების ნომერი
  waybillType?: string; // ზედნადების ტიპი
  transportStartDate?: Date; // ტრანსპორტირების დაწყება
  transportEndDate?: Date; // ტრანსპორტირების დასრულება
  driver?: string; // მძღოლი
  vehicleNumber?: string; // ა/მ ნომერი
  activationDate?: Date; // გააქტიურების თარიღი
  transportStartDateActual?: Date; // ტრანსპორტირების დაწყების თარიღი
  transportAmount?: number; // ტრანსპ. თანხა
  notes?: string; // შენიშვნა
  subCustomer?: string; // ქვე-მომხმარებელი
  certificateNumber?: string; // ფირნიშის ან ცნობის ნომერი
  documentNumber?: string; // დოკუმენტის N
  items: PurchaseInvoiceItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Sales Invoice Item (for accounting sell side)
export interface SalesInvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  product?: Product;
  productCode?: string; // საქონლის კოდი
  productName?: string; // საქონლის დასახელება
  unitOfMeasure?: string; // ზომის ერთეული
  quantity: number; // რაოდენობა
  unitPrice: number; // ერთეულის ფასი
  totalPrice: number; // საქონლის ფასი
  tax?: number; // დაბეგვრა
  batchNumber?: string; // სერიის ნომერი
  expiryDate?: Date; // ვარგისიანობის ვადა
  manufacturer?: string; // მწარმოებელი (ქვეყანა)
}

// Sales Invoice (გაყიდვა)
export interface SalesInvoice {
  id: string;
  appInvoiceNumber: string; // აპის ინვოისის ნომერი
  invoiceNumber: string; // ინვოისის ნომერი
  orderId?: string; // დაკავშირებული შეკვეთა
  customerId?: string; // მყიდველი
  sellerId?: string; // გამყიდველი
  status: "draft" | "pending" | "approved" | "rejected" | "paid";
  waybillNumber?: string; // ზედნადების ნომერი
  waybillType?: string; // ზედნადების ტიპი
  transportStartDate?: Date; // ტრანსპორტირების დაწყება
  transportEndDate?: Date; // ტრანსპორტირების დასრულება
  driver?: string; // მძღოლი
  vehicleNumber?: string; // ა/მ ნომერი
  activationDate?: Date; // გააქტიურების თარიღი
  transportStartDateActual?: Date; // ტრანსპორტირების დაწყების თარიღი
  transportAmount?: number; // ტრანსპ. თანხა
  notes?: string; // შენიშვნა
  subCustomer?: string; // ქვე-მომხმარებელი
  certificateNumber?: string; // ფირნიშის ან ცნობის ნომერი
  documentNumber?: string; // დოკუმენტის N
  items: SalesInvoiceItem[];
  createdAt: Date;
  updatedAt: Date;
}

// Warehouse Receipt Item (საწყობში აყვანა)
export interface WarehouseReceiptItem {
  id: string;
  receiptId: string;
  productId: string;
  product?: Product;
  productCode?: string; // საქონლის კოდი
  productName?: string; // საქონლის დასახელება
  unitOfMeasure?: string; // ზომის ერთეული
  quantity: number; // რაოდენობა
  unitPrice: number; // ერთეულის ფასი
  totalPrice: number; // საქონლის ფასი
  tax?: number; // დაბეგვრა
  batchNumber: string; // სერიის ნომერი
  expiryDate: Date; // ვარგისიანობის ვადა
  manufacturer?: string; // მწარმოებელი (ქვეყანა)
  sku?: string; // SKU / internal product code
  genericName?: string; // Generic name
  strength?: string; // Strength (e.g., 500 mg)
  dosageForm?: string; // Dosage form (tablet, syrup, injection)
  packSize?: string; // Pack size (10 tablets, 100 ml)
  barcode?: string; // Barcode (GTIN, if available)
  regulatoryInfo?: string; // დამატებითი ინფო სამ რეგულაციები
  internalNotes?: string; // შიდა დამატებითი ინფორმაცია
}

// Warehouse Receipt (საწყობში აყვანა)
export interface WarehouseReceipt {
  id: string;
  supplierInvoiceNumber?: string; // მომწოდებლის ინვოისის ნომერი
  purchaseInvoiceId?: string; // დაკავშირებული purchase invoice
  warehouseId: string;
  warehouse?: Warehouse;
  receiptNumber: string; // შიდა receipt ნომერი
  status: "draft" | "pending" | "received" | "rejected";
  receivedBy?: string; // ვინ მიიღო
  receivedDate: Date; // მიღების თარიღი
  items: WarehouseReceiptItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Warehouse Dispatch Item (საწყობიდან გაცემა)
export interface WarehouseDispatchItem {
  id: string;
  dispatchId: string;
  productId: string;
  product?: Product;
  inventoryId: string; // რომელი batch-იდან გაიცა
  inventory?: Inventory;
  productCode?: string; // საქონლის კოდი
  productName?: string; // საქონლის დასახელება
  unitOfMeasure?: string; // ზომის ერთეული
  quantity: number; // რაოდენობა
  unitPrice: number; // ერთეულის ფასი
  totalPrice: number; // საქონლის ფასი
  tax?: number; // დაბეგვრა
  batchNumber: string; // სერიის ნომერი
  expiryDate: Date; // ვარგისიანობის ვადა
  manufacturer?: string; // მწარმოებელი (ქვეყანა)
  sku?: string; // SKU / internal product code
  genericName?: string; // Generic name
  strength?: string; // Strength (e.g., 500 mg)
  dosageForm?: string; // Dosage form (tablet, syrup, injection)
  packSize?: string; // Pack size (10 tablets, 100 ml)
  barcode?: string; // Barcode (GTIN, if available)
  internalNotes?: string; // შიდა დამატებითი ინფორმაცია
}

// Warehouse Dispatch (საწყობიდან გაცემა)
export interface WarehouseDispatch {
  id: string;
  appInvoiceNumber?: string; // აპის ინვოისის ნომერი
  salesInvoiceId?: string; // დაკავშირებული sales invoice
  orderId?: string; // დაკავშირებული შეკვეთა
  warehouseId: string;
  warehouse?: Warehouse;
  dispatchNumber: string; // შიდა dispatch ნომერი
  status: "draft" | "pending" | "dispatched" | "rejected";
  dispatchedBy?: string; // ვინ გაიცა
  dispatchedDate: Date; // გაცემის თარიღი
  items: WarehouseDispatchItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Category Entity
export interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string; // For subcategories
  parent?: Category;
  imageUrl?: string;
  active: boolean;
  sortOrder?: number;
  createdAt: Date;
  updatedAt: Date;
}

// Promotion/Discount Entity
export interface Promotion {
  id: string;
  name: string;
  description?: string;
  type: "percentage" | "fixed_amount" | "buy_x_get_y";
  value: number; // percentage or fixed amount
  minPurchaseAmount?: number;
  maxDiscountAmount?: number;
  applicableTo: "all" | "category" | "product";
  categoryIds?: string[];
  productIds?: string[];
  startDate: Date;
  endDate: Date;
  active: boolean;
  usageLimit?: number; // Total usage limit
  usageCount: number; // Current usage count
  userLimit?: number; // Per user limit
  code?: string; // Promo code
  createdAt: Date;
  updatedAt: Date;
}

// Supplier Entity
export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  city?: string;
  taxId?: string; // ს/კ
  certificateNumber?: string; // ფირნიშის ან ცნობის ნომერი
  active: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Delivery Zone Entity
export interface DeliveryZone {
  id: string;
  name: string;
  description?: string;
  city: string;
  areas: string[]; // რაიონები/უბნები
  deliveryFee: number;
  minOrderAmount?: number; // Minimum order for free delivery
  estimatedDeliveryTime: number; // in hours
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Notification Entity
export interface Notification {
  id: string;
  type: "order" | "inventory" | "promotion" | "system" | "payment";
  title: string;
  message: string;
  userId?: string; // If user-specific
  user?: User;
  read: boolean;
  actionUrl?: string; // Link to related page
  metadata?: Record<string, any>;
  createdAt: Date;
}

// System Settings
export interface SystemSettings {
  id: string;
  key: string;
  value: string;
  category: "general" | "payment" | "delivery" | "notification" | "inventory";
  description?: string;
  updatedAt: Date;
  updatedBy?: string;
}

// Payment Method
export interface PaymentMethod {
  id: string;
  name: string;
  type: "card" | "cash" | "bank_transfer" | "mobile_payment";
  active: boolean;
  config?: Record<string, any>; // Payment gateway config
  createdAt: Date;
  updatedAt: Date;
}

// Review/Feedback
export interface Review {
  id: string;
  orderId: string;
  order?: Order;
  userId: string;
  user?: User;
  productId?: string;
  product?: Product;
  rating: number; // 1-5
  comment?: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}
