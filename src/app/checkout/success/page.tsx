import React from 'react';
import Link from 'next/link';
import { CheckCircle2, PackageCheck, ShoppingBag, PhoneCall, XCircle } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: { orderNumber?: string };
}) {
  const orderNumber = searchParams.orderNumber;
  if (typeof orderNumber !== 'string' || !orderNumber.trim() || orderNumber.length > 80) notFound();
  const order = await prisma.order.findUnique({ where: { orderNumber }, select: { orderNumber: true, status: true } });
  if (!order) notFound();
  const titles = { NEW: 'تم استلام طلبكِ بنجاح!', PROCESSING: 'طلبكِ قيد المعالجة', COMPLETED: 'طلبكِ مكتمل', CANCELLED: 'هذا الطلب ملغي' };
  const StateIcon = order.status === 'CANCELLED' ? XCircle : CheckCircle2;

  return (
    <div className="bg-rose-50/30 py-16 min-h-[75vh] flex items-center justify-center">
      <div className="max-w-xl mx-auto px-4 w-full">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-rose-100 shadow-xl text-center space-y-6">
          {/* Animated checkmark icon */}
          <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center mx-auto ${order.status === 'CANCELLED' ? 'bg-rose-50 border-rose-100 text-rose-700' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
            <StateIcon className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
              {titles[order.status]}
            </h1>
            <p className="text-sm text-gray-500">
              طلبكِ لدى <span className="font-bold text-brand-600">THE BOOTY REPUBLIC</span>. يمكنكِ التواصل معنا باستخدام الرقم المرجعي أدناه.
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
              <span>احتفظي بالرقم المرجعي لمتابعة هذا الطلب.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <PhoneCall className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
              <span>{order.status === 'CANCELLED' ? 'لا يجري تجهيز هذا الطلب لأنه ملغي.' : 'للاستفسار عن حالة الطلب، تواصلي مع خدمة العملاء.'}</span>
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
