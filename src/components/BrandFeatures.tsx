import React from 'react';
import { Award, Feather, ShieldCheck, HeartPulse, CheckCircle2 } from 'lucide-react';

export default function BrandFeatures() {
  const features = [
    {
      icon: Feather,
      title: 'تركيبات فائقة اللطف والأمان',
      description: 'خالية من المواد الضارة والبارابين والكبريتات القاسية، آمنة ومختبرة للمناطق الأكثر حساسية.',
    },
    {
      icon: Award,
      title: 'مركبات ببتيدات متطورة',
      description: 'مدعمة بأحدث تقنيات الببتيدات النشطة التي تحفز مرونة الجلد وتساعد في تقليل مظهر السيلوليت.',
    },
    {
      icon: ShieldCheck,
      title: 'نتائج مثبتة وملموسة',
      description: 'تركيبات مصممة بتركيزات فعالة تمنحكِ توحيداً حقيقياً ونقاءً ونعومة حريرية تدوم.',
    },
    {
      icon: HeartPulse,
      title: 'ثقة وأنوثة متجددة',
      description: 'صُممت كل قطرة لتمنحكِ شعوراً بالفخامة والراحة التامة في كل تفاصيل روتينكِ اليومي.',
    },
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
            نجمع بين العلم الحديث والمستخلصات الفاخرة لتقديم حلول متخصصة تتجاوز التوقعات.
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
              <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
