/**
 * per-საწყობი მარაგის ჩანაწერი (Balance Sale-ისთვის ლოგიკური არჩევანი checkout-ზე).
 * UI-ში არ ვაჩვენებთ — უბრალოდ შიდა გამოყენებისთვის.
 */
export interface ProductStockByWarehouse {
  warehouseUuid: string;
  warehouseName?: string;
  branchUuid?: string;
  quantity: number;
  reserve: number;
  /** ხელმისაწვდომი მარაგი (quantity − reserve, >= 0) */
  available: number;
  seriesUuid?: string;
}

/**
 * per-სერია ჩანაწერი (Balance Items[].Series required-ია სერიული ნომენკლატურისთვის).
 */
export interface ProductSeriesEntry {
  seriesUuid?: string;
  seriesNumber?: string;
  quantity?: number;
  expiryDate?: string;
  warehouseUuid?: string;
}

// Medicine Types
export interface Medicine {
  id: string;
  name: string;
  genericName?: string;
  /** სიძლიერე / დოზა (API strength) */
  strength?: string;
  /** ადმინში ჩაწერილი აქტიური ნივთიერება */
  activeIngredients?: string;
  nameGeo: string;
  code?: string; // Product code (e.g., MED123)
  brand: string;
  price: number;
  oldPrice?: number; // Original price before discount
  discountPrice?: number;
  discountPercentage?: number;
  thumbnail: string;
  images: string[];
  description: string;
  descriptionGeo: string;
  annotation?: string; // Detailed product annotation/instructions
  sideEffects?: string[];
  contraindications?: string[];
  storageConditions?: string;
  category: string;
  dosageForm: string;
  packSize?: string; // ბაზიდან, მაგ. "10 tablets", "20 აბი"
  prescriptionRequired: boolean;
  manufacturer: string;
  stockQuantity: number;
  lowStockThreshold: number;
  inStock: boolean;
  rating: number;
  reviewCount: number;

  // ── Balance Sale-ის დასახმარებელი hidden ველები (UI-ში არ ჩანს) ──
  /** Balance Exchange/Stocks ჯამური რაოდენობა */
  quantity?: number;
  /** Balance Reserve ჯამი */
  reservedQuantity?: number;
  /** ხელმისაწვდომი მარაგი (quantity − reservedQuantity, >= 0) */
  availableQuantity?: number;
  /** per-საწყობი მარაგი — warehouse picker-ისა და Balance Sale Warehouse-ისთვის */
  stockByWarehouse?: ProductStockByWarehouse[];
  /** per-სერია ჩანაწერი — Balance Items[].Series required-ია */
  series?: ProductSeriesEntry[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
