'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ProductItem } from '@/types';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';
import ShippingInfo from '@/components/ShippingInfo';
import CartStatus from '@/components/CartStatus';
import { ShoppingBag, Check, Plus, Minus, Heart, Sparkles, Tag, } from 'lucide-react';

export default function ProductDetailClient({ product: initialProduct }: { product: ProductItem }) {
  const router = useRouter();
  const { addItem, isReady, catalog } = useCart();
  const currentProduct = catalog?.find(item => item.id === initialProduct.id);
  const product = currentProduct ?? initialProduct;
  const unavailable = product.stock <= 0 || (catalog !== null && !currentProduct);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'benefits' | 'howTo' | 'ingredients'>('benefits');
  const [isAdded, setIsAdded] = useState(false);
  useEffect(() => {
    setQuantity(previous => Math.max(1, Math.min(previous, product.stock, 50)));
  }, [product.stock]);

  const handleAddToCart = () => {
    addItem(product, quantity);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 2500);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    router.push('/checkout');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
      {/* Product Image Section */}
      <div className="lg:col-span-6 space-y-4">
        <div className="relative aspect-square w-full rounded-3xl bg-rose-50/50 border border-rose-100 overflow-hidden shadow-sm flex items-center justify-center p-8 group">
          <Image
            src={product.image}
            alt={product.nameAr || product.name}
            fill
            className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
            priority
          />

          {/* Badges */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="bg-rose-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                وفر {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}%
              </span>
            )}
            {product.size && <span className="bg-white/90 backdrop-blur-xs text-gray-800 text-xs font-bold px-3 py-1 rounded-full border border-gray-200 shadow-2xs">
              {product.size}
            </span>}
          </div>
        </div>
      </div>

      {/* Product Details Section */}
      <div className="lg:col-span-6 min-w-0 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-brand-600 uppercase mb-2">
            <span>{product.categoryAr || product.category}</span>
            <span>•</span>
            <span className="font-mono text-gray-400">SKU: {product.sku}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 leading-tight">
            {product.nameAr || product.name}
          </h1>

          <p className="text-sm sm:text-base font-semibold text-gray-500 mt-1">
            {product.subtitleAr || product.subtitle || product.name}
          </p>
        </div>

        {/* Pricing */}
        <div className="flex flex-wrap items-baseline gap-3 p-4 bg-brand-soft/50 rounded-2xl border border-rose-100">
          <span className="text-3xl font-extrabold text-brand-600">
            {formatPrice(product.price)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-base text-gray-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
          <ShippingInfo subtotal={product.price * quantity} showTime={false} className="text-xs text-gray-700 w-full" />
        </div>

        {product.isBundle && <section className="rounded-2xl border border-rose-200 bg-brand-soft p-4 space-y-3" aria-labelledby="bundle-contents-title">
          <h2 id="bundle-contents-title" className="font-bold text-brand-dark">محتويات البكج</h2>
          <ul className="space-y-2 text-sm text-gray-700">
            {product.bundleItems?.map(item => <li key={item.productId} className="flex items-center gap-3">
              <Image src={item.product.image} alt="" width={40} height={40} className="rounded-lg object-contain" />
              <span>{item.quantity} × {item.product.nameAr || item.product.name}</span>
            </li>)}
          </ul>
          <p className="text-xs text-gray-600">السعر للبكج كاملًا ويُضاف إلى السلة كسلعة واحدة.</p>
        </section>}

        {/* Stock Status */}
        <div className="flex items-center gap-2 text-xs font-bold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-700">
            {!unavailable ? `متوفر في المخزون (${product.stock} ${product.isBundle ? 'بكج' : 'قطعة'} متاحة)` : 'نفد المخزون حاليًا'}
          </span>
        </div>

        {/* Quantity and Actions */}
        <div className="space-y-4 pt-2">
          <CartStatus />
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-700">الكمية:</span>
            <div className="flex items-center border-2 border-rose-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                disabled={unavailable || quantity <= 1}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="p-2.5 hover:bg-rose-50 text-gray-600 hover:text-brand-600 transition"
                aria-label="تقليل الكمية"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="px-5 text-sm font-bold text-gray-900">{quantity}</span>
              <button
                type="button"
                disabled={unavailable || quantity >= Math.min(product.stock, 50)}
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1, 50))}
                className="p-2.5 hover:bg-rose-50 text-gray-600 hover:text-brand-600 transition"
                aria-label="زيادة الكمية"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <span className="text-xs text-gray-500">
              الإجمالي: {formatPrice(product.price * quantity)}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={unavailable || !isReady}
              className={`w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isAdded
                  ? 'bg-emerald-600 text-white shadow-emerald-200'
                  : 'bg-gradient-to-r from-brand-600 via-brand-primary to-rose-600 text-white shadow-rose-200 hover:opacity-95 hover:shadow-xl'
              }`}
            >
              {isAdded ? (
                <>
                  <Check className="w-5 h-5" />
                  <span>تمت الإضافة بنجاح!</span>
                </>
              ) : (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  <span>أضف إلى السلة</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={unavailable || !isReady}
              className="w-full py-4 px-6 rounded-2xl font-bold text-sm sm:text-base bg-brand-dark text-white hover:bg-gray-800 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-brand-secondary" />
              <span>شراء فوري / Buy Now</span>
            </button>
          </div>
        </div>

        {/* Information Tabs */}
        <div className="pt-6 border-t border-rose-100">
          <div className="flex border-b border-rose-100 gap-6 text-sm font-bold text-gray-500">
            <button
              type="button"
              onClick={() => setActiveTab('benefits')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'benefits'
                  ? 'border-brand-600 text-brand-600 font-extrabold'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              المزايا والمفعول
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('howTo')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'howTo'
                  ? 'border-brand-600 text-brand-600 font-extrabold'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              طريقة الاستخدام
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ingredients')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'ingredients'
                  ? 'border-brand-600 text-brand-600 font-extrabold'
                  : 'border-transparent hover:text-gray-900'
              }`}
            >
              المكونات الفعالة
            </button>
          </div>

          <div className="pt-4 text-xs sm:text-sm text-gray-600 leading-relaxed min-h-[100px]">
            {activeTab === 'benefits' && (
              <div className="space-y-3">
                <p className="whitespace-pre-wrap break-words" dir="auto">{product.descriptionAr || product.description}</p>
              </div>
            )}

            {activeTab === 'howTo' && (
              <div className="space-y-2">
                {product.howToUseAr?.trim() || product.howToUse?.trim()
                  ? <p className="whitespace-pre-wrap break-words" dir="auto">{product.howToUseAr?.trim() || product.howToUse?.trim()}</p>
                  : <><p>لم تُضف طريقة الاستخدام لهذا المنتج بعد.</p>
                    <p>تختلف طريقة الاستخدام باختلاف المنتج. راجعي الإرشادات الموضحة على العبوة قبل الاستخدام.</p>
                    {product.isBundle && <p>اتبعي تعليمات كل منتج داخل البكج على حدة.</p>}</>}
              </div>
            )}

            {activeTab === 'ingredients' && (
              <div className="space-y-2">
                {product.ingredientsAr?.trim() || product.ingredients?.trim()
                  ? <p className="whitespace-pre-wrap break-words" dir="auto">{product.ingredientsAr?.trim() || product.ingredients?.trim()}</p>
                  : <><p>لم تُضف المكونات الفعالة لهذا المنتج بعد.</p>
                    <p>راجعي قائمة المكونات الموضحة على عبوة هذا المنتج؛ تختلف التركيبة بين المنتجات.</p></>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
