import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizePermission } from '@/lib/rbac';
import { generateOrdersExcelWorkbook, OrderExportRecord } from '@/lib/excel';
import { logAuditEvent } from '@/lib/audit';
import { buildOrderWhere, OrderFilterError } from '@/lib/order-filters';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const authCheck = await authorizePermission('orders:export');
  if (!authCheck.authorized) return authCheck.response;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

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

    const exportData: OrderExportRecord[] = orders.map((o) => ({
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      customerEmail: o.customerEmail,
      city: o.city,
      address: o.address,
      items: o.items.map((i) => ({
        productName: i.productName,
        productNameAr: i.productNameAr,
        productSku: i.productSku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        bundleContents: i.bundleContents,
      })),
      totalAmount: o.totalAmount,
      notes: o.notes,
      status: o.status,
    }));

    const excelBuffer = await generateOrdersExcelWorkbook(exportData);

    const now = new Date().toISOString().slice(0, 10);
    const filename = `TBR_Orders_${now}.xlsx`;

    await logAuditEvent({
      adminId: authCheck.session.adminId,
      username: authCheck.session.username,
      action: 'ORDER_EXPORTED',
      ipAddress: ip,
      details: `Exported ${exportData.length} orders to ${filename}`,
    });

    return new NextResponse(new Uint8Array(excelBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    if (error instanceof OrderFilterError) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    console.error('Excel Export Error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء تصدير ملف الإكسل' },
      { status: 500 }
    );
  }
}
