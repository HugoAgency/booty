import { NextResponse } from 'next/server';
import { authorizePermission } from '@/lib/rbac';
import { getRecentAuditLogs } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authCheck = await authorizePermission('audit:read');
  if (!authCheck.authorized) return authCheck.response;

  try {
    const logs = await getRecentAuditLogs(100);
    return NextResponse.json({ success: true, logs });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'فشل جلب سجلات الأمان' }, { status: 500 });
  }
}
