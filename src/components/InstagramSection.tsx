import Image from 'next/image';
import ProductImage from '@/components/ProductImage';
import { Instagram } from 'lucide-react';
import { ProductItem } from '@/types';
import { INSTAGRAM_ACCOUNT } from '@/lib/social';
import InstagramLink from './InstagramLink';

export default function InstagramSection({ products }: { products: ProductItem[] }) {
  const gallery = products.slice(0, 3);
  const tilts = ['-rotate-6 translate-y-4', 'rotate-3 -translate-y-3', 'rotate-6 translate-y-6'];

  return (
    <section id="instagram" aria-labelledby="instagram-title" className="bg-brand-soft py-14 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 text-sm font-bold text-brand-700">
              <Instagram className="h-4 w-4" aria-hidden="true" />
              <span>نلتقي على إنستقرام</span>
              <span aria-hidden="true" className="h-px w-10 bg-brand-300" />
            </div>
            <h2 id="instagram-title" className="text-4xl font-black leading-tight text-brand-dark sm:text-5xl">
              روتينكِ،<br /><span className="text-brand-700">بلمسة وردية.</span>
            </h2>
            <p className="max-w-md text-sm leading-7 text-gray-600 sm:text-base">
              تابعي حسابنا واكتشفي عالم THE BOOTY REPUBLIC للعناية بالبشرة والقوام في الأردن.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <InstagramLink />
              <bdi dir="ltr" className="break-all text-sm font-semibold text-brand-800">@{INSTAGRAM_ACCOUNT.handle}</bdi>
            </div>
          </div>

          <div className="relative isolate flex min-h-80 flex-col justify-between gap-10 overflow-hidden rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-100 via-brand-200 to-brand-peach p-6 sm:min-h-96 sm:p-8">
            <Instagram className="pointer-events-none absolute -left-12 -top-12 -z-10 h-64 w-64 -rotate-12 text-brand-300/50" strokeWidth={1} aria-hidden="true" />
            <div className="flex items-center gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white">
                <Image src="/images/logo.jpg" alt="" fill sizes="48px" className="object-contain" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold tracking-wide text-brand-dark">THE BOOTY REPUBLIC</p>
                <bdi dir="ltr" className="block break-all text-xs font-medium text-brand-800">@{INSTAGRAM_ACCOUNT.handle}</bdi>
              </div>
            </div>

            {gallery.length > 0 ? <div className="flex items-center justify-center gap-2 pb-6 sm:gap-4" aria-label="منتجات من متجرنا">
              {gallery.map((product, index) => <div key={product.id} className={`min-w-0 max-w-48 flex-1 rounded-xl border border-white bg-white p-1.5 shadow-md sm:p-2 ${tilts[index]}`}>
                <div className="relative aspect-square overflow-hidden rounded-lg bg-white">
                  <ProductImage src={product.image} alt={product.nameAr || product.name} fill sizes="(min-width: 1024px) 160px, (min-width: 640px) 200px, 100px" className="object-contain" />
                </div>
                <div className="mt-2 flex items-center justify-between px-1 pb-1" aria-hidden="true">
                  <span className="h-1 w-6 rounded-full bg-brand-200" />
                  <Instagram className="h-3 w-3 text-brand-600" />
                </div>
              </div>)}
            </div> : <div className="flex items-center justify-center py-6" aria-hidden="true">
              <Instagram className="h-24 w-24 text-brand-700" strokeWidth={1} />
            </div>}
            <p className="text-xs font-semibold text-brand-dark">عناية منّا. لحظات لكِ.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
