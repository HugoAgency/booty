import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { authorizePermission } from '@/lib/rbac';
import { CreateAdminUserSchema } from '@/lib/validations';
import { logAuditEvent } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authCheck = await authorizePermission('users:manage');
  if (!authCheck.authorized) return authCheck.response;

  try {
    const users = await prisma.adminUser.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    return NextResponse.json({ success: false, error: 'فشل جلب قائمة المستخدمين' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await authorizePermission('users:manage');
  if (!authCheck.authorized) return authCheck.response;

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

  try {
    const body = await req.json();
    const parsed = CreateAdminUserSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'بيانات المستخدم غير صالحة';
      return NextResponse.json({ success: false, error: firstError }, { status: 400 });
    }

    const { username, name, email, password, role } = parsed.data;

    // Check existing username
    const existing = await prisma.adminUser.findUnique({
      where: { username },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'اسم المستخدم مستخدم مسبقاً / Username already exists' },
        { status: 400 }
      );
    }

    // Check existing email if provided
    if (email) {
      const existingEmail = await prisma.adminUser.findUnique({
        where: { email },
      });
      if (existingEmail) {
        return NextResponse.json(
          { success: false, error: 'البريد الإلكتروني مسجل مسبقاً / Email already exists' },
          { status: 400 }
        );
      }
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const newUser = await prisma.adminUser.create({
      data: {
        username,
        name,
        email: email || null,
        passwordHash,
        role,
        isActive: true,
      },
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
      action: 'USER_CREATED',
      ipAddress: ip,
      details: `Created new admin user: ${username} with role ${role}`,
    });

    return NextResponse.json({ success: true, user: newUser }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating admin user:', error);
    return NextResponse.json({ success: false, error: error.message || 'فشل إنشاء المستخدم' }, { status: 500 });
  }
}
