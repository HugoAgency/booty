import { NextResponse } from 'next/server';
import { getShippingRules } from '@/lib/shipping-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const rules = await getShippingRules();
    return NextResponse.json({
      success: true,
      rules,
    });
  } catch (error: any) {
    console.error('Error fetching shipping rules:', error);
    return NextResponse.json(
      { success: false, error: 'فشل استرجاع إعدادات التوصيل' },
      { status: 500 }
    );
  }
}
