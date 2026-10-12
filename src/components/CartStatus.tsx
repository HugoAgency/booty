'use client';
import { useCart } from '@/context/CartContext';

export default function CartStatus() {
  const { catalogLoading, catalogError, cartNotice, refreshCatalog } = useCart();
  return <div className="text-xs space-y-2">
    {catalogLoading ? <p role="status">جارٍ مراجعة الأسعار والمخزون الحالي…</p> : catalogError ?
      <div role="alert" className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-rose-800">
        <p>تعذر التحقق من الأسعار والمخزون. أعيدي المحاولة قبل تأكيد الطلب.</p>
        <button type="button" onClick={() => void refreshCatalog()} className="mt-2 font-bold underline hover:text-brand-700">إعادة تحميل بيانات السلة</button>
      </div> : cartNotice && <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">{cartNotice}</p>}
  </div>;
}
