import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import CartDrawer from '@/components/CartDrawer';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'THE BOOTY REPUBLIC | العلامة الفاخرة للعناية بالقوام والبشرة',
  description: 'المتجر الرسمي لعلامة THE BOOTY REPUBLIC. مستحضرات متقدمة لتفتيح المناطق الحساسة، تنقية البشرة، وشد وصقل القوام بالببتيدات.',
  icons: {
    icon: '/images/logo.jpg',
  },
  openGraph: {
    title: 'THE BOOTY REPUBLIC | فاخرة ومصممة لجمالكِ',
    description: 'تسوقي أفضل تركيبات العناية المتطورة بالقوام والمناطق الحساسة مع شحن سريع ودفع عند الاستلام.',
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
        <CartProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
