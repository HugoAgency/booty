import { describe, it, expect, beforeEach } from 'vitest';
import { checkRateLimit, recordRateLimitAttempt, resetRateLimit } from '@/lib/rate-limit';

describe('Brute-force Rate Limiter', () => {
  const testKey = 'test_ip_127_0_0_1';

  beforeEach(() => {
    resetRateLimit(testKey);
  });

  it('allows requests within rate limits', () => {
    const initialCheck = checkRateLimit(testKey, 5, 60000);
    expect(initialCheck.allowed).toBe(true);
    expect(initialCheck.remaining).toBe(5);

    const firstAttempt = recordRateLimitAttempt(testKey, 60000);
    expect(firstAttempt.allowed).toBe(true);
    expect(firstAttempt.remaining).toBe(4);
  });

  it('blocks requests after exceeding maximum attempts', () => {
    // Record 5 attempts
    for (let i = 1; i <= 5; i++) {
      const res = recordRateLimitAttempt(testKey, 60000);
      expect(res.allowed).toBe(true);
    }

    // 6th attempt should be blocked
    const blockedAttempt = recordRateLimitAttempt(testKey, 60000);
    expect(blockedAttempt.allowed).toBe(false);
    expect(blockedAttempt.remaining).toBe(0);

    const check = checkRateLimit(testKey, 5, 60000);
    expect(check.allowed).toBe(false);
  });

  it('resets attempts after resetRateLimit is called', () => {
    for (let i = 0; i < 5; i++) {
      recordRateLimitAttempt(testKey, 60000);
    }
    expect(checkRateLimit(testKey, 5, 60000).allowed).toBe(false);

    resetRateLimit(testKey);
    expect(checkRateLimit(testKey, 5, 60000).allowed).toBe(true);
  });
});
