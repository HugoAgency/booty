import { describe, it, expect } from 'vitest';
import { createAdminToken, verifyAdminToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';

describe('Admin Authentication & JWT Security', () => {
  it('signs and verifies valid admin tokens correctly', async () => {
    const payload = {
      adminId: 'admin_123',
      username: 'superuser',
      role: 'SUPER_ADMIN',
    };

    const token = await createAdminToken(payload);
    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);

    const decoded = await verifyAdminToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.adminId).toBe(payload.adminId);
    expect(decoded?.username).toBe(payload.username);
    expect(decoded?.role).toBe(payload.role);
  });

  it('rejects tampered or malformed tokens', async () => {
    const payload = {
      adminId: 'admin_123',
      username: 'attacker',
      role: 'SUPER_ADMIN',
    };

    const token = await createAdminToken(payload);
    const tampered = token.slice(0, -6) + 'xyz123';

    const result = await verifyAdminToken(tampered);
    expect(result).toBeNull();

    const garbageResult = await verifyAdminToken('invalid.token.here');
    expect(garbageResult).toBeNull();
  });

  it('hashes passwords with bcrypt and verifies them securely', async () => {
    const rawPassword = 'StrongPassword!2026';
    const hash = await bcrypt.hash(rawPassword, 10);

    const match = await bcrypt.compare(rawPassword, hash);
    expect(match).toBe(true);

    const mismatch = await bcrypt.compare('WrongPassword!2026', hash);
    expect(mismatch).toBe(false);
  });
});
