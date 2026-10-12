'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, DollarSign, Clock, Package, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { formatPrice } from '@/lib/currency';
import { OrderDetail } from '@/types';
import { useRemoteData } from '@/hooks/useRemoteData';

export default function AdminStatsTab({
  onSelectTab,
}: {
  onSelectTab: (tab: 'orders' | 'products') => void;
}) {
  const { data, loading: isLoading, error, refresh } = useRemoteData<{
    stats: { totalRevenue: number; totalOrders: number; pendingOrders: number; totalProducts: number; recentOrders: OrderDetail[] };
  }>('/api/admin/stats', 'تعذر تحميل لوحة المؤشرات');
  const stats = data?.stats;

  if (isLoading) return <div role="status" className="p-12 text-center text-gray-500">جارٍ تحميل لوحة المؤشرات…</div>;
  if (error || !stats) return <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
    <p>{error || 'تعذر تحميل لوحة المؤشرات'}</p>
    <button type="button" onClick={() => void refresh()} className="mt-3 font-bold underline hover:text-brand-700">إعادة المحاولة</button>
  </div>;

  const statCards = [
    {
      title: 'إجمالي قيمة الطلبات غير الملغاة',
      value: formatPrice(stats.totalRevenue),
      icon: DollarSign,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
    },
    {
      title: 'إجمالي عدد الطلبات',
      value: stats.totalOrders,
      icon: ShoppingBag,
      color: 'text-brand-600 bg-rose-50 border-rose-100',
    },
    {
      title: 'الطلبات الجديدة (قيد الانتظار)',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
    },
    {
      title: 'المنتجات النشطة بالمتجر',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-purple-600 bg-purple-50 border-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-500">{card.title}</span>
              <div
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${card.color}`}
              >
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-black text-gray-900">{card.value}</div>
          </div>
        ))}
      </div>

      {/* Quick Action row */}
      <div className="bg-gradient-to-r from-brand-dark to-gray-900 text-white p-6 rounded-3xl shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center md:text-right">
          <h3 className="text-lg font-bold">جاهزية تصدير الطلبات والتقارير</h3>
          <p className="text-xs text-rose-200/80">
            يمكنكِ تصفية الطلبات بحسب التاريخ والحالة وتصديرها مباشرة إلى جدول Excel منسق باللغة العربية
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSelectTab('orders')}
            className="px-5 py-2.5 bg-brand-primary text-brand-dark hover:bg-white font-bold rounded-xl text-xs transition"
          >
            عرض جميع الطلبات وتصدير Excel
          </button>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">أحدث الطلبات المستلمة</h3>
          <button
            onClick={() => onSelectTab('orders')}
            className="text-xs font-bold text-brand-600 hover:underline flex items-center gap-1"
          >
            <span>عرض كل الطلبات</span>
            <ArrowUpRight className="w-3.5 h-3.5 rtl:rotate-180" />
          </button>
        </div>

        {stats.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {stats.recentOrders.map((order: OrderDetail) => (
              <div key={order.id} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <span className="font-mono font-bold text-brand-700">
                    {order.orderNumber}
                  </span>
                  <p className="text-gray-900 font-semibold">{order.customerName} - {order.city}</p>
                </div>
                <div className="text-left space-y-0.5">
                  <div className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</div>
                  <span className="text-[10px] text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString('ar-JO', { timeZone: 'Asia/Amman' })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 text-center py-6">لا توجد طلبات حديثة بعد</p>
        )}
      </div>
    </div>
  );
}
