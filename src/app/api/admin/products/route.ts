import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authorizePermission } from '@/lib/rbac';
import { ProductInputSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authCheck = await authorizePermission('products:read');
  if (!authCheck.authorized) return authCheck.response;

  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ success: true, products });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء جلب المنتجات' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const { name, sku } = parsed.data;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || `prod-${Date.now()}`;

    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      return NextResponse.json({ success: false, error: 'رمز المنتج SKU مستخدم مسبقاً' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        ...parsed.data,
        slug,
      },
    });

    await logAuditEvent({
      adminId: authCheck.session.adminId,
      username: authCheck.session.username,
      action: 'PRODUCT_CREATED',
      ipAddress: ip,
      details: `Created product: ${newProduct.name} (${newProduct.sku})`,
    });

    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json({ success: false, error: error.message || 'فشل إضافة المنتج' }, { status: 500 });
  }
}
