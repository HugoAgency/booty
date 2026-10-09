'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ShieldCheck, Truck, ArrowLeft, Heart } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-brand-soft via-white to-rose-50/30 pt-8 pb-16 lg:pt-16 lg:pb-24">
      {/* Decorative ambient background blur */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-200/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-80 h-80 bg-brand-200/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-right">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100/80 border border-brand-200 text-brand-700 text-xs sm:text-sm font-bold shadow-2xs">
              <Sparkles className="w-4 h-4 text-brand-600 animate-spin-slow" />
              <span>العلامة الفاخرة الأولى للعناية بالقوام والبشرة الحساسة</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-tight">
              تألقي بثقة مطلقة مع <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-rose-500 to-brand-primary">
                THE BOOTY REPUBLIC
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              مجموعتنا العلاجية والتجميلية المبتكرة صممت خصيصاً لتمنحكِ عناية فائقة، تفتيحاً متطوراً للمناطق الحساسة، تنقية عميقة للمسام، ولوشن الببتيد المكثف لشد وصقل القوام وتنعيم السيلوليت.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <a
                href="#products"
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-brand-600 via-brand-primary to-rose-600 text-white font-extrabold rounded-2xl shadow-xl shadow-rose-200 hover:shadow-2xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group text-base"
              >
                <span>تسوقي المجموعة الآن</span>
                <ArrowLeft className="w-5 h-5 rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1 transition-transform" />
              </a>

              <a
                href="#why-us"
                className="w-full sm:w-auto px-6 py-4 bg-white text-gray-700 font-bold rounded-2xl border border-rose-200 hover:bg-rose-50 hover:text-brand-600 shadow-sm transition-all text-center text-sm"
              >
                اكتشفي سر الفعالية
              </a>
            </div>

            {/* Highlights Bar */}
            <div className="grid grid-cols-3 gap-3 pt-6 border-t border-rose-100/80 max-w-lg mx-auto lg:mx-0">
              <div className="flex flex-col items-center lg:items-start text-center lg:text-right">
                <div className="flex items-center gap-1.5 text-brand-600 font-bold text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>آمن ومختبر</span>
                </div>
                <span className="text-[11px] text-gray-500">مكونات نباتية وببتيدات</span>
              </div>

              <div className="flex flex-col items-center lg:items-start text-center lg:text-right">
                <div className="flex items-center gap-1.5 text-brand-600 font-bold text-sm">
                  <Heart className="w-4 h-4 text-rose-500" />
                  <span>نتائج ملموسة</span>
                </div>
                <span className="text-[11px] text-gray-500">نضارة ونعومة فائقة</span>
              </div>

              <div className="flex flex-col items-center lg:items-start text-center lg:text-right">
                <div className="flex items-center gap-1.5 text-brand-600 font-bold text-sm">
                  <Truck className="w-4 h-4 text-blue-500" />
                  <span>شحن سريع</span>
                </div>
                <span className="text-[11px] text-gray-500">دفع عند الاستلام متاح</span>
              </div>
            </div>
          </div>

          {/* Right Product Showcase Hero Banner */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="relative bg-gradient-to-tr from-rose-100 to-white p-6 rounded-3xl border border-rose-200/80 shadow-2xl overflow-hidden">
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-white shadow-inner flex items-center justify-center p-4">
                  <Image
                    src="/images/lightening-intimate-gel.jpg"
                    alt="The Booty Republic Featured Product"
                    fill
                    className="object-contain p-4"
                    priority
                  />
                </div>

                <div className="mt-5 bg-white/90 backdrop-blur-md p-4 rounded-xl border border-rose-100 flex items-center justify-between shadow-xs">
                  <div>
                    <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
                      المنتج الأكثر طلباً
                    </span>
                    <h4 className="text-sm font-bold text-gray-900">جل تفتيح المناطق الحساسة</h4>
                    <span className="text-xs text-gray-500">Advanced Brightening Gel</span>
                  </div>
                  <div className="text-left font-black text-brand-700 text-base">
                    180.00 ر.س
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
