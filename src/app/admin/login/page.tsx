'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Shield, Lock, User, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import AnimatedLogo from '@/components/AnimatedLogo';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل تسجيل الدخول، يرجى التحقق من البيانات');
      }

      router.push('/admin');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ في الاتصال');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-rose-50/40 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-rose-100 shadow-2xl p-8 space-y-6">
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <AnimatedLogo width={220} height={58} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-brand-700 text-xs font-bold border border-rose-100">
            <Shield className="w-3.5 h-3.5" />
            <span>بوابة إدارة النظام (الأردن) / Jordan Admin</span>
          </div>
          <h1 className="text-xl font-black text-gray-900">تسجيل دخول المسؤول</h1>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              اسم المستخدم / Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              كلمة المرور / Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pr-10 pl-3 py-2.5 rounded-xl border border-gray-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm outline-none"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              كلمة المرور الافتراضية للنظام: <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600">Admin@Booty2026!</code>
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition ${
              isLoading
                ? 'bg-gray-400 cursor-wait'
                : 'bg-brand-dark hover:bg-gray-800 shadow-lg shadow-gray-200'
            }`}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>تسجيل الدخول / Login</span>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-rose-50 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-brand-600 font-bold hover:underline"
          >
            <ArrowRight className="w-3.5 h-3.5 rtl:rotate-0 rotate-180" />
            <span>العودة لمتجر العملاء</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
