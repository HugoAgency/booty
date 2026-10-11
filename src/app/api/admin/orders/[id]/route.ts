import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizePermission } from '@/lib/rbac';
import { logAuditEvent } from '@/lib/audit';
import { OrderStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const authCheck = await authorizePermission('orders:read');
  if (!authCheck.authorized) return authCheck.response;

  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ success: false, error: 'الطلب غير موجود' }, { status: 404 });
    }
    return NextResponse.json({ success: true, order });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'فشل جلب تفاصيل الطلب' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authCheck = await authorizePermission('orders:update');
  if (!authCheck.authorized) return authCheck.response;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  try {
    const body = await req.json();
    const { status } = body;

    if (!status || !Object.values(OrderStatus).includes(status as OrderStatus)) {
      return NextResponse.json({ success: false, error: 'حالة الطلب غير صالحة' }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id: params.id },
      data: { status: status as OrderStatus },
      include: { items: true },
    });

    await logAuditEvent({
      adminId: authCheck.session.adminId,
      username: authCheck.session.username,
      action: 'ORDER_STATUS_UPDATED',
      ipAddress: ip,
      details: `Order ${updated.orderNumber} status changed to ${status}`,
    });

    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json({ success: false, error: 'فشل تحديث حالة الطلب' }, { status: 500 });
  }
}
