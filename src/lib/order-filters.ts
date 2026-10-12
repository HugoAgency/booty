import type { Prisma } from '@prisma/client';

export class OrderFilterError extends Error {}

// Use the store's calendar day, independently of the server's UTC timezone.
function dayStart(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new OrderFilterError('تاريخ التصفية غير صالح');
  const wall = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(wall) || new Date(wall).toISOString().slice(0, 10) !== value) throw new OrderFilterError('تاريخ التصفية غير صالح');
  const formatter = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Amman',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  let instant = wall;
  for (let attempt = 0; attempt < 4; attempt++) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(part => [part.type, part.value]));
    const displayed = Date.parse(`${parts.year.padStart(4, '0')}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`);
    const correction = wall - displayed;
    if (!correction) return new Date(instant);
    instant += correction;
  }
  throw new OrderFilterError('تعذر تحديد بداية هذا اليوم؛ اختر فترة أخرى');
}

export function buildOrderWhere(params: URLSearchParams): Prisma.OrderWhereInput {
  const search = params.get('search')?.trim();
  const status = params.get('status')?.trim();
  const start = params.get('startDate');
  const end = params.get('endDate');
  const where: Prisma.OrderWhereInput = {};
  if (status) {
    if (!['NEW', 'PROCESSING', 'COMPLETED', 'CANCELLED'].includes(status)) throw new OrderFilterError('حالة التصفية غير صالحة');
    where.status = status as 'NEW' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  }
  if (search) where.OR = ['orderNumber', 'customerName', 'customerPhone', 'city'].map(field => ({ [field]: { contains: search, mode: 'insensitive' } }));
  if (start || end) {
    const gte = start ? dayStart(start) : undefined;
    if (end) dayStart(end); // Validate before deriving the following calendar day.
    if (start && end && start > end) throw new OrderFilterError('تاريخ البداية يجب ألا يتجاوز تاريخ النهاية');
    const nextDay = end ? new Date(Date.parse(`${end}T00:00:00Z`) + 86400000).toISOString().slice(0, 10) : null;
    where.createdAt = { ...(gte ? { gte } : {}), ...(nextDay ? { lt: dayStart(nextDay) } : {}) };
  }
  return where;
}
