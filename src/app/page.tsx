import React from 'react';
import HeroSection from '@/components/HeroSection';
import ProductCatalog from '@/components/ProductCatalog';
import BrandFeatures from '@/components/BrandFeatures';
import FaqSection from '@/components/FaqSection';
import { getActiveProducts, getFeaturedProduct } from '@/lib/products';

export const dynamic = 'force-dynamic'; // Every request reads current catalog and sales.

export default async function HomePage() {
  const products = await getActiveProducts();
  const featured = await getFeaturedProduct(products);

  return (
    <div>
      <HeroSection featuredProduct={featured.product} isBestSeller={featured.isBestSeller} />
      <ProductCatalog products={products} />
      <BrandFeatures />
      <FaqSection />
    </div>
  );
}
