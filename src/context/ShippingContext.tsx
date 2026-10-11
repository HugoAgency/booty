'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ShippingRules } from '@/lib/shipping-rules';
import { ShippingConfigSchema } from '@/lib/validations';

interface ShippingState {
  rules: ShippingRules | null;
  loading: boolean;
  error: boolean;
  refresh: () => Promise<ShippingRules | null>;
}

const ShippingContext = createContext<ShippingState>({
  rules: null, loading: true, error: false, refresh: async () => null,
});

export function ShippingProvider({ children }: { children: React.ReactNode }) {
  const [rules, setRules] = useState<ShippingRules | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const request = useRef<AbortController | null>(null);
  const pathname = usePathname();

  const refresh = useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    setLoading(true);
    setError(false);
    try {
      const response = await fetch('/api/shipping/rules', { cache: 'no-store', signal: controller.signal });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error('Shipping rules unavailable');
      const current = ShippingConfigSchema.parse(data.rules);
      if (request.current !== controller) return null;
      setRules(current);
      return current;
    } catch {
      if (request.current === controller) {
        setRules(null);
        setError(true);
      }
      return null;
    } finally {
      window.clearTimeout(timeout);
      if (request.current === controller) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
    return () => { request.current?.abort(); request.current = null; };
  }, [pathname, refresh]);

  useEffect(() => {
    const revalidate = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', revalidate);
    window.addEventListener('online', revalidate);
    window.addEventListener('shipping-rules-updated', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    const interval = window.setInterval(revalidate, 60000);
    return () => {
      window.removeEventListener('focus', revalidate);
      window.removeEventListener('online', revalidate);
      window.removeEventListener('shipping-rules-updated', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return <ShippingContext.Provider value={{ rules, loading, error, refresh }}>{children}</ShippingContext.Provider>;
}

export function useShipping() { return useContext(ShippingContext); }
