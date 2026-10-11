'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, ProductItem } from '@/types';

interface CartContextType {
  isReady: boolean;
  items: CartItem[];
  addItem: (product: ProductItem, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalCount: number;
  subtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  feedbackMessage: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'tbr_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }
    } catch {
      // ignore
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, isLoaded]);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };

  const addItem = (product: ProductItem, quantity = 1) => {
    if (!isLoaded || product.stock <= 0 || quantity < 1) return;
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        const newQty = Math.min(existing.quantity + quantity, product.stock, 50);
        return prev.map((item) =>
          item.productId === product.id ? {
            ...item, quantity: newQty, price: product.price, maxStock: product.stock,
            name: product.name, nameAr: product.nameAr, image: product.image, sku: product.sku,
          } : item
        );
      } else {
        const initialQty = Math.min(quantity, product.stock, 50);
        return [
          ...prev,
          {
            productId: product.id,
            slug: product.slug,
            name: product.name,
            nameAr: product.nameAr,
            price: product.price,
            image: product.image,
            sku: product.sku,
            quantity: initialQty,
            maxStock: product.stock,
          },
        ];
      }
    });

    showFeedback(`تمت إضافة "${product.nameAr || product.name}" إلى السلة بنجاح!`);
    setIsCartOpen(true);
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const clamped = Math.min(quantity, item.maxStock || 50, 50);
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalCount = items.reduce((acc, it) => acc + it.quantity, 0);
  const subtotal = Number(
    items.reduce((acc, it) => acc + it.price * it.quantity, 0).toFixed(2)
  );

  return (
    <CartContext.Provider
      value={{
        isReady: isLoaded,
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalCount,
        subtotal,
        isCartOpen,
        setIsCartOpen,
        feedbackMessage,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
