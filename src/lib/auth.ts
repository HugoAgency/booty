import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const DEFAULT_SECRET = 'tbr-secure-super-jwt-secret-key-booty-2026-republic';
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || DEFAULT_SECRET);
export const AUTH_COOKIE_NAME = 'tbr_admin_session';

export interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  name?: string;
}

export async function createAdminToken(payload: AdminTokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('12h')
    .sign(JWT_SECRET);
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    });
    return payload as unknown as AdminTokenPayload;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminTokenPayload | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;
    const identity = await verifyAdminToken(token);
    if (!identity?.adminId) return null;
    const user = await prisma.adminUser.findUnique({
      where: { id: identity.adminId },
      select: { id: true, username: true, name: true, role: true, isActive: true },
    });
    if (!user || !user.isActive || user.username !== identity.username
      || !['SUPER_ADMIN', 'ADMIN', 'SUPPORT'].includes(user.role)) return null;
    return { adminId: user.id, username: user.username, name: user.name, role: user.role };
  } catch {
    return null;
  }
}
