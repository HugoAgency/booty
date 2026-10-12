import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { bundleInclude, validateBundleInput, ProductInputError } from '@/lib/bundle-service';
import { withAvailableStock } from '@/lib/bundles';
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

    const updated = await prisma.$transaction(async (tx) => {
      const existing = await tx.product.findUniqueOrThrow({ where: { id: params.id } });
      const expectedUpdatedAt = body.expectedUpdatedAt ?? body.updatedAt;
      if (expectedUpdatedAt !== undefined && expectedUpdatedAt !== existing.updatedAt.toISOString()) {
        throw new Error('PRODUCT_CHANGED');
      }
      await validateBundleInput(tx, parsed.data, params.id);
      const { bundleItems, ...productData } = parsed.data;
      return tx.product.update({
        where: { id: params.id },
        data: {
          ...productData, stock: productData.isBundle ? 0 : productData.stock,
          bundleItems: { deleteMany: {}, create: bundleItems },
        },
        include: bundleInclude,
      });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await logAuditEvent({
      adminId: authCheck.session.adminId,
      username: authCheck.session.username,
      action: 'PRODUCT_UPDATED',
      ipAddress: ip,
      details: `Updated product ${updated.name} (${updated.sku})`,
    });

    return NextResponse.json({ success: true, product: withAvailableStock(updated) });
  } catch (error: any) {
    if (error?.message === 'PRODUCT_CHANGED') return NextResponse.json({ success: false, code: 'PRODUCT_CHANGED', error: 'تحدّثت السلعة بعد فتحها. أعد تحميل بياناتها قبل الحفظ؛ لم تُستبدل التعديلات الجديدة.' }, { status: 409 });
    if (error instanceof ProductInputError) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    if (error?.code === 'P2034') return NextResponse.json({ success: false, error: 'تم تحديث المنتجات أثناء الحفظ؛ أعد المحاولة' }, { status: 409 });
    if (error?.code === 'P2025') return NextResponse.json({ success: false, error: 'المنتج غير موجود' }, { status: 404 });
    if (error?.code === 'P2002') return NextResponse.json({ success: false, error: 'كود المنتج مستخدم مسبقًا' }, { status: 409 });
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

