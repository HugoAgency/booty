'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import WhatsAppIcon from './WhatsAppIcon';
import Modal from './ui/Modal';
import type { CheckoutSuccessResponse } from '@/types';

const instructions = 'عند الضغط على «المتابعة إلى واتساب»، ستفتح محادثة تحتوي على جميع بيانات طلبكِ. يرجى مراجعة الرسالة ثم الضغط على زر «إرسال» داخل واتساب لإرسالها إلينا. فتح المحادثة وحده لا يرسل الرسالة.';
const reassurance = 'طلبكِ محفوظ في المنصة حتى لو أغلقتِ واتساب دون إرسال الرسالة.';

export default function CheckoutOrderConfirmation({
  order,
}: {
  order: Pick<CheckoutSuccessResponse, 'orderNumber' | 'whatsappUrl'>;
}) {
  const [noticeOpen, setNoticeOpen] = useState(true);
  const reopenRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!noticeOpen) reopenRef.current?.focus();
  }, [noticeOpen]);

  const buttonClass = 'w-full flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 font-bold text-white bg-emerald-700 hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-700';

  return (
    <div dir="rtl" className="bg-rose-50/30 py-12 min-h-[75vh] flex items-center justify-center px-4">
      <section aria-labelledby="saved-order-title" className="w-full max-w-xl rounded-3xl border border-rose-100 bg-white p-6 sm:p-10 text-center shadow-xl space-y-6">
        <CheckCircle2 aria-hidden="true" className="w-16 h-16 mx-auto text-emerald-600" />
        <h1 id="saved-order-title" className="text-2xl font-black text-gray-900">تم حفظ طلبكِ بنجاح!</h1>
        <p className="text-gray-600">رقم الطلب: <b dir="ltr" className="font-mono text-brand-700">{order.orderNumber}</b></p>
        <p className="text-sm leading-7 text-gray-600">يرجى فتح واتساب ومراجعة الرسالة الجاهزة، ثم الضغط على زر «إرسال» داخل واتساب لإرسال بيانات طلبكِ إلينا.</p>
        <p className="text-sm text-gray-600">{reassurance}</p>
        <a ref={reopenRef} href={order.whatsappUrl} className={buttonClass}>
          <WhatsAppIcon className="w-5 h-5 shrink-0" />
          فتح واتساب
        </a>
        <Link href="/" className="inline-block font-bold text-brand-700 underline underline-offset-4">العودة للمتجر</Link>
      </section>

      {noticeOpen && <Modal
        title="تم حفظ طلبكِ بنجاح — تبقّت خطوة لإرسال رسالة واتساب"
        descriptionId="whatsapp-notice-instructions whatsapp-notice-reassurance"
        onClose={() => setNoticeOpen(false)}
      >
        <div className="space-y-5">
          <WhatsAppIcon className="w-10 h-10 text-emerald-700" />
          <p className="text-sm text-gray-600">رقم الطلب: <b dir="ltr" className="font-mono text-brand-700">{order.orderNumber}</b></p>
          <p id="whatsapp-notice-instructions" className="text-sm leading-7 text-gray-700">{instructions}</p>
          <p id="whatsapp-notice-reassurance" className="rounded-xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">{reassurance}</p>
          <a data-autofocus href={order.whatsappUrl} className={buttonClass}>
            <WhatsAppIcon className="w-5 h-5 shrink-0" />
            المتابعة إلى واتساب
          </a>
          <button type="button" onClick={() => setNoticeOpen(false)} className="w-full rounded-xl border border-gray-300 px-5 py-3 font-bold text-gray-700 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600">البقاء في الموقع</button>
        </div>
      </Modal>}
    </div>
  );
}
