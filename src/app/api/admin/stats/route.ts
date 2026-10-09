import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'غير مصرح / Unauthorized' }, { status: 401 });
  }

  try {
    const [totalOrders, pendingOrders, completedOrders, totalRevenue, totalProducts, recentOrders] =
      await Promise.all([
        prisma.order.count(),
        prisma.order.count({ where: { status: 'NEW' } }),
        prisma.order.count({ where: { status: 'COMPLETED' } }),
        prisma.order.aggregate({
          _sum: { totalAmount: true },
          where: { status: { not: 'CANCELLED' } },
        }),
        prisma.product.count({ where: { isActive: true } }),
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: { items: true },
        }),
      ]);

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: Number((totalRevenue._sum.totalAmount || 0).toFixed(2)),
        totalProducts,
        recentOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ success: false, error: 'فشل جلب الإحصائيات' }, { status: 500 });
  }
}
