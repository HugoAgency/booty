import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { bundleInclude } from '@/lib/bundle-service';
import { withAvailableStock } from '@/lib/bundles';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
      include: bundleInclude,
    });
    return NextResponse.json({ success: true, products: products.map(withAvailableStock) });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ أثناء جلب المنتجات' },
      { status: 500 }
    );
  }
}
