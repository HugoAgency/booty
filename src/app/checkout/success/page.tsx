import React from 'react';
import Link from 'next/link';
import { CheckCircle2, PackageCheck, ShoppingBag, PhoneCall, ArrowLeft } from 'lucide-react';

export default function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { orderNumber?: string };
}) {
  const orderNumber = searchParams.orderNumber || 'TBR-PENDING';

  return (
    <div className="bg-rose-50/30 py-16 min-h-[75vh] flex items-center justify-center">
      <div className="max-w-xl mx-auto px-4 w-full">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-rose-100 shadow-xl text-center space-y-6">
          {/* Animated checkmark icon */}
          <div className="w-20 h-20 rounded-full bg-emerald-50 border-4 border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
              تم استلام طلبكِ بنجاح!
            </h1>
            <p className="text-sm text-gray-500">
              شكراً لتسوقكِ مع <span className="font-bold text-brand-600">THE BOOTY REPUBLIC</span>. نحن نجهز شحنتكِ بحب وعناية فائقة.
            </p>
          </div>

          {/* Order reference banner */}
          <div className="p-4 bg-brand-soft/70 rounded-2xl border border-brand-200 space-y-1">
            <span className="text-xs text-gray-500 font-medium">الرقم المرجعي للطلب / Order Reference:</span>
            <div className="text-xl sm:text-2xl font-black text-brand-700 font-mono tracking-wider">
              {orderNumber}
            </div>
            <p className="text-[11px] text-gray-400">
              يرجى الاحتفاظ بهذا الرقم لمتابعة حالة الشحنة مع المندوب
            </p>
          </div>

          {/* Reassurance cards */}
          <div className="space-y-3 text-right bg-gray-50/70 p-4 rounded-xl border border-gray-100 text-xs sm:text-sm text-gray-600">
            <div className="flex items-start gap-2.5">
              <PackageCheck className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
              <span>تم تسجيل طلبكِ في قاعدة البيانات وتجهيز الفاتورة للتجهيز والتغليف.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <PhoneCall className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>سيتواصل معكِ مندوب الشحن هاتفياً أو عبر واتساب لتأكيد موعد التسليم الدقيق.</span>
            </div>
          </div>

          {/* Return button */}
          <div className="pt-2">
            <Link
              href="/"
              className="w-full py-3.5 px-6 bg-gradient-to-r from-brand-600 via-brand-primary to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-200 hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>العودة للصفحة الرئيسية والتسوق</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
