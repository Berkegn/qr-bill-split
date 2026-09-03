import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface CartItemOption {
  label: string;   // e.g. "İçerik"
  choice: string;  // e.g. "Kaşarlı"
}

export interface CartItem {
  cartId: string;        // unique per cart entry (productId + options hash)
  productId: string;
  name: string;
  price: number;
  quantity: number;
  category: string;
  selectedOptions: CartItemOption[];
}

interface SessionInfo {
  tableId: string;
  userId: string;
  sessionId?: string;
}

interface CartContextValue {
  cartItems: CartItem[];
  sessionInfo: SessionInfo | null;
  setSessionInfo: (info: SessionInfo) => void;
  addToCart: (item: Omit<CartItem, 'cartId' | 'quantity'>) => void;
  removeFromCart: (cartId: string) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | null>(null);

function makeCartId(productId: string, options: CartItemOption[]): string {
  const optStr = options.map(o => `${o.label}:${o.choice}`).sort().join('|');
  return `${productId}__${optStr}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);

  const addToCart = useCallback((item: Omit<CartItem, 'cartId' | 'quantity'>) => {
    const cartId = makeCartId(item.productId, item.selectedOptions);
    setCartItems(prev => {
      const existing = prev.find(c => c.cartId === cartId);
      if (existing) {
        return prev.map(c => c.cartId === cartId ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { ...item, cartId, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((cartId: string) => {
    setCartItems(prev => {
      const existing = prev.find(c => c.cartId === cartId);
      if (!existing) return prev;
      if (existing.quantity <= 1) return prev.filter(c => c.cartId !== cartId);
      return prev.map(c => c.cartId === cartId ? { ...c, quantity: c.quantity - 1 } : c);
    });
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const totalItems = cartItems.reduce((s, c) => s + c.quantity, 0);
  const totalPrice = cartItems.reduce((s, c) => s + c.price * c.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, sessionInfo, setSessionInfo,
      addToCart, removeFromCart, clearCart,
      totalItems, totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
