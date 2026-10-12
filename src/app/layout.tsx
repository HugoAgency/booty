import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import CartDrawer from '@/components/CartDrawer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { ShippingProvider } from '@/context/ShippingContext';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://thebootyrepublic.vercel.app'),
  title: 'THE BOOTY REPUBLIC | العلامة الفاخرة للعناية بالقوام والبشرة',
  description: 'المتجر الرسمي لعلامة THE BOOTY REPUBLIC في الأردن للعناية بالبشرة والقوام. اطلعي على المنتجات والأسعار ومعلومات التوصيل الحالية.',
  icons: {
    icon: '/images/logo.jpg',
  },
  openGraph: {
    title: 'THE BOOTY REPUBLIC | فاخرة ومصممة لجمالكِ',
    description: 'اكتشفي منتجات العناية بالبشرة والقوام في الأردن، وراجعي تفاصيلها قبل الطلب والدفع عند الاستلام.',
    images: ['/images/logo.jpg'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col font-sans">
        <ShippingProvider><CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider></ShippingProvider>
      </body>
    </html>
  );
}
