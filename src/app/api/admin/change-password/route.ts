import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAdminSession } from '@/lib/auth';
import { ChangePasswordSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ success: false, error: 'غير مصرح / Unauthorized' }, { status: 401 });
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  try {
    const body = await req.json();
    const parsed = ChangePasswordSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'بيانات كلمة المرور غير صالحة';
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const { currentPassword, newPassword } = parsed.data;

    const user = await prisma.adminUser.findUnique({
      where: { id: session.adminId },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: 'المستخدم غير موجود' }, { status: 404 });
    }

    // Verify current password
    const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isCurrentValid) {
      await logAuditEvent({
        adminId: user.id,
        username: user.username,
        action: 'PASSWORD_CHANGED',
        ipAddress: ip,
        details: 'Failed attempt: Current password incorrect',
      });

      return NextResponse.json(
        { success: false, error: 'كلمة المرور الحالية غير صحيحة / Current password incorrect' },
        { status: 400 }
      );
    }

    // Prevent reusing current password
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return NextResponse.json(
        { success: false, error: 'كلمة المرور الجديدة يجب أن تكون مختلفة عن كلمة المرور الحالية' },
        { status: 400 }
      );
    }

    // Hash and update
    const newHash = await bcrypt.hash(newPassword, 12);
    await prisma.adminUser.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    await logAuditEvent({
      adminId: user.id,
      username: user.username,
      action: 'PASSWORD_CHANGED',
      ipAddress: ip,
      details: 'Password successfully updated by user',
    });

    return NextResponse.json({
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح / Password changed successfully',
    });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ في النظام' }, { status: 500 });
  }
}
