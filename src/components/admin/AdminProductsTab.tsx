'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit, RefreshCw } from 'lucide-react';
import { ProductItem } from '@/types';
import { formatPrice } from '@/lib/currency';
import ProductEditor from './ProductEditor';
import { useRemoteData } from '@/hooks/useRemoteData';

export default function AdminProductsTab({ userRole }: { userRole?: string }) {
  const { data, loading: isLoading, error: readError, refresh } = useRemoteData<{ products: ProductItem[] }>('/api/admin/products', 'تعذر تحميل المنتجات');
  const products = data?.products ?? [];
  const isReadOnly = userRole === 'SUPPORT';

  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => { setError(null); return refresh(); };

  const openEditModal = (p: ProductItem) => setEditingProduct(p);

  const handleToggleActive = async (product: ProductItem) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, isActive: !product.isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'تعذر تحديث الحالة');
      window.dispatchEvent(new Event('catalog-updated'));
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الاتصال؛ أعد المحاولة');
    }
  };

  const handleQuickStock = async (product: ProductItem, newStock: number) => {
    if (newStock < 0) return;
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, stock: newStock }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'تعذر تحديث المخزون');
      window.dispatchEvent(new Event('catalog-updated'));
      await fetchProducts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر الاتصال؛ أعد المحاولة');
    }
  };

  return (
    <div className="space-y-6">
      {(error || readError) && <div role="alert" className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
        <span>{error || readError}</span><button type="button" onClick={fetchProducts} className="rounded-lg px-3 py-2 font-bold hover:bg-rose-100">إعادة المحاولة</button>
      </div>}
      {message && (
        <div role="status" aria-live="polite" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
          {message}
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-wrap gap-3 items-center justify-between bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-gray-900">إدارة كتالوج المنتجات والمخزون</h3>
          <p className="text-xs text-gray-500">
            تحديث الأسعار، كميات المخزون، وتفعيل المنتجات في واجهة المتجر
          </p>
        </div>

        {!isReadOnly && (
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsNewModalOpen(true);
            }}
            className="px-4 py-2.5 bg-brand-dark hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج / بكج</span>
          </button>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
            <p className="text-xs">جاري تحميل المنتجات...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3.5">المنتج</th>
                  <th className="p-3.5">الكود SKU</th>
                  <th className="p-3.5">القسم</th>
                  <th className="p-3.5">السعر</th>
                  <th className="p-3.5">المخزون المتوفر</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {products.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-500">لا توجد منتجات بعد. أضف منتجات منفردة ثم أنشئ البكجات.</td></tr>}
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-rose-50/20 transition">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg bg-rose-50 border border-rose-100 overflow-hidden shrink-0">
                          <Image src={p.image} alt={p.name} fill className="object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{p.nameAr || p.name}</p>
                          <p className="text-[11px] text-gray-400">{p.name}</p>
                          {p.isBundle && <span className="text-[11px] font-bold text-brand-700">بكج · {p.bundleItems?.length || 0} منتجات</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-brand-700 font-bold">{p.sku}</td>
                    <td className="p-3.5">{p.categoryAr || p.category}</td>
                    <td className="p-3.5 font-bold text-gray-900">{formatPrice(p.price)}</td>
                    <td className="p-3.5">
                      {isReadOnly || p.isBundle ? (
                        <span className="font-mono font-bold px-2 text-gray-800">{p.stock}{p.isBundle && <span className="block font-sans text-[11px] text-gray-500">محسوب من المكونات</span>}</span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleQuickStock(p, p.stock - 5)}
                            className="w-6 h-6 rounded bg-gray-100 hover:bg-rose-100 text-gray-700 font-bold flex items-center justify-center text-xs"
                          >
                            -5
                          </button>
                          <span className="font-mono font-bold px-2">{p.stock}</span>
                          <button
                            onClick={() => handleQuickStock(p, p.stock + 5)}
                            className="w-6 h-6 rounded bg-gray-100 hover:bg-rose-100 text-gray-700 font-bold flex items-center justify-center text-xs"
                          >
                            +5
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="p-3.5">
                      {isReadOnly ? (
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            p.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {p.isActive ? 'مفعل (نشط)' : 'معطل'}
                        </span>
                      ) : (
                        <button
                          onClick={() => handleToggleActive(p)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            p.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {p.isActive ? 'مفعل (نشط)' : 'معطل'}
                        </button>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {isReadOnly ? (
                        <span className="text-[11px] text-gray-400">للقراءة فقط</span>
                      ) : (
                        <button
                          onClick={() => openEditModal(p)}
                          className="px-3 py-1 bg-gray-100 hover:bg-brand-50 hover:text-brand-700 text-gray-700 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(editingProduct || isNewModalOpen) && (
        <ProductEditor product={editingProduct} products={products}
          onClose={() => { setEditingProduct(null); setIsNewModalOpen(false); }}
          onSaved={() => {
            window.dispatchEvent(new Event('catalog-updated'));
            setMessage('تم حفظ بيانات السلعة بنجاح');
            setEditingProduct(null); setIsNewModalOpen(false);
            fetchProducts();
          }} />
      )}
    </div>
  );
}
