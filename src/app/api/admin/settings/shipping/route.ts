import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizePermission } from '@/lib/rbac';
import { ShippingConfigSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit';
import { DEFAULT_SHIPPING_RULES } from '@/lib/shipping-rules';
import { Prisma } from '@prisma/client';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await authorizePermission('orders:read');
  if (!auth.authorized) return auth.response;

  try {
    const config = await prisma.shippingConfig.findUnique({ where: { id: 'default' } });
    return NextResponse.json({ success: true, rules: config ?? DEFAULT_SHIPPING_RULES, revision: config?.updatedAt.toISOString() ?? null }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: any) {
    console.error('Error fetching admin shipping config:', error);
    return NextResponse.json(
      { success: false, error: 'فشل تحميل إعدادات التوصيل' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await authorizePermission('shipping:write');
  if (!auth.authorized) return auth.response;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  try {
    const body = await req.json();
    const parsed = ShippingConfigSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'بيانات غير صالحة',
          details: parsed.error.format(),
        },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async tx => {
      const existing = await tx.shippingConfig.findUnique({ where: { id: 'default' } });
      if (body.expectedUpdatedAt !== undefined && body.expectedUpdatedAt !== (existing?.updatedAt.toISOString() ?? null)) {
        throw new Error('SHIPPING_CHANGED');
      }
      return tx.shippingConfig.upsert({ where: { id: 'default' }, update: parsed.data,
        create: { id: 'default', ...parsed.data } });
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    await logAuditEvent({
      adminId: auth.session.adminId,
      username: auth.session.username,
      action: 'SHIPPING_SETTINGS_UPDATED',
      ipAddress: ip,
      details: `Updated shipping settings (Promo: ${updated.isFreeShippingPromo}, Threshold: ${updated.freeShippingThreshold} JOD, Amman: ${updated.ammanFee} JOD, Outer: ${updated.outerGovernoratesFee} JOD)`,
    });

    return NextResponse.json({ success: true, rules: updated });
  } catch (error: any) {
    if (error?.message === 'SHIPPING_CHANGED' || error?.code === 'P2034') return NextResponse.json({ success: false, code: 'SHIPPING_CHANGED', error: 'تحدّثت إعدادات التوصيل من مشرف آخر. أعد تحميلها قبل الحفظ.' }, { status: 409 });
    console.error('Error updating shipping config:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'فشل تحديث إعدادات التوصيل' },
      { status: 500 }
    );
  }
}
