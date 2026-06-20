export interface CartItem {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  quantity: number;
  imageUrl: string;
  unitLabel?: string;
  maxQuantity?: number;
}
