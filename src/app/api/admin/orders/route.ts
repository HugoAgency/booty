import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizePermission } from '@/lib/rbac';
import { buildOrderWhere, OrderFilterError } from '@/lib/order-filters';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authCheck = await authorizePermission('orders:read');
  if (!authCheck.authorized) return authCheck.response;

  try {
    const { searchParams } = new URL(req.url);
    const where = buildOrderWhere(searchParams);

    const orders = await prisma.order.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ success: true, orders });
  } catch (error) {
    if (error instanceof OrderFilterError) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    console.error('Error fetching admin orders:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ في جلب الطلبات' }, { status: 500 });
  }
}
