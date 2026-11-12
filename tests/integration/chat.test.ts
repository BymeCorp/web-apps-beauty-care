import { describe, expect, it, vi } from "vitest";
import type { KvLike } from "../../src/lib/rate-limit";
import { handleChatRequest } from "../../src/pages/api/chat";

function createMemoryKv(): KvLike {
  const store = new Map<string, string>();
  return {
    async get(k: string) {
      return store.get(k) ?? null;
    },
    async put(k: string, v: string) {
      store.set(k, v);
    },
  };
}

function makeReq(body: unknown, ip = "198.51.100.7"): Request {
  return new Request("https://demo.local/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", "cf-connecting-ip": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/chat integration", () => {
  it("returns 200 grounded reply on valid question", async () => {
    const kv = createMemoryKv();
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: "Pico Laser Brightening Rp 1.250.000 (30 menit).",
                },
              },
            ],
          }),
          { status: 200 },
        ),
    );
    const res = await handleChatRequest(
      makeReq({
        messages: [{ role: "user", content: "Berapa harga Pico Laser?" }],
      }),
      {
        AI_BASE_URL: "https://tokenharbor.ai/v1",
        AI_API_KEY: "k",
        AI_MODEL: "deepseek-v4.1-flash:free",
        PUBLIC_DEMO_WA_NUMBER: "6281200001111",
        RATE_LIMIT_KV: kv,
      },
      fetchMock as unknown as typeof fetch,
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      success: boolean;
      data: { reply: string; grounded: boolean };
    };
    expect(json.success).toBe(true);
    expect(json.data.grounded).toBe(true);
    expect(json.data.reply).toContain("Rp 1.250.000");
  });

  it("returns 422 on empty or invalid messages", async () => {
    const res = await handleChatRequest(
      makeReq({ messages: [{ role: "user", content: "" }] }),
      {
        RATE_LIMIT_KV: createMemoryKv(),
      },
    );
    expect(res.status).toBe(422);
  });

  it("returns 429 after 15 requests/hour per IP", async () => {
    const kv = createMemoryKv();
    const now = new Date("2026-11-12T08:00:00Z");
    const env = {
      DISABLE_AI: "true",
      PUBLIC_DEMO_WA_NUMBER: "6281200001111",
      RATE_LIMIT_KV: kv,
    };
    for (let i = 0; i < 15; i++) {
      const ok = await handleChatRequest(
        makeReq({ messages: [{ role: "user", content: "Jam buka?" }] }),
        env,
        fetch,
        now,
      );
      expect(ok.status).toBe(200);
    }
    const limited = await handleChatRequest(
      makeReq({ messages: [{ role: "user", content: "Jam buka?" }] }),
      env,
      fetch,
      now,
    );
    expect(limited.status).toBe(429);
  });

  it("returns 504 with deterministic fallback payload when LLM fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi.fn(async () => new Response("bad", { status: 500 }));
    const res = await handleChatRequest(
      makeReq({ messages: [{ role: "user", content: "Harga facial?" }] }),
      {
        AI_BASE_URL: "https://tokenharbor.ai/v1",
        AI_API_KEY: "k",
        PUBLIC_DEMO_WA_NUMBER: "6281200001111",
        RATE_LIMIT_KV: createMemoryKv(),
      },
      fetchMock as unknown as typeof fetch,
    );
    expect(res.status).toBe(504);
    const json = (await res.json()) as {
      success: boolean;
      error: { code: string };
      data: { fallback: string; wa_link: string };
    };
    expect(json.success).toBe(false);
    expect(json.error.code).toBe("AI_TIMEOUT");
    expect(json.data.fallback).toContain("09:00");
    expect(json.data.wa_link).toContain("https://wa.me/6281200001111");
    warnSpy.mockRestore();
  });
});
