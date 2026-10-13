import React from 'react';
import { isProductImageSource, normalizeProductImageSource } from '@/lib/product-images';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getActiveProducts } from '@/lib/products';
import ProductDetailClient from './ProductDetailClient';
import { ArrowRight, ShieldCheck, Truck, RefreshCw } from 'lucide-react';
import ProductCard from '@/components/ProductCard';
import ShippingInfo from '@/components/ShippingInfo';

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) return { title: 'المنتج غير موجود | THE BOOTY REPUBLIC' };
  const imageSource = normalizeProductImageSource(product.image);
  return {
    title: `${product.nameAr || product.name} | THE BOOTY REPUBLIC`,
    description: product.descriptionAr || product.description,
    openGraph: {
      images: isProductImageSource(imageSource) ? [imageSource] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug);
  if (!product) {
    notFound();
  }

  const allProducts = await getActiveProducts();
  const related = allProducts.filter((p) => p.id !== product.id).slice(0, 2);

  return (
    <div className="bg-white py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500">
          <Link href="/" className="hover:text-brand-600 transition">
            الرئيسية
          </Link>
          <span>/</span>
          <Link href="/#products" className="hover:text-brand-600 transition">
            المنتجات
          </Link>
          <span>/</span>
          <span className="text-gray-800 font-semibold truncate max-w-xs">
            {product.nameAr || product.name}
          </span>
        </nav>

        {/* Client Product View (Image + Quantity + Add To Cart) */}
        <ProductDetailClient product={product} />

        {/* Guarantees row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8 border-y border-rose-100 bg-brand-soft/30 rounded-2xl p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-rose-100 flex items-center justify-center text-brand-600">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">التوصيل في الأردن</h4>
              <ShippingInfo showFees className="text-xs text-gray-600 space-y-1" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-rose-100 flex items-center justify-center text-emerald-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">أصلي ومضمون 100%</h4>
              <p className="text-xs text-gray-500">راجعي وصف المنتج ومواصفاته قبل الاختيار</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white shadow-xs border border-rose-100 flex items-center justify-center text-blue-600">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">دفع آمن عند الاستلام</h4>
              <p className="text-xs text-gray-500">افحصي طلبكِ وادفعي عند وصول الشحنة</p>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="space-y-6 pt-4">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
              منتجات مكملة لروتينكِ الفاخر
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
