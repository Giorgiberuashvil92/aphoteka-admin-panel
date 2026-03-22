// Medicine Types
export interface Medicine {
  id: string;
  name: string;
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
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
