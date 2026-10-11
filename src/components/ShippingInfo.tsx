'use client';

import { useShipping } from '@/context/ShippingContext';
import { getShippingMessage, getShippingRatesMessage } from '@/lib/shipping-rules';

export default function ShippingInfo({ subtotal, showFees = false, showTime = true, className = '' }: {
  subtotal?: number; showFees?: boolean; showTime?: boolean; className?: string;
}) {
  const { rules, loading, error, refresh } = useShipping();
  return <div className={`min-h-5 ${className}`} aria-busy={loading}>
    {loading ? <span role="status">جارٍ تحديث بيانات التوصيل…</span> : error || !rules ?
      <div role="alert" className="flex flex-wrap items-center gap-2">
        <span>تعذر تحميل بيانات التوصيل.</span>
        <button type="button" onClick={() => void refresh()} className="underline underline-offset-4 hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2">إعادة المحاولة</button>
      </div> : <>
        <p>{getShippingMessage(rules, subtotal)}</p>
        {showFees && getShippingRatesMessage(rules) && <p>{getShippingRatesMessage(rules)}</p>}
        {subtotal !== undefined && !rules.isFreeShippingPromo && subtotal < rules.freeShippingThreshold &&
          <p>تُحدَّد الرسوم النهائية حسب المدينة عند إتمام الطلب.</p>}
        {showTime && <p>مدة التوصيل: {rules.estimatedDeliveryTime}</p>}
      </>}
  </div>;
}
