import { NextRequest, NextResponse } from 'next/server';
import { CheckoutPayloadSchema } from '@/lib/validations';
import { processOrderSubmission, OrderQuoteChangedError } from '@/lib/order-service';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const parseResult = CheckoutPayloadSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0]?.message || 'بيانات الطلب غير صالحة';
      return NextResponse.json(
        {
          success: false,
          error: firstError,
          details: parseResult.error.format(),
        },
        { status: 400 }
      );
    }

    const { isDuplicate, order } = await processOrderSubmission(parseResult.data);

    return NextResponse.json(
      {
        success: true,
        isDuplicate,
        orderNumber: order.orderNumber,
        orderId: order.id,
        totalAmount: order.totalAmount,
        subtotal: order.subtotal,
        status: order.status,
      },
      { status: isDuplicate ? 200 : 201 }
    );
  } catch (error: any) {
    if (error instanceof OrderQuoteChangedError) {
      return NextResponse.json({ success: false, code: 'QUOTE_CHANGED', error: error.message }, { status: 409 });
    }
    console.error('Checkout processing error:', error);
    const message = error.message || 'حدث خطأ أثناء معالجة الطلب، يرجى المحاولة لاحقاً';
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 400 }
    );
  }
}
