// Mock Data - დროებით API-ს ნაცვლად
import { 
  Product, 
  ProductGroup,
  ProductVariant,
  ProductStrength,
  Inventory, 
  Order, 
  Category, 
  Promotion, 
  Supplier, 
  DeliveryZone, 
  Notification, 
  PurchaseInvoice, 
  SalesInvoice, 
  WarehouseReceipt, 
  WarehouseDispatch,
  Warehouse,
  WarehouseEmployee,
  User
} from '@/types';
import { UserRole, InventoryState, OrderStatus, PaymentStatus, WarehouseEmployeeRole } from '@/types';

// Mock Product Groups (Generic Names) - იერარქიის ზედა დონე
export const mockProductGroups: ProductGroup[] = [
  {
    id: "group-paracetamol",
    genericName: "Paracetamol",
    description: "Pain relief medication",
    category: "Pain Relief",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "group-ibuprofen",
    genericName: "Ibuprofen",
    description: "Anti-inflammatory medication",
    category: "Pain Relief",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Mock Product Variants (Generic + Country) - იერარქიის მეორე დონე
export const mockProductVariants: ProductVariant[] = [
  // Paracetamol - საქართველო
  {
    id: "variant-paracetamol-geo",
    productGroupId: "group-paracetamol",
    productGroup: mockProductGroups[0],
    countryOfOrigin: "საქართველო",
    manufacturer: "ფარმაცევტული კომპანია საქართველო",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - გერმანია
  {
    id: "variant-paracetamol-de",
    productGroupId: "group-paracetamol",
    productGroup: mockProductGroups[0],
    countryOfOrigin: "გერმანია",
    manufacturer: "Bayer Pharma",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - ინდოეთი
  {
    id: "variant-paracetamol-in",
    productGroupId: "group-paracetamol",
    productGroup: mockProductGroups[0],
    countryOfOrigin: "ინდოეთი",
    manufacturer: "Sun Pharma",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - თურქეთი
  {
    id: "variant-paracetamol-tr",
    productGroupId: "group-paracetamol",
    productGroup: mockProductGroups[0],
    countryOfOrigin: "თურქეთი",
    manufacturer: "Abdi İbrahim",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Mock Product Strengths (Generic + Country + Strength) - იერარქიის მესამე დონე
export const mockProductStrengths: ProductStrength[] = [
  // Paracetamol - საქართველო - 5mg
  {
    id: "strength-paracetamol-geo-5mg",
    productVariantId: "variant-paracetamol-geo",
    productVariant: mockProductVariants[0],
    strength: "5 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - საქართველო - 10mg
  {
    id: "strength-paracetamol-geo-10mg",
    productVariantId: "variant-paracetamol-geo",
    productVariant: mockProductVariants[0],
    strength: "10 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - საქართველო - 200mg
  {
    id: "strength-paracetamol-geo-200mg",
    productVariantId: "variant-paracetamol-geo",
    productVariant: mockProductVariants[0],
    strength: "200 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - საქართველო - 500mg
  {
    id: "strength-paracetamol-geo-500mg",
    productVariantId: "variant-paracetamol-geo",
    productVariant: mockProductVariants[0],
    strength: "500 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - გერმანია - 5mg
  {
    id: "strength-paracetamol-de-5mg",
    productVariantId: "variant-paracetamol-de",
    productVariant: mockProductVariants[1],
    strength: "5 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - გერმანია - 10mg
  {
    id: "strength-paracetamol-de-10mg",
    productVariantId: "variant-paracetamol-de",
    productVariant: mockProductVariants[1],
    strength: "10 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - გერმანია - 200mg
  {
    id: "strength-paracetamol-de-200mg",
    productVariantId: "variant-paracetamol-de",
    productVariant: mockProductVariants[1],
    strength: "200 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - გერმანია - 500mg
  {
    id: "strength-paracetamol-de-500mg",
    productVariantId: "variant-paracetamol-de",
    productVariant: mockProductVariants[1],
    strength: "500 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - ინდოეთი - 5mg
  {
    id: "strength-paracetamol-in-5mg",
    productVariantId: "variant-paracetamol-in",
    productVariant: mockProductVariants[2],
    strength: "5 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - ინდოეთი - 10mg
  {
    id: "strength-paracetamol-in-10mg",
    productVariantId: "variant-paracetamol-in",
    productVariant: mockProductVariants[2],
    strength: "10 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - ინდოეთი - 200mg
  {
    id: "strength-paracetamol-in-200mg",
    productVariantId: "variant-paracetamol-in",
    productVariant: mockProductVariants[2],
    strength: "200 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - ინდოეთი - 500mg
  {
    id: "strength-paracetamol-in-500mg",
    productVariantId: "variant-paracetamol-in",
    productVariant: mockProductVariants[2],
    strength: "500 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - თურქეთი - 5mg
  {
    id: "strength-paracetamol-tr-5mg",
    productVariantId: "variant-paracetamol-tr",
    productVariant: mockProductVariants[3],
    strength: "5 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - თურქეთი - 10mg
  {
    id: "strength-paracetamol-tr-10mg",
    productVariantId: "variant-paracetamol-tr",
    productVariant: mockProductVariants[3],
    strength: "10 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - თურქეთი - 200mg
  {
    id: "strength-paracetamol-tr-200mg",
    productVariantId: "variant-paracetamol-tr",
    productVariant: mockProductVariants[3],
    strength: "200 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - თურქეთი - 500mg
  {
    id: "strength-paracetamol-tr-500mg",
    productVariantId: "variant-paracetamol-tr",
    productVariant: mockProductVariants[3],
    strength: "500 mg",
    dosageForm: "tablet",
    active: true,
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Helper function to populate computed fields
function populateProductFields(product: Product): Product {
  const strength = mockProductStrengths.find(s => s.id === product.productStrengthId);
  if (!strength) return product;
  
  const variant = strength.productVariant || mockProductVariants.find(v => v.id === strength.productVariantId);
  if (!variant) return product;
  
  const group = variant.productGroup || mockProductGroups.find(g => g.id === variant.productGroupId);
  if (!group) return product;
  
  return {
    ...product,
    productStrength: strength,
    genericName: group.genericName,
    countryOfOrigin: variant.countryOfOrigin,
    manufacturer: variant.manufacturer,
    strength: strength.strength,
    dosageForm: strength.dosageForm,
  };
}

// Mock Products (კონკრეტული პროდუქტები) - იერარქიის ქვედა დონე
// თითოეული Product დაკავშირებულია ProductStrength-თან
const rawMockProducts: Omit<Product, 'genericName' | 'countryOfOrigin' | 'manufacturer' | 'strength' | 'dosageForm'>[] = [
  // Paracetamol - საქართველო - 5mg - Pack 1
  {
    id: "product-paracetamol-geo-5mg-pack1",
    productStrengthId: "strength-paracetamol-geo-5mg",
    name: "Paracetamol 5mg - Pack 20 tablets",
    description: "Pain relief medication - 5mg tablets, 20 tablets per pack",
    price: 2.50,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-5MG-GEO-PACK1",
    packSize: "20 tablets",
    barcode: "1234567890101",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - საქართველო - 5mg - Pack 2
  {
    id: "product-paracetamol-geo-5mg-pack2",
    productStrengthId: "strength-paracetamol-geo-5mg",
    name: "Paracetamol 5mg - Pack 50 tablets",
    description: "Pain relief medication - 5mg tablets, 50 tablets per pack",
    price: 5.50,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-5MG-GEO-PACK2",
    packSize: "50 tablets",
    barcode: "1234567890102",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - საქართველო - 10mg - Pack 1
  {
    id: "product-paracetamol-geo-10mg-pack1",
    productStrengthId: "strength-paracetamol-geo-10mg",
    name: "Paracetamol 10mg - Pack 20 tablets",
    description: "Pain relief medication - 10mg tablets, 20 tablets per pack",
    price: 3.50,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-10MG-GEO-PACK1",
    packSize: "20 tablets",
    barcode: "1234567890111",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - საქართველო - 200mg - Pack 1
  {
    id: "product-paracetamol-geo-200mg-pack1",
    productStrengthId: "strength-paracetamol-geo-200mg",
    name: "Paracetamol 200mg - Pack 20 tablets",
    description: "Pain relief medication - 200mg tablets, 20 tablets per pack",
    price: 4.50,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-200MG-GEO-PACK1",
    packSize: "20 tablets",
    barcode: "1234567890131",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - საქართველო - 500mg - Pack 1
  {
    id: "product-paracetamol-geo-500mg-pack1",
    productStrengthId: "strength-paracetamol-geo-500mg",
    name: "Paracetamol 500mg - Pack 10 tablets",
    description: "Pain relief medication - 500mg tablets, 10 tablets per pack",
    price: 5.99,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-500MG-GEO-PACK1",
    packSize: "10 tablets",
    barcode: "1234567890141",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - გერმანია - 5mg - Pack 1
  {
    id: "product-paracetamol-de-5mg-pack1",
    productStrengthId: "strength-paracetamol-de-5mg",
    name: "Paracetamol 5mg - Bayer - Pack 20 tablets",
    description: "Pain relief medication - 5mg tablets, 20 tablets per pack",
    price: 3.20,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-5MG-DE-PACK1",
    packSize: "20 tablets",
    barcode: "1234567890201",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - გერმანია - 10mg - Pack 1
  {
    id: "product-paracetamol-de-10mg-pack1",
    productStrengthId: "strength-paracetamol-de-10mg",
    name: "Paracetamol 10mg - Bayer - Pack 20 tablets",
    description: "Pain relief medication - 10mg tablets, 20 tablets per pack",
    price: 4.20,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-10MG-DE-PACK1",
    packSize: "20 tablets",
    barcode: "1234567890211",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - გერმანია - 200mg - Pack 1
  {
    id: "product-paracetamol-de-200mg-pack1",
    productStrengthId: "strength-paracetamol-de-200mg",
    name: "Paracetamol 200mg - Bayer - Pack 20 tablets",
    description: "Pain relief medication - 200mg tablets, 20 tablets per pack",
    price: 5.50,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-200MG-DE-PACK1",
    packSize: "20 tablets",
    barcode: "1234567890231",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - გერმანია - 500mg - Pack 1
  {
    id: "product-paracetamol-de-500mg-pack1",
    productStrengthId: "strength-paracetamol-de-500mg",
    name: "Paracetamol 500mg - Bayer - Pack 10 tablets",
    description: "Pain relief medication - 500mg tablets, 10 tablets per pack",
    price: 7.20,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-500MG-DE-PACK1",
    packSize: "10 tablets",
    barcode: "1234567890241",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - ინდოეთი - 5mg - Pack 1
  {
    id: "product-paracetamol-in-5mg-pack1",
    productStrengthId: "strength-paracetamol-in-5mg",
    name: "Paracetamol 5mg - Sun Pharma - Pack 20 tablets",
    description: "Pain relief medication - 5mg tablets, 20 tablets per pack",
    price: 1.80,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-5MG-IN-PACK1",
    packSize: "20 tablets",
    barcode: "1234567890301",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - ინდოეთი - 10mg - Pack 1
  {
    id: "product-paracetamol-in-10mg-pack1",
    productStrengthId: "strength-paracetamol-in-10mg",
    name: "Paracetamol 10mg - Sun Pharma - Pack 20 tablets",
    description: "Pain relief medication - 10mg tablets, 20 tablets per pack",
    price: 2.50,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-10MG-IN-PACK1",
    packSize: "20 tablets",
    barcode: "1234567890311",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - ინდოეთი - 200mg - Pack 1
  {
    id: "product-paracetamol-in-200mg-pack1",
    productStrengthId: "strength-paracetamol-in-200mg",
    name: "Paracetamol 200mg - Sun Pharma - Pack 20 tablets",
    description: "Pain relief medication - 200mg tablets, 20 tablets per pack",
    price: 3.50,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-200MG-IN-PACK1",
    packSize: "20 tablets",
    barcode: "1234567890331",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - ინდოეთი - 500mg - Pack 1
  {
    id: "product-paracetamol-in-500mg-pack1",
    productStrengthId: "strength-paracetamol-in-500mg",
    name: "Paracetamol 500mg - Sun Pharma - Pack 10 tablets",
    description: "Pain relief medication - 500mg tablets, 10 tablets per pack",
    price: 4.50,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-500MG-IN-PACK1",
    packSize: "10 tablets",
    barcode: "1234567890341",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - თურქეთი - 5mg - Pack 1
  {
    id: "product-paracetamol-tr-5mg-pack1",
    productStrengthId: "strength-paracetamol-tr-5mg",
    name: "Paracetamol 5mg - Abdi İbrahim - Pack 20 tablets",
    description: "Pain relief medication - 5mg tablets, 20 tablets per pack",
    price: 2.10,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-5MG-TR-PACK1",
    packSize: "20 tablets",
    barcode: "1234567890401",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - თურქეთი - 10mg - Pack 1
  {
    id: "product-paracetamol-tr-10mg-pack1",
    productStrengthId: "strength-paracetamol-tr-10mg",
    name: "Paracetamol 10mg - Abdi İbrahim - Pack 20 tablets",
    description: "Pain relief medication - 10mg tablets, 20 tablets per pack",
    price: 3.00,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-10MG-TR-PACK1",
    packSize: "20 tablets",
    barcode: "1234567890411",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - თურქეთი - 200mg - Pack 1
  {
    id: "product-paracetamol-tr-200mg-pack1",
    productStrengthId: "strength-paracetamol-tr-200mg",
    name: "Paracetamol 200mg - Abdi İbrahim - Pack 20 tablets",
    description: "Pain relief medication - 200mg tablets, 20 tablets per pack",
    price: 4.00,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-200MG-TR-PACK1",
    packSize: "20 tablets",
    barcode: "1234567890431",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Paracetamol - თურქეთი - 500mg - Pack 1
  {
    id: "product-paracetamol-tr-500mg-pack1",
    productStrengthId: "strength-paracetamol-tr-500mg",
    name: "Paracetamol 500mg - Abdi İbrahim - Pack 10 tablets",
    description: "Pain relief medication - 500mg tablets, 10 tablets per pack",
    price: 5.50,
    active: true,
    category: "Pain Relief",
    sku: "PRD-PAR-500MG-TR-PACK1",
    packSize: "10 tablets",
    barcode: "1234567890441",
    unitOfMeasure: "ცალი",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Populate products with computed fields from hierarchy
export const mockProducts: Product[] = rawMockProducts.map(populateProductFields);

// Mock Inventory - ახალი იერარქიული სტრუქტურით
export const mockInventory: Inventory[] = [
  {
    id: "1",
    productId: mockProducts[0]?.id || "product-paracetamol-geo-5mg-pack1",
    product: mockProducts[0],
    batchNumber: "BATCH-2024-001",
    expiryDate: new Date("2025-12-31"),
    quantity: 1000,
    availableQuantity: 850,
    reservedQuantity: 150,
    state: InventoryState.AVAILABLE,
    warehouseLocation: "WAREHOUSE-1",
    warehouseName: "თბილისი - ცენტრალური საწყობი",
    receivedDate: new Date("2024-01-15"),
    supplier: "Supplier ABC",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    productId: "1",
    product: mockProducts[0],
    batchNumber: "BATCH-2024-002",
    expiryDate: new Date("2025-06-30"),
    quantity: 500,
    availableQuantity: 500,
    reservedQuantity: 0,
    state: InventoryState.AVAILABLE,
    warehouseLocation: "WAREHOUSE-1",
    warehouseName: "თბილისი - ცენტრალური საწყობი",
    receivedDate: new Date("2024-02-01"),
    supplier: "Supplier ABC",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: "3",
    productId: "2",
    product: mockProducts[1],
    batchNumber: "BATCH-2024-003",
    expiryDate: new Date("2025-12-31"),
    quantity: 800,
    availableQuantity: 750,
    reservedQuantity: 50,
    state: InventoryState.AVAILABLE,
    warehouseLocation: "WAREHOUSE-1",
    warehouseName: "თბილისი - ცენტრალური საწყობი",
    receivedDate: new Date("2024-01-20"),
    supplier: "Supplier ABC",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "4",
    productId: "1",
    product: mockProducts[0],
    batchNumber: "BATCH-2024-004",
    expiryDate: new Date("2026-03-31"),
    quantity: 600,
    availableQuantity: 600,
    reservedQuantity: 0,
    state: InventoryState.AVAILABLE,
    warehouseLocation: "WAREHOUSE-2",
    warehouseName: "თბილისი - დიღომი საწყობი",
    receivedDate: new Date("2024-02-15"),
    supplier: "Supplier ABC",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: "5",
    productId: "2",
    product: mockProducts[1],
    batchNumber: "BATCH-2024-005",
    expiryDate: new Date("2025-09-30"),
    quantity: 400,
    availableQuantity: 400,
    reservedQuantity: 0,
    state: InventoryState.AVAILABLE,
    warehouseLocation: "WAREHOUSE-2",
    warehouseName: "თბილისი - დიღომი საწყობი",
    receivedDate: new Date("2024-03-01"),
    supplier: "Supplier ABC",
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: "ORD-001",
    userId: "user-1",
    user: {
      id: "user-1",
      role: UserRole.CONSUMER,
      phoneNumber: "+995555123456",
      fullName: "გიორგი ბერიძე",
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    status: OrderStatus.CONFIRMED,
    totalAmount: 25.50,
    deliveryFee: 5.00,
    paymentStatus: PaymentStatus.COMPLETED,
    deliveryAddress: "რუსთაველის გამზირი 1, თბილისი",
    deliveryCity: "თბილისი",
    deliveryPhone: "+995555123456",
    warehouseLocation: "WAREHOUSE-1",
    createdAt: new Date("2024-01-20T10:00:00"),
    updatedAt: new Date("2024-01-20T10:05:00"),
    confirmedAt: new Date("2024-01-20T10:05:00"),
    items: [
      {
        id: "1",
        orderId: "ORD-001",
        productId: "1",
        product: mockProducts[0],
        quantity: 2,
        priceAtOrderTime: 5.99,
        batchNumber: "BATCH-2024-001",
      },
    ],
  },
];

// Mock Categories
export const mockCategories: Category[] = [
  {
    id: "1",
    name: "Pain Relief",
    description: "Pain relief medications",
    active: true,
    sortOrder: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "Antibiotics",
    description: "Antibiotic medications",
    active: true,
    sortOrder: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock Promotions
export const mockPromotions: Promotion[] = [
  {
    id: "1",
    name: "ზამთრის ფასდაკლება",
    description: "20% ფასდაკლება ყველა პროდუქტზე",
    type: "percentage",
    value: 20,
    applicableTo: "all",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-03-31"),
    active: true,
    usageLimit: 1000,
    usageCount: 450,
    code: "WINTER20",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock Suppliers
export const mockSuppliers: Supplier[] = [
  {
    id: "1",
    name: "Supplier ABC",
    contactPerson: "გიორგი ბერიძე",
    phoneNumber: "+995555123456",
    email: "info@supplierabc.ge",
    address: "რუსთაველის გამზირი 1",
    city: "თბილისი",
    taxId: "123456789",
    certificateNumber: "CERT-001",
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock Delivery Zones
export const mockDeliveryZones: DeliveryZone[] = [
  {
    id: "1",
    name: "თბილისი - ცენტრი",
    description: "ცენტრალური რაიონები",
    city: "თბილისი",
    areas: ["ვაკე", "საბურთალო", "ისანი", "ნაძალადევი"],
    deliveryFee: 5.00,
    minOrderAmount: 50,
    estimatedDeliveryTime: 2,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock Users (თანამშრომლები)
export const mockUsers: User[] = [
  {
    id: "user-warehouse-1",
    role: UserRole.OPERATIONS,
    phoneNumber: "+995555111111",
    email: "manager1@aphoteka.ge",
    fullName: "ნინო მელაძე",
    warehouseId: "WAREHOUSE-1",
    status: "active",
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "user-warehouse-2",
    role: UserRole.OPERATIONS,
    phoneNumber: "+995555222222",
    email: "keeper1@aphoteka.ge",
    fullName: "გიორგი ბერიძე",
    warehouseId: "WAREHOUSE-1",
    status: "active",
    createdAt: new Date("2023-02-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "user-warehouse-3",
    role: UserRole.OPERATIONS,
    phoneNumber: "+995555333333",
    email: "picker1@aphoteka.ge",
    fullName: "მარიამ ხარაძე",
    warehouseId: "WAREHOUSE-1",
    status: "active",
    createdAt: new Date("2023-03-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "user-warehouse-4",
    role: UserRole.OPERATIONS,
    phoneNumber: "+995555444444",
    email: "manager2@aphoteka.ge",
    fullName: "დავით გიგაური",
    warehouseId: "WAREHOUSE-2",
    status: "active",
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "user-warehouse-5",
    role: UserRole.OPERATIONS,
    phoneNumber: "+995555555555",
    email: "keeper2@aphoteka.ge",
    fullName: "ანა ნადარაია",
    warehouseId: "WAREHOUSE-2",
    status: "active",
    createdAt: new Date("2023-02-15"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Mock Warehouses
export const mockWarehouses: Warehouse[] = [
  {
    id: "WAREHOUSE-1",
    name: "თბილისი - ცენტრალური საწყობი",
    address: "რუსთაველის გამზირი 10",
    city: "თბილისი",
    phoneNumber: "+995322123456",
    email: "warehouse1@aphoteka.ge",
    managerId: "user-warehouse-1",
    manager: mockUsers[0],
    active: true,
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "WAREHOUSE-2",
    name: "თბილისი - დიღომი საწყობი",
    address: "დიღომის გამზირი 25",
    city: "თბილისი",
    phoneNumber: "+995322234567",
    email: "warehouse2@aphoteka.ge",
    managerId: "user-warehouse-4",
    manager: mockUsers[3],
    active: true,
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "WAREHOUSE-3",
    name: "ბათუმი - ცენტრალური საწყობი",
    address: "რუსთაველის ქუჩა 5",
    city: "ბათუმი",
    phoneNumber: "+995422123456",
    email: "warehouse3@aphoteka.ge",
    active: true,
    createdAt: new Date("2023-06-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Mock Warehouse Employees
export const mockWarehouseEmployees: WarehouseEmployee[] = [
  {
    id: "emp-1",
    warehouseId: "WAREHOUSE-1",
    warehouse: mockWarehouses[0],
    userId: "user-warehouse-1",
    user: mockUsers[0],
    role: WarehouseEmployeeRole.MANAGER,
    active: true,
    startedAt: new Date("2023-01-01"),
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "emp-2",
    warehouseId: "WAREHOUSE-1",
    warehouse: mockWarehouses[0],
    userId: "user-warehouse-2",
    user: mockUsers[1],
    role: WarehouseEmployeeRole.WAREHOUSE_KEEPER,
    active: true,
    startedAt: new Date("2023-02-01"),
    createdAt: new Date("2023-02-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "emp-3",
    warehouseId: "WAREHOUSE-1",
    warehouse: mockWarehouses[0],
    userId: "user-warehouse-3",
    user: mockUsers[2],
    role: WarehouseEmployeeRole.PICKER,
    active: true,
    startedAt: new Date("2023-03-01"),
    createdAt: new Date("2023-03-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "emp-4",
    warehouseId: "WAREHOUSE-2",
    warehouse: mockWarehouses[1],
    userId: "user-warehouse-4",
    user: mockUsers[3],
    role: WarehouseEmployeeRole.MANAGER,
    active: true,
    startedAt: new Date("2023-01-15"),
    createdAt: new Date("2023-01-15"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "emp-5",
    warehouseId: "WAREHOUSE-2",
    warehouse: mockWarehouses[1],
    userId: "user-warehouse-5",
    user: mockUsers[4],
    role: WarehouseEmployeeRole.WAREHOUSE_KEEPER,
    active: true,
    startedAt: new Date("2023-02-15"),
    createdAt: new Date("2023-02-15"),
    updatedAt: new Date("2024-01-01"),
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: "1",
    type: "order",
    title: "ახალი შეკვეთა",
    message: "შექმნილია ახალი შეკვეთა #ORD-001",
    read: false,
    actionUrl: "/orders/ORD-001",
    createdAt: new Date("2024-01-20T10:00:00"),
  },
];

// Simulate API delay
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Purchase Invoices
export const mockPurchaseInvoices: PurchaseInvoice[] = [
  {
    id: "PI-001",
    supplierInvoiceNumber: "SUP-2024-001",
    invoiceNumber: "INV-2024-001",
    supplierId: "1",
    status: "approved",
    waybillNumber: "WB-001",
    waybillType: "ტრანსპორტირება",
    transportStartDate: new Date("2024-01-15"),
    transportEndDate: new Date("2024-01-16"),
    driver: "გიორგი მელაძე",
    vehicleNumber: "TB-123-AB",
    activationDate: new Date("2024-01-16"),
    items: [
      {
        id: "1",
        invoiceId: "PI-001",
        productId: "1",
        product: mockProducts[0],
        productCode: "PRD-001",
        productName: "Paracetamol 500mg",
        unitOfMeasure: "ცალი",
        quantity: 1000,
        unitPrice: 4.50,
        totalPrice: 4500.00,
        tax: 0,
        batchNumber: "BATCH-2024-001",
        expiryDate: new Date("2025-12-31"),
        manufacturer: "საქართველო",
      },
    ],
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-16"),
  },
];

// Mock Sales Invoices
export const mockSalesInvoices: SalesInvoice[] = [
  {
    id: "SI-001",
    appInvoiceNumber: "APP-001",
    invoiceNumber: "SALES-2024-001",
    orderId: "ORD-001",
    customerId: "user-1",
    status: "paid",
    waybillNumber: "WB-SALES-001",
    waybillType: "გაყიდვა",
    items: [
      {
        id: "1",
        invoiceId: "SI-001",
        productId: "1",
        product: mockProducts[0],
        productCode: "PRD-001",
        productName: "Paracetamol 500mg",
        unitOfMeasure: "ცალი",
        quantity: 2,
        unitPrice: 5.99,
        totalPrice: 11.98,
        tax: 0,
        batchNumber: "BATCH-2024-001",
        expiryDate: new Date("2025-12-31"),
      },
    ],
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
];

// Mock Warehouse Receipts
export const mockWarehouseReceipts: WarehouseReceipt[] = [
  {
    id: "WR-001",
    supplierInvoiceNumber: "SUP-2024-001",
    purchaseInvoiceId: "PI-001",
    warehouseId: "WAREHOUSE-1",
    receiptNumber: "REC-2024-001",
    status: "received",
    receivedBy: "admin-1",
    receivedDate: new Date("2024-01-16"),
    items: [
      {
        id: "1",
        receiptId: "WR-001",
        productId: "1",
        product: mockProducts[0],
        productCode: "PRD-001",
        productName: "Paracetamol 500mg",
        unitOfMeasure: "ცალი",
        quantity: 1000,
        unitPrice: 4.50,
        totalPrice: 4500.00,
        batchNumber: "BATCH-2024-001",
        expiryDate: new Date("2025-12-31"),
        manufacturer: "საქართველო",
      },
    ],
    createdAt: new Date("2024-01-16"),
    updatedAt: new Date("2024-01-16"),
  },
];

// Mock Warehouse Dispatches
export const mockWarehouseDispatches: WarehouseDispatch[] = [
  {
    id: "WD-001",
    appInvoiceNumber: "APP-001",
    salesInvoiceId: "SI-001",
    orderId: "ORD-001",
    warehouseId: "WAREHOUSE-1",
    dispatchNumber: "DISP-2024-001",
    status: "dispatched",
    dispatchedBy: "admin-1",
    dispatchedDate: new Date("2024-01-20"),
    items: [
      {
        id: "1",
        dispatchId: "WD-001",
        productId: "1",
        product: mockProducts[0],
        inventoryId: "1",
        inventory: mockInventory[0],
        productCode: "PRD-001",
        productName: "Paracetamol 500mg",
        unitOfMeasure: "ცალი",
        quantity: 2,
        unitPrice: 5.99,
        totalPrice: 11.98,
        batchNumber: "BATCH-2024-001",
        expiryDate: new Date("2025-12-31"),
      },
    ],
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
];

// Mock API responses
export const mockApiResponses = {
  products: {
    getAll: async (params?: any) => {
      await delay(500);
      let filtered = [...mockProducts];
      
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search) ||
          p.sku?.toLowerCase().includes(search)
        );
      }
      if (params?.category) {
        filtered = filtered.filter(p => p.category === params.category);
      }
      if (params?.active !== undefined) {
        filtered = filtered.filter(p => p.active === params.active);
      }
      
      return {
        data: filtered,
        total: filtered.length,
        page: params?.page || 1,
        limit: params?.limit || 100,
      };
    },
    getById: async (id: string) => {
      await delay(300);
      const product = mockProducts.find(p => p.id === id);
      if (!product) throw new Error('Product not found');
      return { data: product };
    },
    create: async (product: Partial<Product>) => {
      await delay(500);
      const newProduct: Product = {
        ...product as Product,
        id: String(mockProducts.length + 1),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockProducts.push(newProduct);
      return { data: newProduct };
    },
    update: async (id: string, updates: Partial<Product>) => {
      await delay(500);
      const index = mockProducts.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Product not found');
      mockProducts[index] = { ...mockProducts[index], ...updates, updatedAt: new Date() };
      return { data: mockProducts[index] };
    },
    toggleStatus: async (id: string) => {
      await delay(300);
      const index = mockProducts.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Product not found');
      mockProducts[index].active = !mockProducts[index].active;
      mockProducts[index].updatedAt = new Date();
      return { data: mockProducts[index] };
    },
  },
  
  inventory: {
    getAll: async (params?: any) => {
      await delay(500);
      let filtered = [...mockInventory];
      
      if (params?.warehouseId) {
        filtered = filtered.filter(i => i.warehouseLocation === params.warehouseId);
      }
      if (params?.productId) {
        filtered = filtered.filter(i => i.productId === params.productId);
      }
      if (params?.state) {
        filtered = filtered.filter(i => i.state === params.state);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(i => 
          i.product?.name.toLowerCase().includes(search) ||
          i.batchNumber.toLowerCase().includes(search)
        );
      }
      
      return {
        data: filtered,
        total: filtered.length,
      };
    },
    getById: async (id: string) => {
      await delay(300);
      const item = mockInventory.find(i => i.id === id);
      if (!item) throw new Error('Inventory item not found');
      return { data: item };
    },
    receive: async (receipt: any) => {
      await delay(1000);
      const newReceipt: WarehouseReceipt = {
        ...receipt,
        id: `WR-${String(mockWarehouseReceipts.length + 1).padStart(3, '0')}`,
        receiptNumber: `REC-2024-${String(mockWarehouseReceipts.length + 1).padStart(3, '0')}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockWarehouseReceipts.push(newReceipt);
      return { data: newReceipt };
    },
    dispatch: async (dispatch: any) => {
      await delay(1000);
      const newDispatch: WarehouseDispatch = {
        ...dispatch,
        id: `WD-${String(mockWarehouseDispatches.length + 1).padStart(3, '0')}`,
        dispatchNumber: `DISP-2024-${String(mockWarehouseDispatches.length + 1).padStart(3, '0')}`,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockWarehouseDispatches.push(newDispatch);
      return { data: newDispatch };
    },
    adjust: async (adjustment: any) => {
      await delay(500);
      return { data: { ...adjustment, id: `ADJ-${Date.now()}`, createdAt: new Date() } };
    },
    getAdjustments: async (inventoryId?: string) => {
      await delay(300);
      return { data: [] };
    },
  },
  
  orders: {
    getAll: async (params?: any) => {
      await delay(500);
      let filtered = [...mockOrders];
      
      if (params?.status) {
        filtered = filtered.filter(o => o.status === params.status);
      }
      if (params?.paymentStatus) {
        filtered = filtered.filter(o => o.paymentStatus === params.paymentStatus);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(o => 
          o.id.toLowerCase().includes(search) ||
          o.user?.fullName?.toLowerCase().includes(search)
        );
      }
      
      return {
        data: filtered,
        total: filtered.length,
        page: params?.page || 1,
        limit: params?.limit || 100,
      };
    },
    getById: async (id: string) => {
      await delay(300);
      const order = mockOrders.find(o => o.id === id);
      if (!order) throw new Error('Order not found');
      return { data: order };
    },
    updateStatus: async (id: string, status: string) => {
      await delay(500);
      const index = mockOrders.findIndex(o => o.id === id);
      if (index === -1) throw new Error('Order not found');
      mockOrders[index].status = status as OrderStatus;
      mockOrders[index].updatedAt = new Date();
      return { data: mockOrders[index] };
    },
    cancel: async (id: string, reason?: string) => {
      await delay(500);
      const index = mockOrders.findIndex(o => o.id === id);
      if (index === -1) throw new Error('Order not found');
      mockOrders[index].status = OrderStatus.CANCELLED;
      mockOrders[index].cancelledAt = new Date();
      mockOrders[index].updatedAt = new Date();
      return { data: mockOrders[index] };
    },
  },

  categories: {
    getAll: async (params?: any) => {
      await delay(500);
      let filtered = [...mockCategories];
      
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(c => 
          c.name.toLowerCase().includes(search) ||
          c.description?.toLowerCase().includes(search)
        );
      }
      if (params?.active !== undefined) {
        filtered = filtered.filter(c => c.active === params.active);
      }
      
      return {
        data: filtered,
        total: filtered.length,
      };
    },
    getById: async (id: string) => {
      await delay(300);
      const category = mockCategories.find(c => c.id === id);
      if (!category) throw new Error('Category not found');
      return { data: category };
    },
    create: async (category: Partial<Category>) => {
      await delay(500);
      const newCategory: Category = {
        ...category as Category,
        id: String(mockCategories.length + 1),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockCategories.push(newCategory);
      return { data: newCategory };
    },
    update: async (id: string, updates: Partial<Category>) => {
      await delay(500);
      const index = mockCategories.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Category not found');
      mockCategories[index] = { ...mockCategories[index], ...updates, updatedAt: new Date() };
      return { data: mockCategories[index] };
    },
    toggleStatus: async (id: string) => {
      await delay(300);
      const index = mockCategories.findIndex(c => c.id === id);
      if (index === -1) throw new Error('Category not found');
      mockCategories[index].active = !mockCategories[index].active;
      mockCategories[index].updatedAt = new Date();
      return { data: mockCategories[index] };
    },
  },

  promotions: {
    getAll: async (params?: any) => {
      await delay(500);
      let filtered = [...mockPromotions];
      
      if (params?.active !== undefined) {
        filtered = filtered.filter(p => p.active === params.active);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(search) ||
          p.code?.toLowerCase().includes(search)
        );
      }
      
      return {
        data: filtered,
        total: filtered.length,
      };
    },
    getById: async (id: string) => {
      await delay(300);
      const promotion = mockPromotions.find(p => p.id === id);
      if (!promotion) throw new Error('Promotion not found');
      return { data: promotion };
    },
    create: async (promotion: Partial<Promotion>) => {
      await delay(500);
      const newPromotion: Promotion = {
        ...promotion as Promotion,
        id: String(mockPromotions.length + 1),
        usageCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPromotions.push(newPromotion);
      return { data: newPromotion };
    },
    update: async (id: string, updates: Partial<Promotion>) => {
      await delay(500);
      const index = mockPromotions.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Promotion not found');
      mockPromotions[index] = { ...mockPromotions[index], ...updates, updatedAt: new Date() };
      return { data: mockPromotions[index] };
    },
    toggleStatus: async (id: string) => {
      await delay(300);
      const index = mockPromotions.findIndex(p => p.id === id);
      if (index === -1) throw new Error('Promotion not found');
      mockPromotions[index].active = !mockPromotions[index].active;
      mockPromotions[index].updatedAt = new Date();
      return { data: mockPromotions[index] };
    },
  },

  suppliers: {
    getAll: async (params?: any) => {
      await delay(500);
      let filtered = [...mockSuppliers];
      
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(s => 
          s.name.toLowerCase().includes(search) ||
          s.contactPerson?.toLowerCase().includes(search) ||
          s.phoneNumber.includes(search)
        );
      }
      if (params?.active !== undefined) {
        filtered = filtered.filter(s => s.active === params.active);
      }
      
      return {
        data: filtered,
        total: filtered.length,
      };
    },
    getById: async (id: string) => {
      await delay(300);
      const supplier = mockSuppliers.find(s => s.id === id);
      if (!supplier) throw new Error('Supplier not found');
      return { data: supplier };
    },
    create: async (supplier: Partial<Supplier>) => {
      await delay(500);
      const newSupplier: Supplier = {
        ...supplier as Supplier,
        id: String(mockSuppliers.length + 1),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockSuppliers.push(newSupplier);
      return { data: newSupplier };
    },
    update: async (id: string, updates: Partial<Supplier>) => {
      await delay(500);
      const index = mockSuppliers.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Supplier not found');
      mockSuppliers[index] = { ...mockSuppliers[index], ...updates, updatedAt: new Date() };
      return { data: mockSuppliers[index] };
    },
    toggleStatus: async (id: string) => {
      await delay(300);
      const index = mockSuppliers.findIndex(s => s.id === id);
      if (index === -1) throw new Error('Supplier not found');
      mockSuppliers[index].active = !mockSuppliers[index].active;
      mockSuppliers[index].updatedAt = new Date();
      return { data: mockSuppliers[index] };
    },
  },

  deliveryZones: {
    getAll: async (params?: any) => {
      await delay(500);
      let filtered = [...mockDeliveryZones];
      
      if (params?.city) {
        filtered = filtered.filter(z => z.city === params.city);
      }
      if (params?.active !== undefined) {
        filtered = filtered.filter(z => z.active === params.active);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(z => 
          z.name.toLowerCase().includes(search) ||
          z.description?.toLowerCase().includes(search)
        );
      }
      
      return {
        data: filtered,
        total: filtered.length,
      };
    },
    getById: async (id: string) => {
      await delay(300);
      const zone = mockDeliveryZones.find(z => z.id === id);
      if (!zone) throw new Error('Delivery zone not found');
      return { data: zone };
    },
    create: async (zone: Partial<DeliveryZone>) => {
      await delay(500);
      const newZone: DeliveryZone = {
        ...zone as DeliveryZone,
        id: String(mockDeliveryZones.length + 1),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockDeliveryZones.push(newZone);
      return { data: newZone };
    },
    update: async (id: string, updates: Partial<DeliveryZone>) => {
      await delay(500);
      const index = mockDeliveryZones.findIndex(z => z.id === id);
      if (index === -1) throw new Error('Delivery zone not found');
      mockDeliveryZones[index] = { ...mockDeliveryZones[index], ...updates, updatedAt: new Date() };
      return { data: mockDeliveryZones[index] };
    },
    toggleStatus: async (id: string) => {
      await delay(300);
      const index = mockDeliveryZones.findIndex(z => z.id === id);
      if (index === -1) throw new Error('Delivery zone not found');
      mockDeliveryZones[index].active = !mockDeliveryZones[index].active;
      mockDeliveryZones[index].updatedAt = new Date();
      return { data: mockDeliveryZones[index] };
    },
  },

  notifications: {
    getAll: async (params?: any) => {
      await delay(500);
      let filtered = [...mockNotifications];
      
      if (params?.read !== undefined) {
        filtered = filtered.filter(n => n.read === params.read);
      }
      if (params?.type) {
        filtered = filtered.filter(n => n.type === params.type);
      }
      
      return {
        data: filtered,
        total: filtered.length,
      };
    },
    markAsRead: async (id: string) => {
      await delay(300);
      const notification = mockNotifications.find(n => n.id === id);
      if (notification) {
        notification.read = true;
      }
      return { data: notification };
    },
    markAllAsRead: async () => {
      await delay(300);
      mockNotifications.forEach(n => n.read = true);
      return { success: true };
    },
  },

  invoices: {
    purchase: {
      getAll: async (params?: any) => {
        await delay(500);
        let filtered = [...mockPurchaseInvoices];
        
        if (params?.supplierId) {
          filtered = filtered.filter(i => i.supplierId === params.supplierId);
        }
        if (params?.status) {
          filtered = filtered.filter(i => i.status === params.status);
        }
        
        return {
          data: filtered,
          total: filtered.length,
        };
      },
      getById: async (id: string) => {
        await delay(300);
        const invoice = mockPurchaseInvoices.find(i => i.id === id);
        if (!invoice) throw new Error('Purchase invoice not found');
        return { data: invoice };
      },
      create: async (invoice: Partial<PurchaseInvoice>) => {
        await delay(500);
        const newInvoice: PurchaseInvoice = {
          ...invoice as PurchaseInvoice,
          id: `PI-${String(mockPurchaseInvoices.length + 1).padStart(3, '0')}`,
          invoiceNumber: `INV-2024-${String(mockPurchaseInvoices.length + 1).padStart(3, '0')}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockPurchaseInvoices.push(newInvoice);
        return { data: newInvoice };
      },
      update: async (id: string, updates: Partial<PurchaseInvoice>) => {
        await delay(500);
        const index = mockPurchaseInvoices.findIndex(i => i.id === id);
        if (index === -1) throw new Error('Purchase invoice not found');
        mockPurchaseInvoices[index] = { ...mockPurchaseInvoices[index], ...updates, updatedAt: new Date() };
        return { data: mockPurchaseInvoices[index] };
      },
    },
    sales: {
      getAll: async (params?: any) => {
        await delay(500);
        let filtered = [...mockSalesInvoices];
        
        if (params?.orderId) {
          filtered = filtered.filter(i => i.orderId === params.orderId);
        }
        if (params?.customerId) {
          filtered = filtered.filter(i => i.customerId === params.customerId);
        }
        if (params?.status) {
          filtered = filtered.filter(i => i.status === params.status);
        }
        
        return {
          data: filtered,
          total: filtered.length,
        };
      },
      getById: async (id: string) => {
        await delay(300);
        const invoice = mockSalesInvoices.find(i => i.id === id);
        if (!invoice) throw new Error('Sales invoice not found');
        return { data: invoice };
      },
      create: async (invoice: Partial<SalesInvoice>) => {
        await delay(500);
        const newInvoice: SalesInvoice = {
          ...invoice as SalesInvoice,
          id: `SI-${String(mockSalesInvoices.length + 1).padStart(3, '0')}`,
          invoiceNumber: `SALES-2024-${String(mockSalesInvoices.length + 1).padStart(3, '0')}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockSalesInvoices.push(newInvoice);
        return { data: newInvoice };
      },
      update: async (id: string, updates: Partial<SalesInvoice>) => {
        await delay(500);
        const index = mockSalesInvoices.findIndex(i => i.id === id);
        if (index === -1) throw new Error('Sales invoice not found');
        mockSalesInvoices[index] = { ...mockSalesInvoices[index], ...updates, updatedAt: new Date() };
        return { data: mockSalesInvoices[index] };
      },
    },
  },

  warehouses: {
    getAll: async (params?: any) => {
      await delay(500);
      let filtered = [...mockWarehouses];
      
      if (params?.city) {
        filtered = filtered.filter(w => w.city === params.city);
      }
      if (params?.active !== undefined) {
        filtered = filtered.filter(w => w.active === params.active);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(w => 
          w.name.toLowerCase().includes(search) ||
          w.address.toLowerCase().includes(search) ||
          w.city.toLowerCase().includes(search)
        );
      }
      
      return {
        data: filtered,
        total: filtered.length,
      };
    },
    getById: async (id: string) => {
      await delay(300);
      const warehouse = mockWarehouses.find(w => w.id === id);
      if (!warehouse) throw new Error('Warehouse not found');
      
      // Populate employees
      const employees = mockWarehouseEmployees.filter(e => e.warehouseId === id);
      return { 
        data: {
          ...warehouse,
          employees: employees.map(e => ({
            ...e,
            user: mockUsers.find(u => u.id === e.userId),
            warehouse: warehouse,
          })),
        } 
      };
    },
    create: async (warehouse: Partial<Warehouse>) => {
      await delay(500);
      const newWarehouse: Warehouse = {
        ...warehouse as Warehouse,
        id: `WAREHOUSE-${mockWarehouses.length + 1}`,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockWarehouses.push(newWarehouse);
      return { data: newWarehouse };
    },
    update: async (id: string, updates: Partial<Warehouse>) => {
      await delay(500);
      const index = mockWarehouses.findIndex(w => w.id === id);
      if (index === -1) throw new Error('Warehouse not found');
      mockWarehouses[index] = { ...mockWarehouses[index], ...updates, updatedAt: new Date() };
      return { data: mockWarehouses[index] };
    },
    toggleStatus: async (id: string) => {
      await delay(300);
      const index = mockWarehouses.findIndex(w => w.id === id);
      if (index === -1) throw new Error('Warehouse not found');
      mockWarehouses[index].active = !mockWarehouses[index].active;
      mockWarehouses[index].updatedAt = new Date();
      return { data: mockWarehouses[index] };
    },
  },

  warehouseEmployees: {
    getAll: async (params?: any) => {
      await delay(500);
      let filtered = [...mockWarehouseEmployees];
      
      if (params?.warehouseId) {
        filtered = filtered.filter(e => e.warehouseId === params.warehouseId);
      }
      if (params?.role) {
        filtered = filtered.filter(e => e.role === params.role);
      }
      if (params?.active !== undefined) {
        filtered = filtered.filter(e => e.active === params.active);
      }
      if (params?.search) {
        const search = params.search.toLowerCase();
        filtered = filtered.filter(e => 
          e.user?.fullName?.toLowerCase().includes(search) ||
          e.user?.email?.toLowerCase().includes(search)
        );
      }
      
      // Populate user and warehouse data
      const populated = filtered.map(e => ({
        ...e,
        user: mockUsers.find(u => u.id === e.userId),
        warehouse: mockWarehouses.find(w => w.id === e.warehouseId),
      }));
      
      return {
        data: populated,
        total: populated.length,
      };
    },
    getById: async (id: string) => {
      await delay(300);
      const employee = mockWarehouseEmployees.find(e => e.id === id);
      if (!employee) throw new Error('Warehouse employee not found');
      return { 
        data: {
          ...employee,
          user: mockUsers.find(u => u.id === employee.userId),
          warehouse: mockWarehouses.find(w => w.id === employee.warehouseId),
        } 
      };
    },
    create: async (employee: Partial<WarehouseEmployee>) => {
      await delay(500);
      const newEmployee: WarehouseEmployee = {
        ...employee as WarehouseEmployee,
        id: `emp-${mockWarehouseEmployees.length + 1}`,
        active: true,
        startedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockWarehouseEmployees.push(newEmployee);
      return { data: newEmployee };
    },
    update: async (id: string, updates: Partial<WarehouseEmployee>) => {
      await delay(500);
      const index = mockWarehouseEmployees.findIndex(e => e.id === id);
      if (index === -1) throw new Error('Warehouse employee not found');
      mockWarehouseEmployees[index] = { ...mockWarehouseEmployees[index], ...updates, updatedAt: new Date() };
      return { data: mockWarehouseEmployees[index] };
    },
    toggleStatus: async (id: string) => {
      await delay(300);
      const index = mockWarehouseEmployees.findIndex(e => e.id === id);
      if (index === -1) throw new Error('Warehouse employee not found');
      mockWarehouseEmployees[index].active = !mockWarehouseEmployees[index].active;
      if (!mockWarehouseEmployees[index].active) {
        mockWarehouseEmployees[index].endedAt = new Date();
      }
      mockWarehouseEmployees[index].updatedAt = new Date();
      return { data: mockWarehouseEmployees[index] };
    },
  },
};
