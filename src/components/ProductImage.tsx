'use client';

import Image, { ImageProps } from 'next/image';
import React, { useEffect, useState } from 'react';
import { ImageOff } from 'lucide-react';
import { isProductImageSource, normalizeProductImageSource } from '@/lib/product-images';

type ProductImageProps = Omit<ImageProps, 'src' | 'unoptimized'> & { src: string; compact?: boolean };

export default function ProductImage({ src, alt, compact = false, onError, onLoad, ...props }: ProductImageProps) {
  const source = normalizeProductImageSource(src);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  useEffect(() => {
    const retry = () => { if (document.visibilityState === 'visible') setFailedSource(null); };
    window.addEventListener('online', retry);
    window.addEventListener('focus', retry);
    return () => {
      window.removeEventListener('online', retry);
      window.removeEventListener('focus', retry);
    };
  }, []);

  if (!isProductImageSource(source) || failedSource === source) {
    return <span role="img" aria-label={`الصورة غير متاحة${alt ? `: ${alt}` : ''}`} title="الصورة غير متاحة"
      className={`${props.className || ''} ${props.fill ? 'absolute inset-0' : ''} flex flex-col items-center justify-center gap-1 bg-brand-soft text-gray-500`}
      style={{ ...props.style, ...(props.fill ? {} : { width: props.width, height: props.height }) }}>
      <ImageOff aria-hidden="true" className="h-5 w-5 shrink-0" />
      {!compact && <span className="px-2 text-center text-xs">الصورة غير متاحة</span>}
    </span>;
  }

  // Browser loads only; do not introduce a proxy or optimized server-side URL fetch.
  return <Image {...props} key={source} src={source} alt={alt} unoptimized
    referrerPolicy={props.referrerPolicy || 'no-referrer'}
    onLoad={onLoad} onError={event => { setFailedSource(source); onError?.(event); }} />;
}
