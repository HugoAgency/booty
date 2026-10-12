'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Key,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  MoreVertical,
  Check,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { AdminUserSummary, AdminRole } from '@/types';
import { useRemoteData } from '@/hooks/useRemoteData';
import { CreateAdminUserSchema, UpdateAdminUserSchema } from '@/lib/validations';
import Modal from '@/components/ui/Modal';

export default function AdminUsersTab({ currentUsername }: { currentUsername: string }) {
  const { data, loading, error: readError, refresh: fetchUsers } = useRemoteData<{ users: AdminUserSummary[] }>('/api/admin/users', 'تعذر تحميل فريق العمل');
  const users = data?.users ?? [];

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // New user modal state
  const [isNewUserOpen, setIsNewUserOpen] = useState(false);
  const [formUsername, setFormUsername] = useState('');
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<AdminRole>('ADMIN');
  const [formPassword, setFormPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [pendingUserChange, setPendingUserChange] = useState<{ user: AdminUserSummary; role?: AdminRole } | null>(null);
  const [userChangeBusy, setUserChangeBusy] = useState(false);
  const [invalidField, setInvalidField] = useState<string | null>(null);

  // Reset password modal state
  const [resetUser, setResetUser] = useState<AdminUserSummary | null>(null);
  const [newResetPassword, setNewResetPassword] = useState('');

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setError(null);
    const parsed = CreateAdminUserSchema.safeParse({ username: formUsername, name: formName,
      email: formEmail || undefined, role: formRole, password: formPassword });
    if (!parsed.success) {
      const issue = parsed.error.issues[0]; const field = String(issue.path[0]);
      setInvalidField(field); setError(issue.message.split('/')[0].trim());
      document.getElementById(`create-user-${field}`)?.focus();
      return;
    }
    setInvalidField(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل إنشاء المستخدم');
      }

      setSuccessMessage(`تم إنشاء حساب ${formUsername} بنجاح`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setIsNewUserOpen(false);
      setFormUsername('');
      setFormName('');
      setFormEmail('');
      setFormPassword('');
      fetchUsers();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء المستخدم');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: AdminUserSummary, confirmed = false) => {
    if (userChangeBusy) return;
    if (user.username === currentUsername) {
      setError('لا يمكنك تعطيل حسابك النشط الحالي حفاظاً على أمان النظام');
      return;
    }

    if (user.isActive && !confirmed) { setPendingUserChange({ user }); return; }
    setUserChangeBusy(true); setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل تحديث حالة المستخدم');
      }

      await fetchUsers();
      setSuccessMessage(`تم ${!user.isActive ? 'تفعيل' : 'تعطيل'} الحساب بنجاح`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally { setUserChangeBusy(false); }
  };

  const handleRoleChange = async (user: AdminUserSummary, newRole: AdminRole, confirmed = false) => {
    if (userChangeBusy || newRole === user.role) return;
    if (user.username === currentUsername && newRole !== 'SUPER_ADMIN') {
      setError('لا يمكنك خفض صلاحيات حسابك النشط');
      return;
    }

    if (!confirmed) { setPendingUserChange({ user, role: newRole }); return; }
    setUserChangeBusy(true); setError(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل تغيير الصلاحية');
      }

      await fetchUsers();
      setSuccessMessage('تم تحديث الدور الوظيفي بنجاح');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally { setUserChangeBusy(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser || isResetting) return;
    setError(null);
    const parsed = UpdateAdminUserSchema.safeParse({ password: newResetPassword });
    if (!parsed.success) {
      setInvalidField('password'); setError(parsed.error.issues[0].message.split('/')[0].trim());
      document.getElementById('reset-user-password')?.focus(); return;
    }
    setInvalidField(null);
    setIsResetting(true);

    try {
      const res = await fetch(`/api/admin/users/${resetUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newResetPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل إعادة ضبط كلمة المرور');
      }

      setSuccessMessage(`تم إعادة ضبط كلمة المرور لـ ${resetUser.username} بنجاح`);
      setTimeout(() => setSuccessMessage(null), 3000);
      setResetUser(null);
      setNewResetPassword('');
    } catch (err: any) {
      setError(err.message || 'حدث خطأ');
    } finally { setIsResetting(false); }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3 text-purple-600" />
            مدير أعلى (Super Admin)
          </span>
        );
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Shield className="w-3 h-3 text-blue-600" />
            مدير متجر (Admin)
          </span>
        );
      case 'SUPPORT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Users className="w-3 h-3 text-amber-600" />
            دعم فني (Support)
          </span>
        );
      default:
        return <span className="text-xs text-gray-500">{role}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {successMessage && (
        <div role="status" className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {(error || readError) && (
        <div role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error || readError}</span>
        </div>
      )}

      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
        <div>
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-600" />
            <span>إدارة فريق العمل والصلاحيات (RBAC)</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            إدارة حسابات المشرفين، الأدوار الأمنية، وصلاحيات الوصول للنظام
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={fetchUsers}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
            title="تحديث"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsNewUserOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>إضافة مشرف جديد</span>
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600" />
            <p className="text-xs">جاري تحميل بيانات المشرفين...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">اسم المستخدم / المشرف</th>
                  <th className="py-3 px-4">البريد الإلكتروني</th>
                  <th className="py-3 px-4">الدور الوظيفي والصلاحية</th>
                  <th className="py-3 px-4">الحالة</th>
                  <th className="py-3 px-4">آخر تسجيل دخول</th>
                  <th className="py-3 px-4 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => {
                  const isCurrent = u.username === currentUsername;
                  return (
                    <tr key={u.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-gray-900 flex items-center gap-2">
                          <span>{u.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-brand-soft text-brand-700 px-1.5 py-0.5 rounded font-bold">
                              حسابك الحالي
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-gray-400">@{u.username}</div>
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-600" dir="ltr">
                        {u.email || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {getRoleBadge(u.role)}
                          {!isCurrent && (
                            <select
                              value={u.role}
                              onChange={(e) => handleRoleChange(u, e.target.value as AdminRole)}
                              className="bg-gray-50 border border-gray-200 rounded text-[11px] px-1 py-0.5 text-gray-600 font-semibold"
                            >
                              <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                              <option value="ADMIN">ADMIN</option>
                              <option value="SUPPORT">SUPPORT</option>
                            </select>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            نشط
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-gray-400 font-bold text-[11px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            معطل
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-mono text-[11px]">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleString('ar-JO', {
                              timeZone: 'Asia/Amman',
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'لم يسجل الدخول بعد'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setResetUser(u);
                              setNewResetPassword('');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition flex items-center gap-1"
                            title="إعادة ضبط كلمة المرور"
                          >
                            <Key className="w-3.5 h-3.5 text-gray-500" />
                            <span>كلمة المرور</span>
                          </button>

                          {!isCurrent && (
                            <button
                              onClick={() => handleToggleStatus(u)}
                              disabled={userChangeBusy}
                              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                                u.isActive
                                  ? 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                                  : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                              }`}
                            >
                              {u.isActive ? 'تعطيل الحساب' : 'تفعيل'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create New User Modal */}
      {isNewUserOpen && (
        <Modal title="إضافة مشرف جديد للنظام" onClose={() => setIsNewUserOpen(false)} busy={isSubmitting}>
            <form noValidate onSubmit={handleCreateUser} className="p-6 space-y-4">
              {error && <p id="user-form-error" role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
              <div>
                <label htmlFor="create-user-name" className="block text-xs font-bold text-gray-700 mb-1">اسم المشرف (الاسم الكامل)</label>
                <input
                  type="text"
                  required
                  id="create-user-name" aria-invalid={invalidField === 'name'} aria-describedby={invalidField === 'name' ? 'user-form-error' : undefined}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="مثال: أحمد عبد الله"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label htmlFor="create-user-username" className="block text-xs font-bold text-gray-700 mb-1">اسم الدخول (Username)</label>
                <input
                  type="text"
                  required
                  id="create-user-username" aria-invalid={invalidField === 'username'} aria-describedby={invalidField === 'username' ? 'user-form-error' : undefined}
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="مثال: ahmed_ops"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">البريد الإلكتروني (اختياري)</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="admin@bootyrepublic.com"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div>
                <label htmlFor="create-user-role" className="block text-xs font-bold text-gray-700 mb-1">الدور الوظيفي والصلاحيات</label>
                <select
                  id="create-user-role" aria-invalid={invalidField === 'role'} aria-describedby={invalidField === 'role' ? 'user-form-error' : undefined}
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as AdminRole)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700"
                >
                  <option value="ADMIN">مدير متجر (ADMIN) - إدارة المنتجات والطلبات والتصدير</option>
                  <option value="SUPPORT">دعم فني (SUPPORT) - مشاهدة وتحديث حالات الطلبات والمنتجات للقراءة</option>
                  <option value="SUPER_ADMIN">مدير أعلى (SUPER_ADMIN) - صلاحيات مطلقة وإدارة المشرفين</option>
                </select>
              </div>

              <div>
                <label htmlFor="create-user-password" className="block text-xs font-bold text-gray-700 mb-1">كلمة المرور الابتدائية</label>
                <input
                  type="password"
                  required
                  id="create-user-password" aria-invalid={invalidField === 'password'} aria-describedby={invalidField === 'password' ? 'user-form-error' : undefined}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="8 خانات، تشمل حروف وأرقام ورموز"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsNewUserOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl disabled:opacity-50"
                >
                  {isSubmitting ? 'جاري الإنشاء...' : 'حفظ المشرف'}
                </button>
              </div>
            </form>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {resetUser && (
        <Modal title={`إعادة ضبط كلمة المرور لـ @${resetUser.username}`} onClose={() => setResetUser(null)} busy={isResetting}>
            <form noValidate onSubmit={handleResetPassword} className="p-6 space-y-4">
              {error && <p id="user-form-error" role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}
              <div>
                <label htmlFor="reset-user-password" className="block text-xs font-bold text-gray-700 mb-1">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  required
                  id="reset-user-password" aria-invalid={invalidField === 'password'} aria-describedby={invalidField === 'password' ? 'user-form-error' : undefined}
                  value={newResetPassword}
                  onChange={(e) => setNewResetPassword(e.target.value)}
                  placeholder="8 خانات على الأقل مع رموز وأرقام"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setResetUser(null)} disabled={isResetting}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isResetting}
                  className="px-5 py-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl"
                >
                  حفظ كلمة المرور
                </button>
              </div>
            </form>
        </Modal>
      )}
      {pendingUserChange && <Modal title={pendingUserChange.role ? 'تغيير صلاحيات المشرف؟' : 'تعطيل حساب المشرف؟'} onClose={() => setPendingUserChange(null)} busy={userChangeBusy}>
        <p className="text-sm text-gray-700">{pendingUserChange.user.name} (@{pendingUserChange.user.username})</p>
        <p className="mt-3 text-sm">{pendingUserChange.role ? `سيصبح الدور ${pendingUserChange.role} ويُطبّق على طلبات الوصول التالية.` : 'سيفقد هذا الحساب إمكانية الدخول واستخدام لوحة الإدارة.'}</p>
        <div className="mt-5 flex gap-3">
          <button type="button" data-autofocus disabled={userChangeBusy} onClick={() => setPendingUserChange(null)} className="rounded-xl bg-gray-100 px-4 py-2 font-bold hover:bg-gray-200">إلغاء</button>
          <button type="button" disabled={userChangeBusy} onClick={async () => {
            const change = pendingUserChange;
            if (change.role) await handleRoleChange(change.user, change.role, true);
            else await handleToggleStatus(change.user, true);
            setPendingUserChange(null);
          }} className="rounded-xl bg-brand-700 px-4 py-2 font-bold text-white hover:bg-brand-800">{pendingUserChange.role ? 'حفظ الدور الجديد' : 'تعطيل الحساب'}</button>
        </div>
      </Modal>}
    </div>
  );
}
