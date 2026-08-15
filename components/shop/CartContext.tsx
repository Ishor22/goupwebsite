'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  type CartItem,
  addCartItem,
  clearCart as clearCartStorage,
  onCartChanged,
  readCart,
  removeCartItem,
  setCartItemQuantity,
} from '@/lib/cartStorage';

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  addItem: (productId: string, quantity: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  // Starts empty so server and first client render match (no localStorage
  // during SSR); the real cart loads in the effect below, right after
  // mount, avoiding a hydration mismatch.
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    setItems(readCart());
    return onCartChanged(() => setItems(readCart()));
  }, []);

  const addItem = useCallback((productId: string, quantity: number) => {
    setItems(addCartItem(productId, quantity));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems(setCartItemQuantity(productId, quantity));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(removeCartItem(productId));
  }, []);

  const clear = useCallback(() => {
    setItems(clearCartStorage());
  }, []);

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, addItem, setQuantity, removeItem, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}
