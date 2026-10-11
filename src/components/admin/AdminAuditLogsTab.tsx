'use client';

import React, { useState, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  RefreshCw,
  Search,
  Filter,
  AlertCircle,
  Clock,
  Terminal,
} from 'lucide-react';
import { AdminAuditLogItem } from '@/types';

export default function AdminAuditLogsTab() {
  const [logs, setLogs] = useState<AdminAuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/audit-logs?limit=100');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل جلب سجلات التدقيق');
      }
      setLogs(data.logs);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تحميل السجلات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (!actionFilter) return true;
    return log.action.toLowerCase().includes(actionFilter.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(actionFilter.toLowerCase())) ||
      log.username.toLowerCase().includes(actionFilter.toLowerCase());
  });

  const getActionBadge = (action: string) => {
    if (action.includes('AUTH_LOGIN_SUCCESS')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          تسجيل دخول ناجح
        </span>
      );
    }
    if (action.includes('AUTH_LOGIN_FAILED')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
          فشل تسجيل الدخول
        </span>
      );
    }
    if (action.includes('PASSWORD_CHANGED') || action.includes('USER_')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
          أمان ومستخدمين
        </span>
      );
    }
    if (action.includes('ORDER_')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
          إدارة الطلبات
        </span>
      );
    }
    if (action.includes('PRODUCT_')) {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200">
          المنتجات
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
        {action}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-brand-600" />
            <span>سجل التدقيق الأمني (Audit Logs)</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            توثيق جميع العمليات الحساسة وتغييرات النظام ومحاولات تسجيل الدخول
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="بحث في الإجراء، المستخدم، التفاصيل..."
            className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs w-full sm:w-64"
          />
          <button
            onClick={fetchLogs}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
            title="تحديث"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600" />
            <p className="text-xs">جاري تحميل سجلات التدقيق...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <p className="text-sm font-bold text-gray-700">لا توجد سجلات مطابقة</p>
            <p className="text-xs">لم يتم تسجيل أي عمليات ضمن معايير البحث الحالية</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">التاريخ والوقت (الأردن)</th>
                  <th className="py-3 px-4">نوع العملية</th>
                  <th className="py-3 px-4">المشرف المسؤول</th>
                  <th className="py-3 px-4">عنوان IP</th>
                  <th className="py-3 px-4">تفاصيل الحدث</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-3 px-4 text-gray-500 whitespace-nowrap text-[11px]">
                      {new Date(log.createdAt).toLocaleString('ar-JO', {
                        timeZone: 'Asia/Amman',
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-sans">
                      <div className="flex items-center gap-1.5">
                        {getActionBadge(log.action)}
                        <span className="text-[10px] text-gray-400 font-mono">({log.action})</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-bold text-gray-800">
                      @{log.username}
                    </td>
                    <td className="py-3 px-4 text-gray-500 text-[11px]" dir="ltr">
                      {log.ipAddress || '—'}
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-sans text-xs max-w-md truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
