import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizePermission } from '@/lib/rbac';
import { ProductInputSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const authCheck = await authorizePermission('products:write');
  if (!authCheck.authorized) return authCheck.response;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  try {
    const body = await req.json();
    const parsed = ProductInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'البيانات غير صالحة', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const updated = await prisma.product.update({
      where: { id: params.id },
      data: parsed.data,
    });

    await logAuditEvent({
      adminId: authCheck.session.adminId,
      username: authCheck.session.username,
      action: 'PRODUCT_UPDATED',
      ipAddress: ip,
      details: `Updated product ${updated.name} (${updated.sku})`,
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json({ success: false, error: error.message || 'فشل تحديث المنتج' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authCheck = await authorizePermission('products:delete');
  if (!authCheck.authorized) return authCheck.response;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  try {
    const updated = await prisma.product.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await logAuditEvent({
      adminId: authCheck.session.adminId,
      username: authCheck.session.username,
      action: 'PRODUCT_DEACTIVATED',
      ipAddress: ip,
      details: `Deactivated product ${updated.name} (ID: ${params.id})`,
    });

    return NextResponse.json({ success: true, message: 'تم تعطيل المنتج بنجاح' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json({ success: false, error: error.message || 'فشل حذف المنتج' }, { status: 500 });
  }
}

