import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/auth';
import AdminDashboardClient from './AdminDashboardClient';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const session = await getAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  return (
    <AdminDashboardClient
      user={{
        username: session.username,
        name: session.username === 'admin' ? 'مدير النظام الرئيسي' : session.username,
      }}
    />
  );
}
