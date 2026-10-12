import React from 'react';
import { Award, Feather, ShieldCheck, Truck } from 'lucide-react';
import ShippingInfo from './ShippingInfo';

export default function BrandFeatures() {
  const features = [
    { icon: Feather, title: 'تفاصيل تساعدكِ على الاختيار', description: 'اقرئي وصف كل منتج ومواصفاته لاختيار ما يناسب روتينكِ.' },
    { icon: Award, title: 'أسعار بالدينار الأردني', description: 'شاهدي الأسعار الحالية، وراجعي إجمالي سلتكِ قبل تأكيد الطلب.' },
    { icon: ShieldCheck, title: 'الدفع عند الاستلام', description: 'ادفعي نقدًا عند استلام طلبكِ، بحسب المبلغ المؤكد في الطلب.' },
    { icon: Truck, title: 'التوصيل في الأردن', description: <ShippingInfo /> },
  ];

  return (
    <section id="why-us" className="py-16 bg-brand-soft/40 border-y border-rose-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold text-brand-600 bg-rose-100/80 px-3 py-1 rounded-full border border-rose-200">
            فلسفة العلامة / Brand Philosophy
          </span>
          <h2 className="text-3xl font-extrabold text-gray-900">
            لماذا تختارين THE BOOTY REPUBLIC؟
          </h2>
          <p className="text-sm text-gray-600">
            اختيار أسهل، وأسعار واضحة، ومعلومات توصيل من إعدادات المتجر الحالية.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-rose-100 shadow-xs hover:shadow-md transition-shadow space-y-3"
            >
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-brand-600 flex items-center justify-center">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-900">{f.title}</h3>
              <div className="text-xs text-gray-600 leading-relaxed">{f.description}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
