import Link from 'next/link';

export default function NotFound() {
  return <div className="mx-auto max-w-xl px-6 py-20 text-center space-y-5">
    <h1 className="text-2xl font-bold text-brand-dark">الصفحة أو الطلب غير موجود</h1>
    <p className="text-gray-600">تحققي من الرابط. يمكنكِ العودة إلى المتجر للاطلاع على المنتجات المتاحة.</p>
    <Link href="/" className="inline-flex min-h-11 items-center rounded-xl bg-brand-700 px-6 py-3 font-bold text-white hover:bg-brand-800">العودة إلى المتجر</Link>
  </div>;
}
