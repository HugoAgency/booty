interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    memoryStore.forEach((record, key) => {
      if (now > record.resetAt) {
        memoryStore.delete(key);
      }
    });
  }, 5 * 60 * 1000).unref?.();
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  const record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    return {
      allowed: true,
      remaining: maxAttempts,
      resetInSeconds: Math.ceil(windowMs / 1000),
    };
  }

  const remaining = Math.max(0, maxAttempts - record.count);
  const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

  return {
    allowed: record.count < maxAttempts,
    remaining,
    resetInSeconds,
  };
}

export function recordRateLimitAttempt(
  key: string,
  windowMs: number = 15 * 60 * 1000
): RateLimitResult {
  const now = Date.now();
  let record = memoryStore.get(key);

  if (!record || now > record.resetAt) {
    record = {
      count: 1,
      resetAt: now + windowMs,
    };
  } else {
    record.count += 1;
  }

  memoryStore.set(key, record);

  const maxAttempts = 5;
  const remaining = Math.max(0, maxAttempts - record.count);
  const resetInSeconds = Math.max(1, Math.ceil((record.resetAt - now) / 1000));

  return {
    allowed: record.count <= maxAttempts,
    remaining,
    resetInSeconds,
  };
}

export function resetRateLimit(key: string): void {
  memoryStore.delete(key);
}
