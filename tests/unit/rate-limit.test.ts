import { describe, expect, it, vi } from "vitest";
import {
  type KvLike,
  checkAndIncrementRateLimit,
  getIdempotentResult,
  setIdempotentResult,
} from "../../src/lib/rate-limit";

function createMemoryKv(): KvLike {
  const store = new Map<string, string>();
  return {
    async get(key: string) {
      return store.get(key) ?? null;
    },
    async put(key: string, value: string) {
      store.set(key, value);
    },
  };
}

describe("rate-limit", () => {
  it("allows up to limit per IP and blocks the next call with retry_after_seconds", async () => {
    const kv = createMemoryKv();
    const now = new Date("2026-11-12T10:15:00Z");

    for (let i = 0; i < 3; i++) {
      const r = await checkAndIncrementRateLimit(
        kv,
        "booking",
        "1.2.3.4",
        3,
        3600,
        now,
      );
      expect(r.allowed).toBe(true);
      expect(r.remaining).toBe(2 - i);
    }

    const blocked = await checkAndIncrementRateLimit(
      kv,
      "booking",
      "1.2.3.4",
      3,
      3600,
      now,
    );
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    expect(blocked.retryAfterSeconds).toBeLessThanOrEqual(3600);
  });

  it("fails open to in-memory fallback when KV throws and logs error", async () => {
    const brokenKv: KvLike = {
      async get() {
        throw new Error("KV_DOWN");
      },
      async put() {
        throw new Error("KV_DOWN");
      },
    };
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const r1 = await checkAndIncrementRateLimit(
      brokenKv,
      "booking",
      "9.9.9.9",
      2,
      60,
    );
    const r2 = await checkAndIncrementRateLimit(
      brokenKv,
      "booking",
      "9.9.9.9",
      2,
      60,
    );
    const r3 = await checkAndIncrementRateLimit(
      brokenKv,
      "booking",
      "9.9.9.9",
      2,
      60,
    );

    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
    expect(r3.allowed).toBe(false);
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("stores and retrieves idempotency payload", async () => {
    const kv = createMemoryKv();
    await setIdempotentResult(kv, "1.2.3.4", "uuid-1", {
      booking_id: "BK-123456",
    });
    const cached = await getIdempotentResult<{ booking_id: string }>(
      kv,
      "1.2.3.4",
      "uuid-1",
    );
    expect(cached).toEqual({ booking_id: "BK-123456" });
  });
});
