"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { loadCartItems, saveCartItems } from "@/lib/cart/storage";
import type { CartItem } from "@/types/cart";
import { CartDrawer } from "@/components/cart/CartDrawer";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  totalPrice: number;
  totalOldPrice: number;
  totalDiscount: number;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addToCart: (
    item: Omit<CartItem, "quantity">,
    quantity?: number,
    options?: { openDrawer?: boolean },
  ) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setItems(loadCartItems());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveCartItems(items);
  }, [items, hydrated]);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const totalOldPrice = items.reduce(
    (sum, item) => sum + (item.oldPrice ?? item.price) * item.quantity,
    0,
  );
  const totalDiscount = Math.max(0, totalOldPrice - totalPrice);

  const mergeCartItem = useCallback(
    (
      prev: CartItem[],
      newItem: Omit<CartItem, "quantity">,
      quantity: number,
    ): CartItem[] => {
      const index = prev.findIndex((item) => item.id === newItem.id);
      if (index >= 0) {
        const updated = [...prev];
        const existing = updated[index];
        const nextQty = existing.quantity + quantity;
        const capped =
          existing.maxQuantity != null
            ? Math.min(nextQty, existing.maxQuantity)
            : nextQty;
        updated[index] = { ...existing, quantity: capped };
        return updated;
      }
      return [...prev, { ...newItem, quantity }];
    },
    [],
  );

  const addToCart = useCallback(
    (
      newItem: Omit<CartItem, "quantity">,
      quantity = 1,
      options?: { openDrawer?: boolean },
    ) => {
      setItems((prev) => {
        const next = mergeCartItem(prev, newItem, quantity);
        saveCartItems(next);
        return next;
      });
      if (options?.openDrawer !== false) {
        setDrawerOpen(true);
      }
    },
    [mergeCartItem],
  );

  const removeFromCart = useCallback((itemId: string) => {
    setItems((prev) => {
      const next = prev.filter((item) => item.id !== itemId);
      saveCartItems(next);
      return next;
    });
  }, []);

  const updateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(itemId);
        return;
      }
      setItems((prev) => {
        const next = prev.map((item) => {
          if (item.id !== itemId) return item;
          const capped =
            item.maxQuantity != null
              ? Math.min(quantity, item.maxQuantity)
              : quantity;
          return { ...item, quantity: capped };
        });
        saveCartItems(next);
        return next;
      });
    },
    [removeFromCart],
  );

  const clearCart = useCallback(() => {
    setItems([]);
    saveCartItems([]);
  }, []);

  const value = useMemo(
    () => ({
      items,
      itemCount,
      totalPrice,
      totalOldPrice,
      totalDiscount,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    }),
    [
      items,
      itemCount,
      totalPrice,
      totalOldPrice,
      totalDiscount,
      drawerOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
    ],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      <CartDrawer />
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
