export type CartItem = {
  id: string;
  productId: string;
  title: string;
  price: number;
  quantity: number;
  color: string;
  image: string;
  selected: boolean;
};

class CartServiceClass {
  private items: CartItem[] = [];

  // Get all cart items
  getItems(): CartItem[] {
    return this.items;
  }

  // Add item to cart
  addItem(item: Omit<CartItem, 'id' | 'selected'>): void {
    // Check if item already exists (same product and color)
    const existingItem = this.items.find(
      (i) => i.productId === item.productId && i.color === item.color
    );

    if (existingItem) {
      // Update quantity
      existingItem.quantity += item.quantity;
    } else {
      // Add new item
      this.items.push({
        ...item,
        id: Date.now().toString(),
        selected: true,
      });
    }

    console.log('Cart updated:', this.items);
  }

  // Remove item from cart
  removeItem(id: string): void {
    this.items = this.items.filter((item) => item.id !== id);
    console.log('Item removed, cart:', this.items);
  }

  // Update item quantity
  updateQuantity(id: string, quantity: number): void {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.quantity = Math.max(1, quantity);
    }
  }

  // Toggle item selection
  toggleSelection(id: string): void {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      item.selected = !item.selected;
    }
  }

  // Get selected items
  getSelectedItems(): CartItem[] {
    return this.items.filter((item) => item.selected);
  }

  // Calculate subtotal
  getSubtotal(): number {
    return this.getSelectedItems().reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  // Calculate total (with shipping)
  getTotal(shippingCost: number = 6.0): number {
    return this.getSubtotal() + shippingCost;
  }

  // Get cart count
  getCount(): number {
    return this.items.reduce((total, item) => total + item.quantity, 0);
  }

  // Clear cart
  clear(): void {
    this.items = [];
  }
}

export const CartService = new CartServiceClass();
