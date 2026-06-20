export interface FavoriteItem {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  imageUrl: string;
  unitLabel?: string;
  maxQuantity?: number;
}
