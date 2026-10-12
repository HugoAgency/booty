import { Prisma } from '@prisma/client';

export function classifyStatsError(error: unknown) {
  const databaseCode = error instanceof Prisma.PrismaClientKnownRequestError ? error.code
    : error instanceof Prisma.PrismaClientInitializationError ? error.errorCode : undefined;
  if (databaseCode === 'P2021' || databaseCode === 'P2022') {
    return { status: 503, code: 'DATABASE_SCHEMA_MISMATCH', databaseCode,
      error: 'تعذر جلب الإحصائيات لأن تحديث قاعدة البيانات لم يكتمل. يلزم إكمال تحديث قاعدة البيانات في إعدادات النشر.' };
  }
  if (databaseCode && ['P1001', 'P1002', 'P1008', 'P1017', 'P2024', 'P2037'].includes(databaseCode)) {
    return { status: 503, code: 'DATABASE_UNAVAILABLE', databaseCode,
      error: 'تعذر الاتصال بقاعدة البيانات لجلب الإحصائيات. أعد المحاولة بعد قليل؛ إذا استمر الخطأ، راجع اتصال قاعدة البيانات في إعدادات النشر.' };
  }
  return { status: 500, code: 'STATS_READ_FAILED', databaseCode,
    error: 'فشل جلب الإحصائيات. أعد المحاولة؛ إذا استمر الخطأ، راجع سجل الخادم.' };
}
