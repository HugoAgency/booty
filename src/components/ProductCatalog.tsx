'use client';

import React, { useState, useMemo } from 'react';
import { ProductItem } from '@/types';
import ProductCard from './ProductCard';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';

export default function ProductCatalog({ products }: { products: ProductItem[] }) {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc'>('featured');

  // Categories extracted dynamically from products
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      map.set(p.category, p.categoryAr);
    });
    return Array.from(map.entries());
  }, [products]);

  // Filtered & sorted products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory =
          selectedCategory === 'ALL' || p.category === selectedCategory;
        const matchesSearch =
          !searchQuery ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.nameAr.includes(searchQuery) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.descriptionAr.includes(searchQuery);

        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return 0; // featured default
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  return (
    <section id="products" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Section Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-brand-600 text-xs font-bold border border-rose-100">
            <Sparkles className="w-3.5 h-3.5" />
            <span>تشكيلة المنتجات الأصلية / Our Collection</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            مستحضرات العناية الفائقة
          </h2>
          <p className="text-sm sm:text-base text-gray-500">
            تركيبات متطورة ومصنوعة بعناية لا متناهية لتمنح بشرتكِ النقاء، التفتيح الموحد، والشد الملحوظ.
          </p>
        </div>

        {/* Filter and Search Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-brand-soft/60 p-4 rounded-2xl border border-rose-100">
          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                selectedCategory === 'ALL'
                  ? 'bg-gradient-to-r from-brand-600 to-rose-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 hover:bg-rose-50 border border-rose-100'
              }`}
            >
              جميع المنتجات ({products.length})
            </button>
            {categories.map(([catKey, catAr]) => (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
                  selectedCategory === catKey
                    ? 'bg-gradient-to-r from-brand-600 to-rose-600 text-white shadow-sm'
                    : 'bg-white text-gray-700 hover:bg-rose-50 border border-rose-100'
                }`}
              >
                {catAr}
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحثي عن منتج، كود SKU..."
                className="w-full pr-9 pl-3 py-2 text-xs sm:text-sm bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-gray-800"
              />
            </div>

            {/* Sort Dropdown */}
            <div className="relative shrink-0">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 text-xs sm:text-sm bg-white border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 text-gray-700 font-medium"
              >
                <option value="featured">المميزة أولاً</option>
                <option value="price-asc">السعر: من الأقل</option>
                <option value="price-desc">السعر: من الأعلى</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-rose-50/40 rounded-2xl border border-dashed border-rose-200">
            <Search className="w-8 h-8 text-rose-300 mx-auto" />
            <h4 className="text-base font-bold text-gray-700">{products.length === 0 ? 'لا توجد منتجات متاحة حاليًا' : 'لم يتم العثور على منتجات مطابقة'}</h4>
            <p className="text-xs text-gray-500">{products.length === 0 ? 'نحدّث مجموعتنا؛ يمكنكِ العودة لاحقًا للاطلاع على المنتجات.' : 'جربي كتابة كلمة بحث مختلفة أو إلغاء التصفية'}</p>
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSearchQuery('');
              }}
              className="mt-2 text-xs font-bold text-brand-600 hover:underline"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
