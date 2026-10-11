import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authorizePermission } from '@/lib/rbac';
import { UpdateAdminUserSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const authCheck = await authorizePermission('users:manage');
  if (!authCheck.authorized) return authCheck.response;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  try {
    const body = await req.json();
    const parsed = UpdateAdminUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'بيانات التحديث غير صالحة', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const targetUser = await prisma.adminUser.findUnique({
      where: { id: params.id },
    });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Safety constraint: Cannot deactivate or change own role if self
    if (params.id === authCheck.session.adminId) {
      if (parsed.data.isActive === false) {
        return NextResponse.json(
          { success: false, error: 'لا يمكنك تعطيل حسابك الشخصي الحالي / Cannot deactivate self' },
          { status: 400 }
        );
      }
      if (parsed.data.role && parsed.data.role !== targetUser.role) {
        return NextResponse.json(
          { success: false, error: 'لا يمكنك تغيير صلاحيات حسابك الشخصي / Cannot modify own role' },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (parsed.data.name !== undefined) updateData.name = parsed.data.name;
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email || null;
    if (parsed.data.role !== undefined) updateData.role = parsed.data.role;
    if (parsed.data.isActive !== undefined) updateData.isActive = parsed.data.isActive;

    if (parsed.data.password) {
      updateData.passwordHash = await bcrypt.hash(parsed.data.password, 12);
    }

    const updated = await prisma.adminUser.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await logAuditEvent({
      adminId: authCheck.session.adminId,
      username: authCheck.session.username,
      action: 'USER_UPDATED',
      ipAddress: ip,
      details: `Updated user ${targetUser.username}: ${JSON.stringify(Object.keys(updateData))}`,
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (error: any) {
    console.error('Error updating admin user:', error);
    return NextResponse.json({ success: false, error: error.message || 'فشل تحديث المستخدم' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const authCheck = await authorizePermission('users:manage');
  if (!authCheck.authorized) return authCheck.response;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  try {
    if (params.id === authCheck.session.adminId) {
      return NextResponse.json(
        { success: false, error: 'لا يمكنك حذف أو تعطيل حسابك الشخصي الحالي' },
        { status: 400 }
      );
    }

    const targetUser = await prisma.adminUser.findUnique({
      where: { id: params.id },
    });
    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Soft delete: deactivate user
    await prisma.adminUser.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await logAuditEvent({
      adminId: authCheck.session.adminId,
      username: authCheck.session.username,
      action: 'USER_DEACTIVATED',
      ipAddress: ip,
      details: `Deactivated user ${targetUser.username}`,
    });

    return NextResponse.json({ success: true, message: 'تم تعطيل المستخدم بنجاح' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || 'فشل حذف المستخدم' }, { status: 500 });
  }
}
