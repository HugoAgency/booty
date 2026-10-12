import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth';
import { getDashboardStats } from '@/lib/dashboard-stats';
import { classifyStatsError } from '@/lib/stats-error';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'غير مصرح / Unauthorized' }, { status: 401 });
  }

  try {
    return NextResponse.json({ success: true, stats: await getDashboardStats() }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const failure = classifyStatsError(error);
    console.error('Error fetching admin stats:', { code: failure.code, databaseCode: failure.databaseCode });
    return NextResponse.json({ success: false, error: failure.error, code: failure.code }, {
      status: failure.status, headers: { 'Cache-Control': 'no-store', ...(failure.code === 'DATABASE_UNAVAILABLE' ? { 'Retry-After': '10' } : {}) },
    });
  }
}
