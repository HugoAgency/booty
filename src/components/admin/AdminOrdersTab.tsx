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

export default function AdminOrdersTab({ userRole }: { userRole?: string }) {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: OrderStatusType) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
        }
        setMessage(`تم تحديث حالة الطلب إلى "${newStatus}" بنجاح`);
        setTimeout(() => setMessage(null), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);

      const downloadUrl = `/api/admin/orders/export?${params.toString()}`;
      window.location.href = downloadUrl;
      setMessage('جاري تحميل ملف Excel...');
      setTimeout(() => setMessage(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsExporting(false);
    }
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
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center justify-between">
          <span>{message}</span>
        </div>
      )}

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
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
              placeholder="بحث برقم الطلب، اسم العميل، الهاتف، المدينة..."
              className="w-full pr-10 pl-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
            >
              <option value="">جميع الحالات</option>
              <option value="NEW">جديد (New)</option>
              <option value="PROCESSING">قيد المعالجة (Processing)</option>
              <option value="COMPLETED">مكتمل (Completed)</option>
              <option value="CANCELLED">ملغي (Cancelled)</option>
            </select>

            <button
              onClick={fetchOrders}
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
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span>إلى:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs"
            />
          </div>
          <button
            onClick={fetchOrders}
            className="px-3 py-1 bg-brand-soft text-brand-700 font-bold rounded-lg hover:bg-brand-100 transition"
          >
            تطبيق الفلترة
          </button>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
                fetchOrders();
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
        ) : orders.length === 0 ? (
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
                      {new Date(o.createdAt).toLocaleString('ar-JO', {
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
                        onClick={() => setSelectedOrder(o)}
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
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs text-gray-400">تفاصيل الطلب:</span>
                <h3 className="text-xl font-black text-brand-700 font-mono">
                  {selectedOrder.orderNumber}
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

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
            <div className="border-t border-gray-100 pt-3 flex justify-between items-center text-sm">
              <span className="font-bold text-gray-700">المبلغ الإجمالي النهائي:</span>
              <span className="text-xl font-black text-brand-600">
                {formatPrice(selectedOrder.totalAmount)}
              </span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
