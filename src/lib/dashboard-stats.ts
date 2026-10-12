import type { PrismaClient } from '@prisma/client';
import { prisma } from './prisma';

export async function getDashboardStats(database: Pick<PrismaClient, 'order' | 'product'> = prisma) {
  const [totalOrders, pendingOrders, completedOrders, totalRevenue, totalProducts, recentOrders] = await Promise.all([
    database.order.count(),
    database.order.count({ where: { status: 'NEW' } }),
    database.order.count({ where: { status: 'COMPLETED' } }),
    database.order.aggregate({ _sum: { totalAmount: true }, where: { status: { not: 'CANCELLED' } } }),
    database.product.count({ where: { isActive: true } }),
    // The overview needs summaries, not OrderItem/bundle contents or shipping details.
    database.order.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: {
      id: true, orderNumber: true, customerName: true, city: true, totalAmount: true, createdAt: true,
    } }),
  ]);
  return { totalOrders, pendingOrders, completedOrders,
    totalRevenue: Number((totalRevenue._sum.totalAmount || 0).toFixed(2)), totalProducts, recentOrders };
}
