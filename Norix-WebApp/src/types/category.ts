export interface Category {
  id: string;
  name: string;
  productCount: number;
  color?: string;
  icon?: string;
  imageUrl?: string;
}

export interface Subcategory {
  id: string;
  name: string;
}
