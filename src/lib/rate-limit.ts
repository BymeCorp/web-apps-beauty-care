export interface KvLike {
  get(key: string): Promise<string | null>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const memoryWindow = new Map<string, { count: number; expiresAt: number }>();
const memoryIdem = new Map<string, { value: string; expiresAt: number }>();

function getWindowBucket(
  nowMs: number,
  windowSeconds: number,
): { bucket: number; retryAfter: number } {
  const windowMs = windowSeconds * 1000;
  const bucket = Math.floor(nowMs / windowMs);
  const nextBoundary = (bucket + 1) * windowMs;
  return {
    bucket,
    retryAfter: Math.max(1, Math.ceil((nextBoundary - nowMs) / 1000)),
  };
}

function checkMemoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
  nowMs: number,
): RateLimitResult {
  const { retryAfter } = getWindowBucket(nowMs, windowSeconds);
  const existing = memoryWindow.get(key);
  if (!existing || existing.expiresAt <= nowMs) {
    memoryWindow.set(key, {
      count: 1,
      expiresAt: nowMs + windowSeconds * 1000,
    });
    return {
      allowed: true,
      remaining: Math.max(0, limit - 1),
      retryAfterSeconds: retryAfter,
    };
  }
  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((existing.expiresAt - nowMs) / 1000),
      ),
    };
  }
  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((existing.expiresAt - nowMs) / 1000),
    ),
  };
}

export async function checkAndIncrementRateLimit(
  kv: KvLike | undefined | null,
  bucketName: string,
  ip: string,
  limit: number,
  windowSeconds: number,
  now: Date = new Date(),
): Promise<RateLimitResult> {
  const nowMs = now.getTime();
  const { bucket, retryAfter } = getWindowBucket(nowMs, windowSeconds);
  const key = `rl:${bucketName}:${ip}:${bucket}`;

  if (!kv) {
    return checkMemoryRateLimit(key, limit, windowSeconds, nowMs);
  }

  try {
    const raw = await kv.get(key);
    const current = raw ? Number.parseInt(raw, 10) || 0 : 0;
    if (current >= limit) {
      return { allowed: false, remaining: 0, retryAfterSeconds: retryAfter };
    }
    const next = current + 1;
    await kv.put(key, String(next), { expirationTtl: windowSeconds + 60 });
    return {
      allowed: true,
      remaining: Math.max(0, limit - next),
      retryAfterSeconds: retryAfter,
    };
  } catch (err) {
    console.error(
      "KV rate-limit error, fail-open to memory:",
      err instanceof Error ? err.message : String(err),
    );
    return checkMemoryRateLimit(key, limit, windowSeconds, nowMs);
  }
}

export async function getIdempotentResult<T>(
  kv: KvLike | undefined | null,
  ip: string,
  idempotencyKey: string,
): Promise<T | null> {
  if (!idempotencyKey) return null;
  const key = `idem:${ip}:${idempotencyKey}`;
  const nowMs = Date.now();
  try {
    if (kv) {
      const raw = await kv.get(key);
      return raw ? (JSON.parse(raw) as T) : null;
    }
  } catch (err) {
    console.error(
      "KV idempotency get error:",
      err instanceof Error ? err.message : String(err),
    );
  }
  const mem = memoryIdem.get(key);
  if (mem && mem.expiresAt > nowMs) {
    return JSON.parse(mem.value) as T;
  }
  return null;
}

export async function setIdempotentResult(
  kv: KvLike | undefined | null,
  ip: string,
  idempotencyKey: string,
  payload: unknown,
  ttlSeconds = 900,
): Promise<void> {
  if (!idempotencyKey) return;
  const key = `idem:${ip}:${idempotencyKey}`;
  const serialized = JSON.stringify(payload);
  memoryIdem.set(key, {
    value: serialized,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
  if (!kv) return;
  try {
    await kv.put(key, serialized, { expirationTtl: ttlSeconds });
  } catch (err) {
    console.error(
      "KV idempotency put error:",
      err instanceof Error ? err.message : String(err),
    );
  }
}
