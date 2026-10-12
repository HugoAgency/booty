'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useRemoteData<T>(url: string | null, failureMessage: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(Boolean(url));
  const [error, setError] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);

  const refresh = useCallback(async () => {
    if (!url) return null;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || failureMessage);
      if (request.current !== controller) return null;
      setData(result);
      return result as T;
    } catch (cause) {
      if (request.current === controller) {
        setData(null);
        setError(cause instanceof Error && cause.name !== 'AbortError' ? cause.message : failureMessage);
      }
      return null;
    } finally {
      window.clearTimeout(timeout);
      if (request.current === controller) setLoading(false);
    }
  }, [url, failureMessage]);

  useEffect(() => {
    setData(null);
    if (!url) { setLoading(false); setError(null); return; }
    void refresh();
    return () => { request.current?.abort(); request.current = null; };
  }, [url, refresh]);

  useEffect(() => {
    const revalidate = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', revalidate);
    window.addEventListener('online', revalidate);
    document.addEventListener('visibilitychange', revalidate);
    const interval = window.setInterval(revalidate, 60000);
    return () => {
      window.removeEventListener('focus', revalidate);
      window.removeEventListener('online', revalidate);
      document.removeEventListener('visibilitychange', revalidate);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return { data, loading, error, refresh };
}
