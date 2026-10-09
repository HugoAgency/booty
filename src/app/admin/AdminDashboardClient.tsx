'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  LogOut,
  ExternalLink,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import AdminStatsTab from '@/components/admin/AdminStatsTab';
import AdminOrdersTab from '@/components/admin/AdminOrdersTab';
import AdminProductsTab from '@/components/admin/AdminProductsTab';

export default function AdminDashboardClient({ user }: { user: { username: string; name: string } }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products'>('overview');

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Admin Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <Link href="/" className="relative w-36 h-10">
              <Image
                src="/images/logo.jpg"
                alt="THE BOOTY REPUBLIC"
                fill
                className="object-contain"
              />
            </Link>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full bg-brand-soft text-brand-700 font-bold text-xs border border-rose-100">
              لوحة التحكم الإدارية
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <span>معاينة المتجر</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="text-left hidden md:block">
              <div className="text-xs font-bold text-gray-800">{user.name || user.username}</div>
              <div className="text-[10px] text-gray-400 font-mono">مسؤول النظام</div>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
              title="تسجيل الخروج"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex gap-6 text-xs sm:text-sm font-bold border-t border-gray-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3.5 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>نظرة عامة والمؤشرات</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3.5 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'orders'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>إدارة وتصدير الطلبات (Excel)</span>
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`py-3.5 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'products'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>إدارة المنتجات والمخزون</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <AdminStatsTab onSelectTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'orders' && <AdminOrdersTab />}
        {activeTab === 'products' && <AdminProductsTab />}
      </main>
    </div>
  );
}
