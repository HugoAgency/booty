'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ArrowRight } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';

export default function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, subtotal, totalCount } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Drawer Header */}
          <div className="p-5 border-b border-rose-100 flex items-center justify-between bg-brand-soft">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-600" />
              <h2 className="text-lg font-bold text-gray-900">
                سلة المشتريات <span className="text-sm font-normal text-gray-500">({totalCount})</span>
              </h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-rose-100/50 transition"
              aria-label="إغلاق السلة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 space-y-4">
                <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center text-brand-400">
                  <ShoppingBag className="w-10 h-10" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">سلتك فارغة حالياً</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  استكشفي تشكيلتنا الفاخرة المخصصة للعناية بالبشرة وجمال القوام وأضيفي منتجاتكِ المفضلة
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="mt-4 px-6 py-2.5 bg-gradient-to-r from-brand-600 to-rose-600 text-white font-medium rounded-full hover:shadow-lg hover:shadow-rose-200 transition"
                >
                  تسوقي الآن / Start Shopping
                </button>
              </div>
            ) : (
              <div className="divide-y divide-rose-50 space-y-4">
                {items.map((item) => (
                  <div key={item.productId} className="pt-4 first:pt-0 flex gap-4 items-center">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-rose-50 border border-rose-100 shrink-0">
                      <Image
                        src={item.image}
                        alt={item.nameAr || item.name}
                        fill
                        className="object-cover"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-gray-900 truncate">
                        {item.nameAr || item.name}
                      </h4>
                      <p className="text-xs text-gray-500 truncate">{item.name}</p>
                      <p className="text-xs text-brand-600 font-semibold mt-0.5">
                        {item.sku}
                      </p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-sm font-bold text-gray-900">
                          {formatPrice(item.price * item.quantity)}
                        </span>

                        {/* Quantity Selector */}
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                            className="p-1 hover:bg-rose-100 text-gray-600 hover:text-brand-600 transition"
                            aria-label="تقليل الكمية"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-2 text-xs font-semibold text-gray-800">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                            className="p-1 hover:bg-rose-100 text-gray-600 hover:text-brand-600 transition"
                            aria-label="زيادة الكمية"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      aria-label="حذف المنتج"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          {items.length > 0 && (
            <div className="p-5 border-t border-rose-100 bg-white space-y-4">
              <div className="space-y-1.5 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>المجموع الفرعي / Subtotal:</span>
                  <span className="font-semibold text-gray-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>الشحن والتوصيل / Shipping:</span>
                  <span>مجاناً / Free</span>
                </div>
                <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-rose-50">
                  <span>الإجمالي النهائي / Total:</span>
                  <span className="text-brand-600 text-lg">{formatPrice(subtotal)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-brand-600 via-brand-primary to-rose-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-95 shadow-lg shadow-rose-200 transition duration-200 text-center"
              >
                <span>متابعة إتمام الطلب / Checkout</span>
                <ArrowLeft className="w-5 h-5 rtl:rotate-0 rotate-180" />
              </Link>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="w-full py-2 text-center text-xs text-gray-500 hover:text-gray-800 transition"
              >
                متابعة التسوق / Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
