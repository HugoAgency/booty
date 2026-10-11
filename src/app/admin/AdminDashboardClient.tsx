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
  ShieldCheck,
  Users,
  KeyRound,
  FileSpreadsheet,
  Truck,
} from 'lucide-react';
import AdminStatsTab from '@/components/admin/AdminStatsTab';
import AdminOrdersTab from '@/components/admin/AdminOrdersTab';
import AdminProductsTab from '@/components/admin/AdminProductsTab';
import AdminShippingTab from '@/components/admin/AdminShippingTab';
import AdminUsersTab from '@/components/admin/AdminUsersTab';
import AdminAuditLogsTab from '@/components/admin/AdminAuditLogsTab';
import ChangePasswordModal from '@/components/admin/ChangePasswordModal';
import AnimatedLogo from '@/components/AnimatedLogo';

interface AdminDashboardClientProps {
  user: {
    username: string;
    name: string;
    role?: string;
  };
}

export default function AdminDashboardClient({ user }: AdminDashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'shipping' | 'users' | 'audit'>('overview');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const role = user.role || 'ADMIN';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const getRoleBadge = (r: string) => {
    switch (r) {
      case 'SUPER_ADMIN':
        return { label: 'مدير أعلى (Super Admin)', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'SUPPORT':
        return { label: 'دعم فني (Support)', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'ADMIN':
      default:
        return { label: 'مدير متجر (Admin)', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
    }
  };

  const roleMeta = getRoleBadge(role);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Admin Top Navigation */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <AnimatedLogo width={180} height={48} />
            <span className={`hidden sm:inline-block px-2.5 py-0.5 rounded-full font-bold text-xs border ${roleMeta.bg}`}>
              {roleMeta.label}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
            >
              <span>معاينة المتجر</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={() => setIsPasswordModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-brand-600 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
              title="تغيير كلمة المرور"
            >
              <KeyRound className="w-4 h-4 text-brand-600" />
              <span className="hidden sm:inline">كلمة المرور</span>
            </button>

            <div className="text-left hidden md:block border-r border-gray-200 pr-3 mr-1">
              <div className="text-xs font-bold text-gray-800">{user.name || user.username}</div>
              <div className="text-[10px] text-gray-400 font-mono">@{user.username}</div>
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
            <span>إدارة وتصدير الطلبات</span>
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

          <button
            onClick={() => setActiveTab('shipping')}
            className={`py-3.5 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
              activeTab === 'shipping'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-gray-500 hover:text-gray-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>إعدادات التوصيل والرسوم</span>
          </button>

          {isSuperAdmin && (
            <>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-3.5 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'users'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>فريق العمل والصلاحيات</span>
              </button>

              <button
                onClick={() => setActiveTab('audit')}
                className={`py-3.5 flex items-center gap-2 border-b-2 transition whitespace-nowrap ${
                  activeTab === 'audit'
                    ? 'border-brand-600 text-brand-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>سجل التدقيق الأمني</span>
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <AdminStatsTab onSelectTab={(tab) => setActiveTab(tab)} />
        )}
        {activeTab === 'orders' && <AdminOrdersTab userRole={role} />}
        {activeTab === 'products' && <AdminProductsTab userRole={role} />}
        {activeTab === 'shipping' && <AdminShippingTab userRole={role} />}
        {activeTab === 'users' && isSuperAdmin && (
          <AdminUsersTab currentUsername={user.username} />
        )}
        {activeTab === 'audit' && isSuperAdmin && (
          <AdminAuditLogsTab />
        )}
      </main>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </div>
  );
}
