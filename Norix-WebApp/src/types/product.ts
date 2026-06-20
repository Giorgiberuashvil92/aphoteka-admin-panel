export interface Product {
  id: string;
  name: string;
  brand?: string;
  price: number;
  oldPrice?: number;
  discountPercentage?: number;
  imageUrl?: string;
  category?: string;
  subcategory?: string;
  countryOfOrigin?: string;
}

export interface ProductDetail extends Product {
  sku: string;
  description?: string;
  quantity?: number;
  unitOfMeasure?: string;
  genericName?: string;
  manufacturer?: string;
  productNameBrand?: string;
  mainCategory?: string;
  therapeuticClass?: string;
  usage?: string;
  storageConditions?: string;
  activeIngredients?: string;
  sideEffects?: string[];
  contraindications?: string[];
  packSize?: string;
  dosageForm?: string;
  strength?: string;
}

export interface PaginatedProducts {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

export type ProductSort =
  | "popular"
  | "price-asc"
  | "price-desc"
  | "name";
