'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
  MapPin,
  Clock,
  Coins,
  ShieldAlert,
  Calculator,
} from 'lucide-react';
import { ShippingRules, calculateShippingFee } from '@/lib/shipping-rules';
import { formatPrice } from '@/lib/currency';
import { ShippingConfigSchema } from '@/lib/validations';

interface AdminShippingTabProps {
  userRole?: string;
}

export default function AdminShippingTab({ userRole }: AdminShippingTabProps) {
  const isReadOnly = userRole === 'SUPPORT';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invalidField, setInvalidField] = useState<string | null>(null);

  // Form State
  const [isFreeShippingPromo, setIsFreeShippingPromo] = useState(false);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(40);
  const [standardFee, setStandardFee] = useState(3.0);
  const [ammanFee, setAmmanFee] = useState(2.0);
  const [outerGovernoratesFee, setOuterGovernoratesFee] = useState(3.5);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState('1 - 3 أيام عمل');

  // Simulation State
  const [simCity, setSimCity] = useState('عمّان (العاصمة)');
  const [simSubtotal, setSimSubtotal] = useState(35);

  const fetchRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/settings/shipping');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل جلب إعدادات التوصيل');
      }

      const r: ShippingRules = data.rules;
      setIsFreeShippingPromo(r.isFreeShippingPromo);
      setFreeShippingThreshold(r.freeShippingThreshold);
      setStandardFee(r.standardFee);
      setAmmanFee(r.ammanFee);
      setOuterGovernoratesFee(r.outerGovernoratesFee);
      setEstimatedDeliveryTime(r.estimatedDeliveryTime || '1 - 3 أيام عمل');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly || saving) return;

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const payload: ShippingRules = {
        isFreeShippingPromo,
        freeShippingThreshold: Number(freeShippingThreshold),
        standardFee: Number(standardFee),
        ammanFee: Number(ammanFee),
        outerGovernoratesFee: Number(outerGovernoratesFee),
        estimatedDeliveryTime: estimatedDeliveryTime.trim(),
      };
      const parsed = ShippingConfigSchema.safeParse(payload);
      if (!parsed.success) {
        const issue = parsed.error.issues[0];
        const field = String(issue.path[0]);
        setInvalidField(field);
        setError(issue.message.split('/')[0].trim());
        document.getElementById(`shipping-${field}`)?.focus();
        return;
      }
      setInvalidField(null);

      const res = await fetch('/api/admin/settings/shipping', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل حفظ الإعدادات');
      }

      setMessage('تم حفظ وتحديث قواعد ورسوم التوصيل بنجاح في متجر الأردن');
      window.dispatchEvent(new Event('shipping-rules-updated'));
      setTimeout(() => setMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  // Live simulation evaluation
  const liveRules: ShippingRules = {
    isFreeShippingPromo,
    freeShippingThreshold: Number(freeShippingThreshold),
    standardFee: Number(standardFee),
    ammanFee: Number(ammanFee),
    outerGovernoratesFee: Number(outerGovernoratesFee),
    estimatedDeliveryTime,
  };
  const simResult = calculateShippingFee(simSubtotal, simCity, liveRules);

  return (
    <div className="space-y-6">
      {/* Messages */}
      {message && (
        <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div id="shipping-error" role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Truck className="w-5 h-5 text-brand-600" />
            <span>إدارة وتحديد رسوم التوصيل (المملكة الأردنية الهاشمية)</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            تحديد شروط التوصيل المجاني، رسوم الشحن حسب المحافظة، والعروض الترويجية
          </p>
        </div>

        <button
          onClick={fetchRules}
          className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
          title="تحديث"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Settings Form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-6">
          <form noValidate onSubmit={handleSave} className="space-y-6">
            {/* Global Promotion Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isFreeShippingPromo
                  ? 'bg-emerald-50/70 border-emerald-300'
                  : 'bg-gray-50/70 border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-gray-900">
                      توصيل مجاني شامل (عرض ترويجي لجميع الطلبات)
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    عند تفعيل هذا الخيار، سيتم تطبيق توصيل مجاني (0.00 د.أ) لجميع المحافظات بغض النظر عن قيمة السلة.
                  </p>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
                  <input
                    type="checkbox"
                    aria-label="توصيل مجاني شامل"
                    disabled={isReadOnly}
                    checked={isFreeShippingPromo}
                    onChange={(e) => setIsFreeShippingPromo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            </div>

            {/* Threshold & Base Rates */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-2">
                <Coins className="w-4 h-4 text-brand-600" />
                <span>قواعد الرسوم والحد الأدنى للتوصيل المجاني</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="shipping-freeShippingThreshold" className="block text-xs font-bold text-gray-700 mb-1">
                    الحد الأدنى للطلب للتوصيل المجاني (د.أ)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    disabled={isReadOnly}
                    required
                    id="shipping-freeShippingThreshold"
                    aria-invalid={invalidField === 'freeShippingThreshold'}
                    aria-describedby={invalidField === 'freeShippingThreshold' ? 'shipping-error' : undefined}
                    value={freeShippingThreshold}
                    onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    الطلبات بقيمة {formatPrice(freeShippingThreshold)} أو أكثر تصبح مجانية تلقائياً.
                  </p>
                </div>

                <div>
                  <label htmlFor="shipping-ammanFee" className="block text-xs font-bold text-gray-700 mb-1">
                    رسوم التوصيل داخل عمّان (د.أ)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    disabled={isReadOnly}
                    required
                    id="shipping-ammanFee"
                    aria-invalid={invalidField === 'ammanFee'}
                    aria-describedby={invalidField === 'ammanFee' ? 'shipping-error' : undefined}
                    value={ammanFee}
                    onChange={(e) => setAmmanFee(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    تطبق على العاصمة عمّان في حال كان الطلب أقل من الحد الأدنى.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="shipping-outerGovernoratesFee" className="block text-xs font-bold text-gray-700 mb-1">
                    رسوم التوصيل لباقي المحافظات (د.أ)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    disabled={isReadOnly}
                    required
                    id="shipping-outerGovernoratesFee"
                    aria-invalid={invalidField === 'outerGovernoratesFee'}
                    aria-describedby={invalidField === 'outerGovernoratesFee' ? 'shipping-error' : undefined}
                    value={outerGovernoratesFee}
                    onChange={(e) => setOuterGovernoratesFee(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    إربد، الزرقاء، العقبة، السلط، الكرك، معان، المفرق، عجلون، جرش، الطفيلة، مادبا.
                  </p>
                </div>

                <div>
                  <label htmlFor="shipping-standardFee" className="block text-xs font-bold text-gray-700 mb-1">
                    الرسوم الافتراضية العامة (د.أ)
                  </label>
                  <input
                    type="number"
                    step="0.25"
                    min="0"
                    disabled={isReadOnly}
                    required
                    id="shipping-standardFee"
                    aria-invalid={invalidField === 'standardFee'}
                    aria-describedby={invalidField === 'standardFee' ? 'shipping-error' : undefined}
                    value={standardFee}
                    onChange={(e) => setStandardFee(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    تُستخدم كقيمة احتياطية في حال تعذر تحديد المحافظة.
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="shipping-estimatedDeliveryTime" className="block text-xs font-bold text-gray-700 mb-1">
                  مدة التوصيل المعروضة للزبائن
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    disabled={isReadOnly}
                    required
                    id="shipping-estimatedDeliveryTime"
                    aria-invalid={invalidField === 'estimatedDeliveryTime'}
                    aria-describedby={invalidField === 'estimatedDeliveryTime' ? 'shipping-error' : undefined}
                    value={estimatedDeliveryTime}
                    onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
                    placeholder="مثال: 1 - 3 أيام عمل"
                    className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            {!isReadOnly && (
              <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50"
                >
                  {saving ? 'جاري الحفظ...' : 'حفظ إعدادات التوصيل'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Live Simulator & Overview Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
            <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <Calculator className="w-4 h-4 text-brand-600" />
              <span>محاكي حساب رسوم التوصيل المباشر</span>
            </h4>

            <p className="text-xs text-gray-500">
              اختبر كيف سيتم احتساب رسوم التوصيل والمبلغ الإجمالي في صفحة الدفع بناءً على الإعدادات الحالية:
            </p>

            <div className="space-y-3 pt-1 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">المحافظة / المدينة التجريبية:</label>
                <select
                  value={simCity}
                  onChange={(e) => setSimCity(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
                >
                  <option value="عمّان (العاصمة)">عمّان (العاصمة)</option>
                  <option value="إربد">إربد</option>
                  <option value="الزرقاء">الزرقاء</option>
                  <option value="العقبة">العقبة</option>
                  <option value="السلط / البلقاء">السلط / البلقاء</option>
                  <option value="الكرك">الكرك</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-gray-700 mb-1">
                  قيمة سلة المشتريات التجريبية: <span className="font-mono text-brand-600 font-bold">{formatPrice(simSubtotal)}</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="80"
                  step="5"
                  value={simSubtotal}
                  onChange={(e) => setSimSubtotal(Number(e.target.value))}
                  className="w-full accent-brand-600"
                />
              </div>

              {/* Simulation Result Box */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-2 mt-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">المجموع الفرعي:</span>
                  <span className="font-bold text-gray-800">{formatPrice(simSubtotal)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-gray-600">رسوم التوصيل المحتسبة:</span>
                  <span
                    className={`font-bold ${
                      simResult.isFree ? 'text-emerald-600' : 'text-gray-900'
                    }`}
                  >
                    {simResult.isFree ? 'مجاناً (0.00 د.أ)' : formatPrice(simResult.fee)}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-sm font-black text-gray-900">
                  <span>المبلغ الإجمالي المستحق:</span>
                  <span className="text-brand-600">
                    {formatPrice(simSubtotal + simResult.fee)}
                  </span>
                </div>

                <div className="pt-2 text-[11px] text-gray-500">
                  {simResult.reason === 'PROMO' && (
                    <p className="text-emerald-700 font-bold">🎉 مشمول بالعرض الترويجي للتوصيل المجاني الشامل.</p>
                  )}
                  {simResult.reason === 'THRESHOLD' && (
                    <p className="text-emerald-700 font-bold">
                      ✨ مؤهل للتوصيل المجاني لتجاوز الحد الأدنى ({formatPrice(freeShippingThreshold)}).
                    </p>
                  )}
                  {simResult.reason === 'CITY_TIER' && !simResult.isFree && (
                    <p className="text-amber-700">
                      💡 يلزم إضافة <span className="font-bold font-mono">{formatPrice(simResult.amountNeededForFreeShipping)}</span> أخرى للتأهل للتوصيل المجاني.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Logistics Advice Note */}
          <div className="p-4 rounded-2xl bg-brand-soft/50 border border-rose-100 text-xs text-gray-700 space-y-2">
            <h5 className="font-bold text-brand-800 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-600" />
              <span>ملاحظة إدارة التوصيل لمتجر الأردن</span>
            </h5>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              تتم مزامنة رسوم التوصيل المحتسبة مع قاعدة البيانات فور إتمام الطلب، ويتم تضمين تفاصيل رسوم الشحن والعنوان بالكامل عند تصدير شيت Excel لشركات الشحن والتوصيل المحلية (مثل أرامكس، بوسطة، أو المندوب المباشر).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
