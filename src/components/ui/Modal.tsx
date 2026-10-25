'use client';

import { useEffect, useRef, useId, ReactNode } from 'react';

/** Native dialog owns focus trapping, background inertness and focus restoration. */
export default function Modal({ title, children, onClose, busy = false, descriptionId }: {
  title: string; children: ReactNode; onClose: () => void; busy?: boolean; descriptionId?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    dialog?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => dialog?.close();
  }, []);
  return (
    <dialog ref={ref} aria-labelledby={titleId} aria-describedby={descriptionId} onCancel={event => {
      event.preventDefault();
      if (!busy) onClose();
    }} className="w-[calc(100%_-_2rem)] max-w-2xl max-h-[90dvh] rounded-3xl border border-gray-200 p-0 shadow-2xl backdrop:bg-black/50">
      <div className="p-5 sm:p-6 space-y-5" dir="rtl">
        <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <h2 id={titleId} className="text-lg font-bold text-gray-900">{title}</h2>
          <button type="button" disabled={busy} onClick={onClose} aria-label="إغلاق" className="rounded-full p-2 text-gray-500 hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand-600 disabled:opacity-50">✕</button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
