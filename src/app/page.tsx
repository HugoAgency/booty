import React from 'react';
import HeroSection from '@/components/HeroSection';
import ProductCatalog from '@/components/ProductCatalog';
import BrandFeatures from '@/components/BrandFeatures';
import FaqSection from '@/components/FaqSection';
import { getActiveProducts } from '@/lib/products';

export const revalidate = 60; // revalidate every 60 seconds

export default async function HomePage() {
  const products = await getActiveProducts();

  return (
    <div>
      <HeroSection />
      <ProductCatalog products={products} />
      <BrandFeatures />
      <FaqSection />
    </div>
  );
}
