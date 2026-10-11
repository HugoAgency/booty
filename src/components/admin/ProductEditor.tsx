'use client';

import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { ProductItem } from '@/types';
import { ProductInputSchema } from '@/lib/validations';
import { getAvailableStock } from '@/lib/bundles';
import { formatPrice } from '@/lib/currency';
import Modal from '@/components/ui/Modal';

type ProductInput = z.infer<typeof ProductInputSchema>;

export default function ProductEditor({ product, products, onClose, onSaved }: {
  product: ProductItem | null; products: ProductItem[];
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<ProductInput>(() => ({
    name: product?.name || '', nameAr: product?.nameAr || '',
    description: product?.description || '', descriptionAr: product?.descriptionAr || '',
    subtitle: product?.subtitle || '', subtitleAr: product?.subtitleAr || '',
    price: product?.price || 0, compareAtPrice: product?.compareAtPrice || null,
    sku: product?.sku || '', image: product?.image || '/images/lightening-intimate-gel.jpg',
    size: product?.size || '', category: product?.category || 'Body Care',
    categoryAr: product?.categoryAr || 'عناية الجسم', stock: product?.stock || 0,
    isActive: product?.isActive ?? true, isFeatured: product?.isFeatured ?? false,
    isBundle: product?.isBundle || false,
    bundleItems: (product?.bundleItems || []).map(({ productId, quantity }) => ({ productId, quantity })),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const dirty = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const protectDraft = (event: BeforeUnloadEvent) => {
      if (dirty.current) { event.preventDefault(); event.returnValue = ''; }
    };
    window.addEventListener('beforeunload', protectDraft);
    return () => window.removeEventListener('beforeunload', protectDraft);
  }, []);

  const update = <K extends keyof ProductInput>(key: K, value: ProductInput[K]) => {
    dirty.current = true;
    setForm(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: '' }));
    setServerError('');
  };
  const close = () => {
    if (!saving) dirty.current ? setConfirmDiscard(true) : onClose();
  };
  const selectedComponents = form.bundleItems.map(item => ({
    ...item, product: products.find(candidate => candidate.id === item.productId)!,
  })).filter(item => item.product);
  const bundleStock = getAvailableStock({ isBundle: true, stock: 0, bundleItems: selectedComponents });
  const availableProducts = products.filter(candidate => !candidate.isBundle && candidate.id !== product?.id);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (saving) return;
    const parsed = ProductInputSchema.safeParse({ ...form, stock: form.isBundle ? 0 : form.stock });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach(issue => { fieldErrors[String(issue.path[0])] ||= issue.message; });
      setErrors(fieldErrors);
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
      return;
    }
    setSaving(true);
    setServerError('');
    try {
      const response = await fetch(product ? `/api/admin/products/${product.id}` : '/api/admin/products', {
        method: product ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data),
      });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.error || 'تعذر حفظ البيانات؛ أعد المحاولة');
      dirty.current = false;
      onSaved();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'تعذر الاتصال؛ تحقق من الشبكة وأعد المحاولة');
      requestAnimationFrame(() => errorRef.current?.focus());
    } finally { setSaving(false); }
  }

  const field = (key: keyof ProductInput, label: string, type = 'text') => (
    <div key={key}>
      <label htmlFor={`product-${key}`} className="mb-1 block font-bold text-gray-700">{label}</label>
      <input id={`product-${key}`} type={type} disabled={saving}
        value={String(form[key] ?? '')} step={type === 'number' ? (key === 'stock' ? '1' : '0.01') : undefined}
        min={type === 'number' ? 0 : undefined}
        onChange={event => update(key, (type === 'number'
          ? key === 'compareAtPrice' && !event.target.value ? null : Number(event.target.value)
          : event.target.value) as never)}
        aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `product-${key}-error` : undefined}
        className="w-full rounded-xl border border-gray-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-600 disabled:opacity-60" />
      {errors[key] && <p id={`product-${key}-error`} className="mt-1 text-rose-700">{errors[key]}</p>}
    </div>
  );

  return (
    <>
      <Modal title={product ? 'تعديل المنتج أو البكج' : 'إضافة منتج أو بكج'} onClose={close} busy={saving || confirmDiscard}>
        <form ref={formRef} noValidate onSubmit={save} className="space-y-5 text-sm" aria-busy={saving}>
          {serverError && <div ref={errorRef} tabIndex={-1} role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-800">{serverError}</div>}
          <fieldset disabled={saving} className="flex gap-4 rounded-2xl border border-rose-100 bg-brand-soft p-4">
            <legend className="px-1 font-bold">نوع السلعة</legend>
            {[false, true].map(bundle => <label key={String(bundle)} className="flex cursor-pointer items-center gap-2">
              <input type="radio" name="product-kind" checked={form.isBundle === bundle}
                onChange={() => { update('isBundle', bundle); if (!bundle) update('bundleItems', []); }} />
              {bundle ? 'بكج منتجات' : 'منتج منفرد'}
            </label>)}
          </fieldset>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('nameAr', 'الاسم بالعربية')}{field('name', 'الاسم بالإنجليزية')}
            {field('price', form.isBundle ? 'سعر البكج كاملًا (د.أ)' : 'السعر (د.أ)', 'number')}
            {field('compareAtPrice', 'السعر السابق (اختياري)', 'number')}
            {field('sku', 'كود السلعة SKU')}{field('image', 'مسار الصورة أو رابطها')}
            {field('categoryAr', 'القسم بالعربية')}{field('category', 'القسم بالإنجليزية')}
            {field('size', 'الحجم / السعة (اختياري)')}
            {!form.isBundle && field('stock', 'المخزون الحالي', 'number')}
          </div>
          {form.isBundle && <fieldset disabled={saving} tabIndex={-1} aria-invalid={Boolean(errors.bundleItems)}
            aria-describedby="bundle-help bundle-error" className="space-y-3 rounded-2xl border border-rose-200 p-4">
            <legend className="px-1 font-bold text-brand-dark">محتويات البكج</legend>
            <p id="bundle-help" className="text-xs leading-relaxed text-gray-600">اختر منتجين مختلفين على الأقل وحدد كمية كل منتج. السعر أعلاه للبكج كاملًا، والمخزون محسوب من مكوناته.</p>
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {availableProducts.length === 0 && <p className="text-gray-600">أضف منتجات منفردة أولًا لتكوين البكج.</p>}
              {availableProducts.map(candidate => {
                const selected = form.bundleItems.find(item => item.productId === candidate.id);
                return <div key={candidate.id} className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${selected ? 'border-brand-300 bg-brand-50' : 'border-gray-200'}`}>
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={Boolean(selected)} disabled={!candidate.isActive && !selected}
                      onChange={event => update('bundleItems', event.target.checked
                        ? [...form.bundleItems, { productId: candidate.id, quantity: 1 }]
                        : form.bundleItems.filter(item => item.productId !== candidate.id))} />
                    <span><span className="block font-bold">{candidate.nameAr || candidate.name}</span>
                      <span className="text-xs text-gray-500">{formatPrice(candidate.price)} · المخزون: {candidate.stock}{!candidate.isActive && ' · معطل'}</span>
                    </span>
                  </label>
                  {selected && <div className="flex items-center gap-2">
                    <label htmlFor={`bundle-quantity-${candidate.id}`} className="text-xs">الكمية</label>
                    <input id={`bundle-quantity-${candidate.id}`} type="number" min={1} max={50} step={1}
                      value={selected.quantity} aria-invalid={Boolean(errors.bundleItems)} aria-describedby="bundle-error"
                      onChange={event => update('bundleItems', form.bundleItems.map(item => item.productId === candidate.id ? { ...item, quantity: Number(event.target.value) } : item))}
                      className="w-16 rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-brand-600" />
                  </div>}
                </div>;
              })}
            </div>
            <p id="bundle-error" role={errors.bundleItems ? 'alert' : undefined} className="min-h-4 text-xs text-rose-700">{errors.bundleItems}</p>
            <p className="text-xs font-bold" aria-live="polite">المخزون المتاح: {bundleStock} بكج</p>
          </fieldset>}
          {(['descriptionAr', 'description'] as const).map(key => <div key={key}>
            <label htmlFor={`product-${key}`} className="mb-1 block font-bold text-gray-700">{key === 'descriptionAr' ? 'الوصف بالعربية' : 'الوصف بالإنجليزية'}</label>
            <textarea id={`product-${key}`} rows={3} disabled={saving} value={form[key]} onChange={event => update(key, event.target.value)}
              aria-invalid={Boolean(errors[key])} aria-describedby={errors[key] ? `${key}-error` : undefined}
              className="w-full resize-none rounded-xl border border-gray-200 p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-600" />
            {errors[key] && <p id={`${key}-error`} className="text-rose-700">{errors[key]}</p>}
          </div>)}
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2"><input type="checkbox" disabled={saving} checked={form.isActive} onChange={event => update('isActive', event.target.checked)} />مفعل في المتجر</label>
            <label className="flex items-center gap-2"><input type="checkbox" disabled={saving} checked={form.isFeatured} onChange={event => update('isFeatured', event.target.checked)} />منتج مميز</label>
          </div>
          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" disabled={saving} onClick={close} className="rounded-xl bg-gray-100 px-4 py-2.5 font-bold hover:bg-gray-200 disabled:opacity-50">إلغاء</button>
            <button type="submit" disabled={saving} className="min-w-32 rounded-xl bg-brand-600 px-5 py-2.5 font-bold text-white hover:bg-brand-700 disabled:opacity-60" aria-live="polite">{saving ? 'جارٍ الحفظ…' : 'حفظ البيانات'}</button>
          </div>
        </form>
      </Modal>
      {confirmDiscard && <Modal title="تجاهل التعديلات؟" onClose={() => setConfirmDiscard(false)}>
        <p className="text-sm text-gray-600">لم يتم حفظ التعديلات. يمكنك العودة لإكمالها أو تجاهلها وإغلاق النافذة.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" data-autofocus onClick={() => setConfirmDiscard(false)} className="rounded-xl bg-gray-100 px-4 py-2.5 hover:bg-gray-200">العودة للتعديل</button>
          <button type="button" onClick={onClose} className="rounded-xl bg-rose-700 px-4 py-2.5 text-white hover:bg-rose-800">تجاهل التعديلات</button>
        </div>
      </Modal>}
    </>
  );
}
