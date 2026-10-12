'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CartItem, ProductItem } from '@/types';
import { cartSubtotal, readStoredCart, reconcileCart } from '@/lib/cart';

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
  catalog: ProductItem[] | null;
  catalogLoading: boolean;
  catalogError: boolean;
  cartNotice: string | null;
  refreshCatalog: () => Promise<ProductItem[] | null>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'tbr_cart_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = items;
  const [isLoaded, setIsLoaded] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<ProductItem[] | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
  const [cartNotice, setCartNotice] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const previousPath = useRef<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(readStoredCart(JSON.parse(stored)));
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

  const refreshCatalog = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    setCatalogLoading(true);
    setCatalogError(false);
    try {
      const response = await fetch('/api/products', { cache: 'no-store', signal: controller.signal });
      const data = await response.json();
      if (!response.ok || !data.success || !Array.isArray(data.products)) throw new Error('Catalog unavailable');
      if (request.current !== controller) return null;
      const current: ProductItem[] = data.products;
      setCatalog(current);
      const result = reconcileCart(itemsRef.current, current);
      itemsRef.current = result.items;
      setItems(result.items);
      if (result.changed) setCartNotice(result.removed.length
          ? `أزيلت سلع غير متاحة من السلة: ${result.removed.join('، ')}. راجعي السلة قبل التأكيد.`
          : 'تحدّثت بيانات السلة والأسعار أو الكميات المتاحة. راجعي المبلغ قبل التأكيد.');
      return current;
    } catch {
      if (request.current === controller) setCatalogError(true);
      return null;
    } finally {
      window.clearTimeout(timeout);
      if (request.current === controller) setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    void refreshCatalog();
    if (previousPath.current !== null && previousPath.current !== pathname) router.refresh();
    previousPath.current = pathname;
    return () => { request.current?.abort(); request.current = null; };
  }, [isLoaded, pathname, refreshCatalog, router]);

  useEffect(() => {
    const revalidate = () => {
      if (document.visibilityState !== 'visible') return;
      void refreshCatalog();
      router.refresh();
    };
    window.addEventListener('focus', revalidate);
    window.addEventListener('online', revalidate);
    window.addEventListener('catalog-updated', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    const interval = window.setInterval(revalidate, 60000);
    return () => {
      window.removeEventListener('focus', revalidate);
      window.removeEventListener('online', revalidate);
      window.removeEventListener('catalog-updated', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
      window.clearInterval(interval);
    };
  }, [refreshCatalog, router]);

  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3000);
  };

  const addItem = (product: ProductItem, quantity = 1) => {
    const current = catalog?.find(item => item.id === product.id);
    if (!isLoaded || catalogLoading || catalogError || !current || current.stock <= 0 || quantity < 1) return;
    product = current;
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
  const subtotal = cartSubtotal(items);

  return (
    <CartContext.Provider
      value={{
        isReady: isLoaded && catalog !== null && !catalogLoading && !catalogError,
        catalog, catalogLoading, catalogError, cartNotice, refreshCatalog,
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
