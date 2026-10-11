import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizePermission } from '@/lib/rbac';
import { ShippingConfigSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit';
import { getShippingRules } from '@/lib/shipping-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await authorizePermission('orders:read');
  if (!auth.authorized) return auth.response;

  try {
    const rules = await getShippingRules();
    return NextResponse.json({ success: true, rules });
  } catch (error: any) {
    console.error('Error fetching admin shipping config:', error);
    return NextResponse.json(
      { success: false, error: 'فشل تحميل إعدادات التوصيل' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  const auth = await authorizePermission('orders:update');
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

    const updated = await prisma.shippingConfig.upsert({
      where: { id: 'default' },
      update: parsed.data,
      create: {
        id: 'default',
        ...parsed.data,
      },
    });

    await logAuditEvent({
      adminId: auth.session.adminId,
      username: auth.session.username,
      action: 'SHIPPING_SETTINGS_UPDATED',
      ipAddress: ip,
      details: `Updated shipping settings (Promo: ${updated.isFreeShippingPromo}, Threshold: ${updated.freeShippingThreshold} JOD, Amman: ${updated.ammanFee} JOD, Outer: ${updated.outerGovernoratesFee} JOD)`,
    });

    return NextResponse.json({ success: true, rules: updated });
  } catch (error: any) {
    console.error('Error updating shipping config:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'فشل تحديث إعدادات التوصيل' },
      { status: 500 }
    );
  }
}
