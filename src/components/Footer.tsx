import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Phone, MapPin, Instagram, ShieldCheck, Truck, RefreshCw } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-white pt-16 pb-12 border-t border-rose-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="relative w-44 h-12">
              <Image
                src="/images/logo-pink.jpg"
                alt="THE BOOTY REPUBLIC"
                fill
                className="object-contain rounded-lg"
              />
            </div>
            <p className="text-sm text-rose-100/70 leading-relaxed">
              علامة تجارية متخصصة في مستحضرات العناية الفاخرة بالبشرة والقوام، نبتكر تركيبات متقدمة تدعم جمالكِ الطبيعي وثقتكِ الدائمة.
            </p>
            <div className="flex items-center gap-3 text-rose-300">
              <span className="text-xs bg-rose-900/50 px-2.5 py-1 rounded-md border border-rose-800/40">
                منتجات أصلية 100%
              </span>
              <span className="text-xs bg-rose-900/50 px-2.5 py-1 rounded-md border border-rose-800/40">
                مصرحة ومعتمدة
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-white tracking-wide border-b border-rose-900/50 pb-2">
              روابط سريعة / Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-rose-100/70">
              <li>
                <Link href="/" className="hover:text-brand-300 transition-colors">
                  الرئيسية / Home
                </Link>
              </li>
              <li>
                <Link href="/#products" className="hover:text-brand-300 transition-colors">
                  جميع المنتجات / All Products
                </Link>
              </li>
              <li>
                <Link href="/#why-us" className="hover:text-brand-300 transition-colors">
                  سر الفعالية والتركيبة / About Formulas
                </Link>
              </li>
              <li>
                <Link href="/#faq" className="hover:text-brand-300 transition-colors">
                  الأسئلة المتكررة / FAQs
                </Link>
              </li>
              <li>
                <Link href="/admin/login" className="hover:text-brand-300 transition-colors">
                  بوابة إدارة المتجر / Admin Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies & Guarantees */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-white tracking-wide border-b border-rose-900/50 pb-2">
              الضمان والتوصيل / Delivery & Policy
            </h4>
            <ul className="space-y-3 text-xs text-rose-100/80">
              <li className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-brand-primary shrink-0 mt-0.5" />
                <span>توصيل مجاني لجميع مناطق ومدن المملكة خلال 2 - 4 أيام عمل.</span>
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>دفع آمن عند الاستلام، وفحص الشحنة قبل الاستلام.</span>
              </li>
              <li className="flex items-start gap-2">
                <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <span>ضمان الجودة مع سياسة استبدال مرنة وسريعة.</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-3">
            <h4 className="text-base font-bold text-white tracking-wide border-b border-rose-900/50 pb-2">
              خدمة العملاء / Customer Support
            </h4>
            <div className="space-y-2 text-sm text-rose-100/70">
              <p className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-primary" />
                <span>المملكة العربية السعودية، الرياض</span>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-primary" />
                <span dir="ltr">+966 50 123 4567</span>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-primary" />
                <span>care@thebootyrepublic.com</span>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-rose-900/40 flex flex-col sm:flex-row items-center justify-between text-xs text-rose-200/50 gap-4">
          <p>© {new Date().getFullYear()} THE BOOTY REPUBLIC. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-4">
            <span>الدفع عند الاستلام متاح</span>
            <span>•</span>
            <span>الأسعار تشمل ضريبة القيمة المضافة</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
