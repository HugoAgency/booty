'use client';

export default function StoreError({ reset }: { reset: () => void }) {
  return <section className="mx-auto max-w-xl px-4 py-16 text-center space-y-4" role="alert">
    <h1 className="text-xl font-bold text-brand-dark">تعذر تحميل بيانات المتجر</h1>
    <p className="text-sm text-gray-600">لم نتمكن من تحميل المنتجات والأسعار الحالية. أعيدي المحاولة بعد قليل.</p>
    <button type="button" onClick={reset} className="rounded-xl bg-brand-600 px-5 py-3 font-bold text-white hover:bg-brand-700">إعادة المحاولة</button>
  </section>;
}
