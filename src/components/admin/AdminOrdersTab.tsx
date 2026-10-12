'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Download,
  Filter,
  Eye,
  RefreshCw,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  AlertCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { OrderDetail, OrderStatusType } from '@/types';
import { useRemoteData } from '@/hooks/useRemoteData';
import Modal from '@/components/ui/Modal';

export default function AdminOrdersTab({ userRole }: { userRole?: string }) {
  const [query, setQuery] = useState('');
  const { data, loading: isLoading, error: readError, refresh } = useRemoteData<{ orders: OrderDetail[] }>(`/api/admin/orders?${query}`, 'تعذر تحميل الطلبات');
  const orders = data?.orders ?? [];
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const detail = useRemoteData<{ order: OrderDetail }>(selectedOrderId ? `/api/admin/orders/${selectedOrderId}` : null, 'تعذر تحميل تفاصيل الطلب');
  const selectedOrder = detail.data?.order ?? null;
  const [error, setError] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchOrders = (override: Partial<{ search: string; status: string; startDate: string; endDate: string }> = {}) => {
    const values = { search, status: statusFilter, startDate, endDate, ...override };
    const params = new URLSearchParams();
    Object.entries(values).forEach(([key, value]) => { if (value) params.set(key, value); });
    setError(null);
    const next = params.toString();
    if (next === query) void refresh(); else setQuery(next);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatusType) => {
    if (updatingOrderId) return;
    setUpdatingOrderId(orderId);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }),
      });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'تعذر حفظ حالة الطلب');
      await refresh();
      if (selectedOrderId === orderId) await detail.refresh();
      setMessage('تم حفظ حالة الطلب وتحديث القائمة');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'تعذر حفظ الحالة؛ أعد المحاولة'); }
    finally { setUpdatingOrderId(null); }
  };

  const handleExportExcel = async () => {
    if (isExporting) return;
    setIsExporting(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/orders/export?${query}`, { cache: 'no-store' });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'تعذر تصدير الطلبات');
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'TBR_Orders.xlsx';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage('تم تنزيل ملف الطلبات بحسب التصفية المعروضة');
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'تعذر التصدير؛ أعد المحاولة'); }
    finally { setIsExporting(false); }
  };

  const statusBadge = (status: OrderStatusType) => {
    switch (status) {
      case 'NEW':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" />
            جديد
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
            <Truck className="w-3 h-3" />
            قيد المعالجة
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3" />
            مكتمل
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3" />
            ملغي
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert */}
      {message && (
        <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between">
          <span>{message}</span>
        </div>
      )}

      {(error || readError) && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
        <p>{error || readError}</p><button type="button" onClick={() => void refresh()} className="mt-2 font-bold underline hover:text-brand-700">إعادة المحاولة</button>
      </div>}
      {/* Filter & Action Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.nativeEvent.isComposing && fetchOrders()}
              placeholder="بحث برقم الطلب، اسم العميل، الهاتف، المدينة..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              aria-label="تصفية حالة الطلبات"
              onChange={(e) => { setStatusFilter(e.target.value); fetchOrders({ status: e.target.value }); }}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
            >
              <option value="">جميع الحالات</option>
              <option value="NEW">جديد (New)</option>
              <option value="PROCESSING">قيد المعالجة (Processing)</option>
              <option value="COMPLETED">مكتمل (Completed)</option>
              <option value="CANCELLED">ملغي (Cancelled)</option>
            </select>

            <button
              onClick={() => fetchOrders()}
              className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
              title="تحديث"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Export To Excel Button */}
            {userRole !== 'SUPPORT' && (
              <button
                onClick={handleExportExcel}
                disabled={isExporting}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>تصدير Excel (XLSX)</span>
              </button>
            )}
          </div>
        </div>

        {/* Date range pickers */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-gray-100 text-xs text-gray-600">
          <span className="font-bold">تحديد الفترة:</span>
          <div className="flex items-center gap-1.5">
            <span>من:</span>
            <input
              type="date"
              value={startDate}
              aria-label="من تاريخ"
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span>إلى:</span>
            <input
              type="date"
              value={endDate}
              aria-label="إلى تاريخ"
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            />
          </div>
          <button
            onClick={() => fetchOrders()}
            className="px-3 py-1 bg-brand-soft text-brand-700 font-bold rounded-lg hover:bg-brand-100 transition"
          >
            تطبيق الفلترة
          </button>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                fetchOrders({ startDate: '', endDate: '' });
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              إلغاء التواريخ
            </button>
          )}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600" />
            <p className="text-xs">جاري تحميل الطلبات...</p>
          </div>
        ) : readError ? <p className="p-8 text-gray-600">تعذر عرض الطلبات الحالية؛ أعد المحاولة.</p> : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <p className="text-base font-bold text-gray-700">لا توجد طلبات مطابقة</p>
            <p className="text-xs">جربي تعديل خيارات البحث أو التصفية</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="p-3.5">رقم الطلب</th>
                  <th className="p-3.5">تاريخ الطلب</th>
                  <th className="p-3.5">العميل</th>
                  <th className="p-3.5">رقم الهاتف</th>
                  <th className="p-3.5">المدينة</th>
                  <th className="p-3.5">الأصناف</th>
                  <th className="p-3.5">الإجمالي</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium text-gray-700">
                {orders.map((o) => (
                  <tr key={o.id} className="hover:bg-rose-50/30 transition">
                    <td className="p-3.5 font-mono font-bold text-brand-700">
                      {o.orderNumber}
                    </td>
                    <td className="p-3.5 text-gray-500 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleString('ar-JO', { timeZone: 'Asia/Amman',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3.5 font-bold text-gray-900">{o.customerName}</td>
                    <td className="p-3.5 font-mono text-gray-600" dir="ltr">
                      {o.customerPhone}
                    </td>
                    <td className="p-3.5">{o.city}</td>
                    <td className="p-3.5 max-w-xs truncate text-gray-600">
                      {o.items.map((it) => `${it.productNameAr || it.productName} (${it.quantity})`).join(', ')}
                    </td>
                    <td className="p-3.5 font-bold text-gray-900 whitespace-nowrap">
                      {formatPrice(o.totalAmount)}
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <select
                        value={o.status}
                        aria-label={`حالة الطلب ${o.orderNumber}`}
                        disabled={Boolean(updatingOrderId)}
                        onChange={(e) =>
                          handleUpdateStatus(o.id, e.target.value as OrderStatusType)
                        }
                        className="text-xs font-bold rounded-lg border border-gray-200 px-2 py-1 bg-white cursor-pointer"
                      >
                        <option value="NEW">جديد (New)</option>
                        <option value="PROCESSING">قيد المعالجة (Processing)</option>
                        <option value="COMPLETED">مكتمل (Completed)</option>
                        <option value="CANCELLED">ملغي (Cancelled)</option>
                      </select>
                    </td>
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrderId(o.id)}
                        className="px-3 py-1 bg-gray-100 hover:bg-brand-50 hover:text-brand-700 text-gray-700 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>تفاصيل</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrderId && (
        <Modal title={selectedOrder ? `تفاصيل الطلب ${selectedOrder.orderNumber}` : 'تفاصيل الطلب'} onClose={() => setSelectedOrderId(null)}>
          {detail.loading ? <p role="status" className="p-6">جارٍ تحميل تفاصيل الطلب الحالية…</p> : detail.error ?
            <div role="alert"><p>{detail.error}</p><button type="button" onClick={() => void detail.refresh()} className="mt-3 font-bold underline hover:text-brand-700">إعادة المحاولة</button></div> : selectedOrder && <div className="space-y-6">
            <div className="flex items-center gap-3 text-sm">الحالة الحالية: {statusBadge(selectedOrder.status)}</div>
            {/* Customer Information */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl text-xs space-y-1">
              <div>
                <span className="text-gray-400">اسم العميل:</span>
                <p className="font-bold text-gray-900 text-sm">{selectedOrder.customerName}</p>
              </div>
              <div>
                <span className="text-gray-400">رقم الهاتف:</span>
                <p className="font-bold text-gray-900 text-sm" dir="ltr">
                  {selectedOrder.customerPhone}
                </p>
              </div>
              <div>
                <span className="text-gray-400">المدينة:</span>
                <p className="font-bold text-gray-900">{selectedOrder.city}</p>
              </div>
              <div>
                <span className="text-gray-400">البريد الإلكتروني:</span>
                <p className="font-bold text-gray-900">{selectedOrder.customerEmail || '-'}</p>
              </div>
              <div className="col-span-2">
                <span className="text-gray-400">العنوان بالتفصيل:</span>
                <p className="font-bold text-gray-900">{selectedOrder.address}</p>
              </div>
              {selectedOrder.notes && (
                <div className="col-span-2">
                  <span className="text-gray-400">ملاحظات العميل:</span>
                  <p className="text-amber-800 bg-amber-50 p-2 rounded-lg font-medium">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <h4 className="text-sm font-bold text-gray-900">المنتجات المطلوبة</h4>
              <div className="divide-y divide-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-gray-900">
                        {item.productNameAr || item.productName}
                      </p>
                      {item.bundleContents && <ul className="mt-1 space-y-1 text-xs text-gray-600" aria-label="مكونات البكج في الطلب">
                        {item.bundleContents.map(component => <li key={component.productId}>
                          {component.productNameAr || component.productName} · {component.productSku} × {component.quantity * item.quantity}
                        </li>)}
                      </ul>}
                      <p className="text-[11px] text-gray-400 font-mono">
                        SKU: {item.productSku || '-'} | الكمية: {item.quantity}
                      </p>
                    </div>
                    <div className="text-left font-bold text-gray-900">
                      {formatPrice(item.lineTotal)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span>مجموع المنتجات في الطلب:</span><span>{formatPrice(selectedOrder.subtotal)}</span></div>
              <div className="flex justify-between"><span>رسوم التوصيل المحفوظة للطلب:</span><span>{formatPrice(selectedOrder.shippingFee)}</span></div>
            </div>
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-sm">
              <span className="font-bold text-gray-700">المبلغ الإجمالي النهائي:</span>
              <span className="text-xl font-black text-brand-600">
                {formatPrice(selectedOrder.totalAmount)}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedOrderId(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>}
        </Modal>
      )}
    </div>
  );
}
