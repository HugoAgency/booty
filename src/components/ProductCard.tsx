'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, Eye, Check } from 'lucide-react';
import { ProductItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';

export default function ProductCard({ product }: { product: ProductItem }) {
  const { addItem, items } = useCart();
  const cartItem = items.find((i) => i.productId === product.id);
  const isOutOfStock = product.stock <= 0;

  return (
    <div className="group relative bg-white rounded-2xl border border-rose-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Image container */}
      <Link href={`/products/${product.slug}`} className="relative w-full aspect-square bg-rose-50/50 overflow-hidden">
        <Image
          src={product.image}
          alt={product.nameAr || product.name}
          fill
          className="object-contain p-4 group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />

        {/* Top badges */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="bg-rose-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-sm">
              خصم {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
            </span>
          )}
          {product.size && (
            <span className="bg-white/90 backdrop-blur-xs text-gray-700 text-[11px] font-semibold px-2 py-0.5 rounded-full border border-gray-200 shadow-2xs">
              {product.size}
            </span>
          )}
        </div>

        {/* Hover quick-view overlay */}
        <div className="absolute inset-0 bg-brand-dark/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <span className="bg-white/90 text-brand-700 px-3 py-1.5 rounded-full text-xs font-bold shadow-md flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-3.5 h-3.5" />
            <span>عرض التفاصيل / View</span>
          </span>
        </div>
      </Link>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>{product.categoryAr || product.category}</span>
            <span className="font-mono text-[10px]">{product.sku}</span>
          </div>

          <Link href={`/products/${product.slug}`} className="block group-hover:text-brand-600 transition-colors">
            <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-1">
              {product.nameAr || product.name}
            </h3>
            <p className="text-xs text-gray-500 font-medium line-clamp-1 mt-0.5">
              {product.subtitleAr || product.subtitle || product.name}
            </p>
          </Link>
        </div>

        <div className="pt-2 border-t border-rose-50 flex items-center justify-between gap-2">
          {/* Prices */}
          <div>
            <div className="text-lg font-extrabold text-brand-600">
              {formatPrice(product.price)}
            </div>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <div className="text-xs text-gray-400 line-through">
                {formatPrice(product.compareAtPrice)}
              </div>
            )}
          </div>

          {/* Add to cart button */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() => addItem(product, 1)}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-sm transition-all duration-200 ${
              isOutOfStock
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : cartItem
                ? 'bg-rose-50 text-brand-600 border border-brand-200 hover:bg-rose-100'
                : 'bg-gradient-to-r from-brand-600 to-rose-600 text-white hover:opacity-95 hover:shadow-md hover:shadow-rose-200'
            }`}
          >
            {cartItem ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>في السلة ({cartItem.quantity})</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>أضف للسلة</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
