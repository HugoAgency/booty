'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import ShippingInfo from './ShippingInfo';

export default function FaqSection() {
  const faqs = [
    {
      q: 'متى تظهر نتائج استخدام المنتجات؟',
      a: 'تلاحظ أغلب العميلات تحسناً ملحوظاً في نعومة ونضارة البشرة خلال الأسبوع الأول من الاستخدام المنتظم، بينما تظهر النتائج المتكاملة في التفتيح وشد القوام وتنعيم السيلوليت خلال 3 إلى 6 أسابيع.',
    },
    {
      q: 'هل جل التفتيح آمن للاستخدام على المناطق الحساسة؟',
      a: 'نعم تماماً. تم اختبار جل Lightening Intimate Gel بعناية ليكون خالياً من المواد الكيميائية القاسية والمسببة للتهيج، وهو غني بمهدئات ومستخلصات نباتية طبيعية تمنحه أقصى درجات الأمان.',
    },
    {
      q: 'ما هي طرق الدفع المتاحة وكيف تتم عملية الشحن؟',
      a: <><p>ندعم الدفع عند الاستلام والتوصيل لجميع محافظات الأردن.</p><ShippingInfo showFees /></>,
    },
    {
      q: 'كيف يمكنني تتبع طلبي بعد إتمامه؟',
      a: 'بمجرد تأكيد الطلب، ستحصلين على رقم مرجعي فريد للطلب (Reference Number)، وسيتواصل معكِ مندوب التوصيل عبر الهاتف أو رسالة نصية لتنسيق موعد الاستلام الدقيق.',
    },
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <section id="faq" className="py-16 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-brand-600 text-xs font-bold border border-rose-100">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>الأسئلة الشائعة / FAQ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            كل ما تودين معرفته
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="border border-rose-100 rounded-2xl overflow-hidden bg-rose-50/20 transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-right flex items-center justify-between gap-4 font-bold text-gray-800 text-sm sm:text-base hover:text-brand-600 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-brand-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-rose-100/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
