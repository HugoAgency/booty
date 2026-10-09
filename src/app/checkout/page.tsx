'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/lib/currency';
import {
  ShieldCheck,
  Truck,
  ShoppingBag,
  CreditCard,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, totalCount, clearCart } = useCart();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [city, setCity] = useState('عمّان (العاصمة)');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Execution state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string>('');

  useEffect(() => {
    setIdempotencyKey(`checkout_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  }, []);

  const jordanCitiesList = [
    'عمّان (العاصمة)',
    'إربد',
    'الزرقاء',
    'العقبة',
    'السلط / البلقاء',
    'مادبا',
    'جرش',
    'عجلون',
    'المفرق',
    'الكرك',
    'الطفيلة',
    'معان',
    'لواء الرمثا',
    'الأغوار / الشونة',
    'منطقة أخرى في الأردن',
  ];

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim() || customerName.trim().length < 2) {
      setErrorMessage('يرجى إدخال اسم المستلم بشكل صحيح (حرفين على الأقل)');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 8) {
      setErrorMessage('يرجى إدخال رقم هاتف أردني صالح للتواصل والتوصيل');
      return;
    }
    if (!address.trim() || address.trim().length < 5) {
      setErrorMessage('يرجى كتابة عنوان التوصيل بالتفصيل (المنطقة، الشارع، المعالم القريبة)');
      return;
    }
    if (items.length === 0) {
      setErrorMessage('سلة التسوق فارغة، يرجى إضافة منتجات أولاً');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail.trim() || undefined,
        city: city.trim(),
        address: address.trim(),
        notes: notes.trim() || undefined,
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
        })),
        idempotencyKey,
      };

      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشلت معالجة الطلب، يرجى مراجعة البيانات والمحاولة مجدداً');
      }

      clearCart();
      router.push(`/checkout/success?orderNumber=${encodeURIComponent(data.orderNumber)}`);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'حدث خطأ غير متوقع أثناء إرسال الطلب');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-rose-50 flex items-center justify-center text-brand-600">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">سلة المشتريات فارغة</h2>
        <p className="text-sm text-gray-500 max-w-md">
          لم تقومي بإضافة أي منتجات للسلة بعد. استكشفي تشكيلتنا الفاخرة في الأردن وأضيفي ما يناسبكِ.
        </p>
        <Link
          href="/#products"
          className="mt-2 px-6 py-3 bg-gradient-to-r from-brand-600 to-rose-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition"
        >
          العودة للمتجر والتسوق
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-rose-50/30 py-10 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 space-y-1">
          <Link
            href="/#products"
            className="inline-flex items-center gap-1.5 text-xs text-brand-600 font-bold hover:underline mb-2"
          >
            <ArrowRight className="w-4 h-4 rtl:rotate-0 rotate-180" />
            <span>العودة للتسوق</span>
          </Link>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
              إتمام الطلب في الأردن / Checkout
            </h1>
            <span className="text-base">🇯🇴</span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500">
            توصيل مباشر لكافة محافظات المملكة الأردنية الهاشمية والدفع نقداً عند الاستلام
          </p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Customer Details Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-3xl border border-rose-100 shadow-sm space-y-6">
            <form onSubmit={handleSubmitOrder} className="space-y-5">
              <div className="border-b border-rose-100 pb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-brand-soft text-brand-600 flex items-center justify-center text-xs font-black">
                    1
                  </span>
                  <span>بيانات المستلم وعنوان التوصيل (الأردن)</span>
                </h2>
              </div>

              {/* Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    الاسم الكامل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="مثال: رنا خالد المجالي"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    رقم الهاتف / الخلوي <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+962 7X XXX XXXX"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm outline-none transition text-right"
                  />
                </div>
              </div>

              {/* Email & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    البريد الإلكتروني <span className="text-gray-400 font-normal">(اختياري)</span>
                  </label>
                  <input
                    type="email"
                    dir="ltr"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="rana@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm outline-none transition text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    المحافظة / المدينة <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm outline-none transition bg-white"
                  >
                    {jordanCitiesList.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  عنوان التوصيل بالتفصيل <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="اسم الحي أو المنطقة، الشارع، رقم البناية، المعالم القريبة..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm outline-none transition"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  ملاحظات إضافية للتوصيل <span className="text-gray-400 font-normal">(اختياري)</span>
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: يرجى الاتصال قبل موعد الوصول للتنسيق"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm outline-none transition"
                />
              </div>

              {/* Payment selection */}
              <div className="pt-4 border-t border-rose-100 space-y-3">
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-brand-soft text-brand-600 flex items-center justify-center text-xs font-black">
                    2
                  </span>
                  <span>طريقة الدفع (الدينار الأردني)</span>
                </h3>

                <div className="p-4 rounded-2xl border-2 border-brand-500 bg-brand-soft/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-4 border-brand-600 bg-white" />
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">الدفع عند الاستلام بالدينار الأردني (Cash on Delivery)</h4>
                      <p className="text-xs text-gray-500">ادفعي نقداً لمندوب التوصيل عند استلام الطلب وفحصه</p>
                    </div>
                  </div>
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                </div>
              </div>

              {/* Submit Order Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-base text-white flex items-center justify-center gap-2 shadow-xl transition-all ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-wait'
                      : 'bg-gradient-to-r from-brand-600 via-brand-primary to-rose-600 hover:opacity-95 shadow-rose-200'
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>جاري إرسال الطلب وحفظه...</span>
                    </div>
                  ) : (
                    <>
                      <span>تأكيد وإرسال الطلب ({formatPrice(subtotal)})</span>
                      <CheckCircle2 className="w-5 h-5" />
                    </>
                  )}
                </button>
                <p className="text-center text-[11px] text-gray-400 mt-2">
                  🔒 بياناتكِ آمنة ومشفرة بالكامل - خدمة التوصيل متوفرة لكافة محافظات الأردن
                </p>
              </div>
            </form>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-rose-100 shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-gray-900 border-b border-rose-100 pb-3 flex items-center justify-between">
              <span>ملخص الطلب</span>
              <span className="text-xs text-gray-500 font-normal">({totalCount} منتجات)</span>
            </h2>

            <div className="divide-y divide-rose-50 space-y-3 max-h-80 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.productId} className="pt-3 first:pt-0 flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl bg-rose-50 border border-rose-100 shrink-0 overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.nameAr || item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 truncate">
                      {item.nameAr || item.name}
                    </h4>
                    <p className="text-[11px] text-gray-400 font-mono">{item.sku}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      الكمية: {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-gray-900">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-rose-100 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>المجموع الفرعي:</span>
                <span className="font-semibold text-gray-800">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-medium">
                <span>رسوم التوصيل بالأردن:</span>
                <span>مجاناً (عرض ترويجي)</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-gray-900 pt-3 border-t border-rose-100">
                <span>المبلغ الإجمالي المستحق:</span>
                <span className="text-brand-600 text-lg">{formatPrice(subtotal)}</span>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-100 text-xs text-gray-600 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-brand-700">
                <Truck className="w-4 h-4" />
                <span>توصيل سريع لكافة المحافظات الأردنية</span>
              </div>
              <p className="text-[11px] text-gray-500">
                سيصلكِ اتصال من مندوب التوصيل لتأكيد الموعد الدقيق فور خروج الشحنة.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
