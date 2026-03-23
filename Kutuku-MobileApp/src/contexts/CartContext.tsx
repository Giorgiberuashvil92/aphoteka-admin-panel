import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { Alert } from 'react-native';

// Cart Item Interface
export interface CartItem {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  quantity: number;
  image: string;
  // Medicine specific fields
  packageSize?: string;  // e.g., "20 აბი"
  form?: string;         // e.g., "აბი", "კაფსულა"
  maxQuantity?: number;  // Stock limit
}

// Cart Context Interface
interface CartContextType {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  addToCart: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  /** შეკვეთის შემდეგ — დადასტურების დიალოგის გარეშე */
  clearCartSilently: () => void;
  isInCart: (itemId: string) => boolean;
  getItemQuantity: (itemId: string) => number;
}

// Create Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider Props
interface CartProviderProps {
  children: ReactNode;
}

// Cart Provider Component
export function CartProvider({ children }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Calculate total item count
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Calculate total price
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Add item to cart
  const addToCart = useCallback((newItem: Omit<CartItem, 'quantity'>, quantity: number = 1) => {
    setItems((prevItems) => {
      // Check if item already exists
      const existingItemIndex = prevItems.findIndex((item) => item.id === newItem.id);

      if (existingItemIndex !== -1) {
        // Item exists, update quantity
        const updatedItems = [...prevItems];
        const existingItem = updatedItems[existingItemIndex];
        const newQuantity = existingItem.quantity + quantity;

        // Check max quantity limit
        if (existingItem.maxQuantity && newQuantity > existingItem.maxQuantity) {
          Alert.alert(
            'მაქსიმალური რაოდენობა',
            `ამ პროდუქტის მაქსიმალური რაოდენობაა ${existingItem.maxQuantity}`
          );
          return prevItems;
        }

        updatedItems[existingItemIndex] = {
          ...existingItem,
          quantity: newQuantity,
        };

        Alert.alert('✅ დამატებულია', `${newItem.name} - რაოდენობა: ${newQuantity}`);
        return updatedItems;
      } else {
        // New item, add to cart
        const cartItem: CartItem = {
          ...newItem,
          quantity,
        };

        Alert.alert('✅ კალათაში დაემატა', newItem.name);
        return [...prevItems, cartItem];
      }
    });
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((itemId: string) => {
    setItems((prevItems) => {
      const item = prevItems.find((i) => i.id === itemId);
      if (item) {
        Alert.alert('🗑️ წაშლილია', `${item.name} წაიშალა კალათიდან`);
      }
      return prevItems.filter((item) => item.id !== itemId);
    });
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setItems((prevItems) => {
      return prevItems.map((item) => {
        if (item.id === itemId) {
          // Check max quantity limit
          if (item.maxQuantity && quantity > item.maxQuantity) {
            Alert.alert(
              'მაქსიმალური რაოდენობა',
              `ამ პროდუქტის მაქსიმალური რაოდენობაა ${item.maxQuantity}`
            );
            return item;
          }

          return { ...item, quantity };
        }
        return item;
      });
    });
  }, [removeFromCart]);

  const clearCartSilently = useCallback(() => {
    setItems([]);
  }, []);

  // Clear entire cart
  const clearCart = useCallback(() => {
    Alert.alert(
      'კალათის გასუფთავება',
      'დარწმუნებული ხართ რომ გსურთ კალათის გასუფთავება?',
      [
        { text: 'გაუქმება', style: 'cancel' },
        {
          text: 'გასუფთავება',
          style: 'destructive',
          onPress: () => {
            setItems([]);
            Alert.alert('✅ გასუფთავებულია', 'კალათა გასუფთავებულია');
          },
        },
      ]
    );
  }, []);

  // Check if item is in cart
  const isInCart = useCallback(
    (itemId: string) => {
      return items.some((item) => item.id === itemId);
    },
    [items]
  );

  // Get item quantity
  const getItemQuantity = useCallback(
    (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      return item ? item.quantity : 0;
    },
    [items]
  );

  const value: CartContextType = {
    items,
    itemCount,
    totalPrice,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    clearCartSilently,
    isInCart,
    getItemQuantity,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// Custom Hook to use Cart Context
export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
