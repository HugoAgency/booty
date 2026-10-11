'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2, Check, RefreshCw, AlertCircle, Package } from 'lucide-react';
import { ProductItem } from '@/types';
import { formatPrice } from '@/lib/currency';

export default function AdminProductsTab({ userRole }: { userRole?: string }) {
  const [products, setProducts] = useState<ProductItem[]>([]);
  const isReadOnly = userRole === 'SUPPORT';
  const [isLoading, setIsLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formNameAr, setFormNameAr] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formSubtitleAr, setFormSubtitleAr] = useState('');
  const [formPrice, setFormPrice] = useState(150);
  const [formComparePrice, setFormComparePrice] = useState<number | undefined>(190);
  const [formSku, setFormSku] = useState('');
  const [formImage, setFormImage] = useState('/images/lightening-intimate-gel.jpg');
  const [formSize, setFormSize] = useState('60ml');
  const [formCategory, setFormCategory] = useState('Body Care');
  const [formCategoryAr, setFormCategoryAr] = useState('عناية الجسم');
  const [formStock, setFormStock] = useState(50);
  const [formDescription, setFormDescription] = useState('');
  const [formDescriptionAr, setFormDescriptionAr] = useState('');

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openEditModal = (p: ProductItem) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormNameAr(p.nameAr);
    setFormSubtitle(p.subtitle || '');
    setFormSubtitleAr(p.subtitleAr || '');
    setFormPrice(p.price);
    setFormComparePrice(p.compareAtPrice || undefined);
    setFormSku(p.sku);
    setFormImage(p.image);
    setFormSize(p.size || '');
    setFormCategory(p.category);
    setFormCategoryAr(p.categoryAr);
    setFormStock(p.stock);
    setFormDescription(p.description);
    setFormDescriptionAr(p.descriptionAr);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name: formName,
        nameAr: formNameAr,
        subtitle: formSubtitle || undefined,
        subtitleAr: formSubtitleAr || undefined,
        price: Number(formPrice),
        compareAtPrice: formComparePrice ? Number(formComparePrice) : null,
        sku: formSku,
        image: formImage,
        size: formSize || undefined,
        category: formCategory,
        categoryAr: formCategoryAr,
        stock: Number(formStock),
        description: formDescription,
        descriptionAr: formDescriptionAr,
        isActive: true,
      };

      const url = editingProduct
        ? `/api/admin/products/${editingProduct.id}`
        : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل حفظ بيانات المنتج');
      }

      setMessage(editingProduct ? 'تم تعديل المنتج بنجاح' : 'تمت إضافة المنتج بنجاح');
      setTimeout(() => setMessage(null), 3000);
      setEditingProduct(null);
      setIsNewModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ أثناء الحفظ');
    }
  };

  const handleToggleActive = async (product: ProductItem) => {
    try {
      const res = await fetch(`/api/admin/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...product, isActive: !product.isActive }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, isActive: !p.isActive } : p))
        );
      }
    } catch (err) {
      console.error(err);
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
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold">
          {message}
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
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
              setFormName('');
              setFormNameAr('');
              setFormSubtitle('');
              setFormSubtitleAr('');
              setFormPrice(150);
              setFormComparePrice(190);
              setFormSku(`TBR-NEW-${Date.now().toString().slice(-4)}`);
              setFormImage('/images/lightening-intimate-gel.jpg');
              setFormSize('100ml');
              setFormCategory('Skin Care');
              setFormCategoryAr('عناية البشرة');
              setFormStock(50);
              setFormDescription('منتج فاخر للعناية بالبشرة');
              setFormDescriptionAr('تركيبة متقدمة للعناية الفائقة بالبشرة');
              setIsNewModalOpen(true);
            }}
            className="px-4 py-2.5 bg-brand-dark hover:bg-gray-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منتج جديد</span>
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
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-brand-700 font-bold">{p.sku}</td>
                    <td className="p-3.5">{p.categoryAr || p.category}</td>
                    <td className="p-3.5 font-bold text-gray-900">{formatPrice(p.price)}</td>
                    <td className="p-3.5">
                      {isReadOnly ? (
                        <span className="font-mono font-bold px-2 text-gray-800">{p.stock}</span>
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

      {/* Edit / New Product Modal */}
      {(editingProduct || isNewModalOpen) && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {editingProduct ? 'تعديل بيانات المنتج' : 'إضافة منتج جديد للكتالوج'}
              </h3>
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setIsNewModalOpen(false);
                }}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">الاسم بالعربية</label>
                  <input
                    type="text"
                    required
                    value={formNameAr}
                    onChange={(e) => setFormNameAr(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">السعر (د.أ)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">السعر السابق (خصم)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formComparePrice || ''}
                    onChange={(e) => setFormComparePrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">المخزون الحالي</label>
                  <input
                    type="number"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">كود SKU</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">الحجم / السعة</label>
                  <input
                    type="text"
                    value={formSize}
                    onChange={(e) => setFormSize(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">مسار الصورة</label>
                  <input
                    type="text"
                    required
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="w-full p-2.5 border border-gray-200 rounded-xl outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">الوصف بالعربية</label>
                <textarea
                  rows={2}
                  required
                  value={formDescriptionAr}
                  onChange={(e) => setFormDescriptionAr(e.target.value)}
                  className="w-full p-2.5 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setIsNewModalOpen(false);
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-xs"
                >
                  حفظ البيانات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
