import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { AdminLoginSchema } from '@/lib/validations';
import { createAdminToken, AUTH_COOKIE_NAME } from '@/lib/auth';
import { checkRateLimit, recordRateLimitAttempt, resetRateLimit } from '@/lib/rate-limit';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  try {
    const body = await req.json();
    const parsed = AdminLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور بشكل صحيح' },
        { status: 400 }
      );
    }

    const { username, password } = parsed.data;
    const rateLimitKey = `login:${ip}:${username.toLowerCase()}`;

    // 1. Check Rate Limiter
    const rateCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      await logAuditEvent({
        username,
        action: 'LOGIN_FAILURE',
        ipAddress: ip,
        details: `Blocked by rate limiter. Reset in ${rateCheck.resetInSeconds}s.`,
      });

      return NextResponse.json(
        {
          success: false,
          error: `تم تجاوز الحد الأقصى للمحاولات الفاشلة. يرجى الانتظار لمدة ${Math.ceil(
            rateCheck.resetInSeconds / 60
          )} دقيقة قبل المحاولة مجدداً / Too many failed login attempts`,
        },
        { status: 429 }
      );
    }

    // 2. Lookup Admin
    const admin = await prisma.adminUser.findUnique({
      where: { username },
    });

    if (!admin) {
      recordRateLimitAttempt(rateLimitKey);
      await logAuditEvent({
        username,
        action: 'LOGIN_FAILURE',
        ipAddress: ip,
        details: 'User does not exist',
      });

      return NextResponse.json(
        { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // 3. Verify Account Active Status
    if (!admin.isActive) {
      await logAuditEvent({
        adminId: admin.id,
        username: admin.username,
        action: 'LOGIN_FAILURE',
        ipAddress: ip,
        details: 'Account is deactivated',
      });

      return NextResponse.json(
        { success: false, error: 'هذا الحساب معطل حالياً، يرجى التواصل مع المسؤول الرئيسي / Account deactivated' },
        { status: 403 }
      );
    }

    // 4. Verify Password Hash
    const isMatch = await bcrypt.compare(password, admin.passwordHash);
    if (!isMatch) {
      const attempt = recordRateLimitAttempt(rateLimitKey);
      await logAuditEvent({
        adminId: admin.id,
        username: admin.username,
        action: 'LOGIN_FAILURE',
        ipAddress: ip,
        details: `Invalid password. ${attempt.remaining} attempts remaining.`,
      });

      return NextResponse.json(
        {
          success: false,
          error: 'اسم المستخدم أو كلمة المرور غير صحيحة',
          remainingAttempts: attempt.remaining,
        },
        { status: 401 }
      );
    }

    // 5. Successful Authentication: Reset Rate Limit & Update lastLoginAt
    resetRateLimit(rateLimitKey);

    await prisma.adminUser.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    await logAuditEvent({
      adminId: admin.id,
      username: admin.username,
      action: 'LOGIN_SUCCESS',
      ipAddress: ip,
      details: `Successful login as ${admin.role}`,
    });

    const token = await createAdminToken({
      adminId: admin.id,
      username: admin.username,
      role: admin.role,
    });

    const response = NextResponse.json({
      success: true,
      user: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        role: admin.role,
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'حدث خطأ في النظام' },
      { status: 500 }
    );
  }
}
