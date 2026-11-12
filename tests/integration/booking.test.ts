import { describe, expect, it, vi } from "vitest";
import type { KvLike } from "../../src/lib/rate-limit";
import { handleBookingRequest } from "../../src/pages/api/booking";

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

function makeReq(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request("https://demo.local/api/booking", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "cf-connecting-ip": "203.0.113.10",
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

const VALID_BODY = {
  treatment_id: "laser-1",
  booking_date: "2026-11-14",
  booking_slot: "14:00",
  customer_name: "Rina Lestari",
  whatsapp: "081234567890",
  notes: "Kulit sensitif",
  company_website: "",
};

async function createTestEnv() {
  const pair = (await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  )) as CryptoKeyPair;
  const pkcs8 = new Uint8Array(
    await crypto.subtle.exportKey("pkcs8", pair.privateKey),
  );
  let bin = "";
  for (const b of pkcs8) bin += String.fromCharCode(b);
  const pem = `-----BEGIN PRIVATE KEY-----\n${btoa(bin)}\n-----END PRIVATE KEY-----`;
  return {
    DEMO_SPREADSHEET_ID: "sheet-demo-id",
    GOOGLE_SERVICE_ACCOUNT_JSON: JSON.stringify({
      client_email: "demo-sa@test.iam.gserviceaccount.com",
      private_key: pem,
    }),
    PUBLIC_DEMO_WA_NUMBER: "6281200001111",
    RATE_LIMIT_KV: createMemoryKv(),
  };
}

describe("POST /api/booking integration", () => {
  it("returns 201 with booking_id and prefilled wa_link, and honors X-Idempotency-Key", async () => {
    const env = await createTestEnv();
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes("oauth2.googleapis.com/token")) {
        return new Response(
          JSON.stringify({ access_token: "ya29.ok", expires_in: 3600 }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ updates: { updatedRows: 1 } }), {
        status: 200,
      });
    });
    const now = new Date("2026-11-12T05:00:00Z");

    const res1 = await handleBookingRequest(
      makeReq(VALID_BODY, { "X-Idempotency-Key": "idem-1" }),
      env,
      fetchMock as unknown as typeof fetch,
      now,
    );
    expect(res1.status).toBe(201);
    const json1 = (await res1.json()) as {
      success: boolean;
      data: { booking_id: string; wa_link: string };
    };
    expect(json1.success).toBe(true);
    expect(json1.data.booking_id).toMatch(/^BK-[A-Z0-9]{6}$/);
    expect(json1.data.wa_link).toContain("https://wa.me/6281200001111");
    expect(json1.data.wa_link).toContain(json1.data.booking_id);

    const callsAfterFirst = fetchMock.mock.calls.length;
    const res2 = await handleBookingRequest(
      makeReq(VALID_BODY, { "X-Idempotency-Key": "idem-1" }),
      env,
      fetchMock as unknown as typeof fetch,
      now,
    );
    expect(res2.status).toBe(201);
    const json2 = (await res2.json()) as { data: { booking_id: string } };
    expect(json2.data.booking_id).toBe(json1.data.booking_id);
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
  });

  it("returns 400 HONEYPOT_TRIGGERED when company_website is filled", async () => {
    const env = await createTestEnv();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const res = await handleBookingRequest(
      makeReq({ ...VALID_BODY, company_website: "http://bot.example" }),
      env,
      fetch,
      new Date("2026-11-12T05:00:00Z"),
    );
    expect(res.status).toBe(400);
    const json = (await res.json()) as { error: { code: string } };
    expect(json.error.code).toBe("HONEYPOT_TRIGGERED");
    warnSpy.mockRestore();
  });

  it("returns 422 VALIDATION_ERROR with field details on bad input", async () => {
    const env = await createTestEnv();
    const res = await handleBookingRequest(
      makeReq({ ...VALID_BODY, whatsapp: "12345" }),
      env,
      fetch,
      new Date("2026-11-12T05:00:00Z"),
    );
    expect(res.status).toBe(422);
    const json = (await res.json()) as {
      error: { code: string; details: { field: string }[] };
    };
    expect(json.error.code).toBe("VALIDATION_ERROR");
    expect(json.error.details[0].field).toBe("whatsapp");
  });

  it("returns 429 RATE_LIMITED after 3 bookings/hour from same IP", async () => {
    const env = await createTestEnv();
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes("oauth2.googleapis.com/token")) {
        return new Response(
          JSON.stringify({ access_token: "ya29.ok", expires_in: 3600 }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ updates: { updatedRows: 1 } }), {
        status: 200,
      });
    });
    const now = new Date("2026-11-12T05:00:00Z");

    for (let i = 0; i < 3; i++) {
      const ok = await handleBookingRequest(
        makeReq(VALID_BODY),
        env,
        fetchMock as unknown as typeof fetch,
        now,
      );
      expect(ok.status).toBe(201);
    }
    const blocked = await handleBookingRequest(
      makeReq(VALID_BODY),
      env,
      fetchMock as unknown as typeof fetch,
      now,
    );
    expect(blocked.status).toBe(429);
    const json = (await blocked.json()) as {
      error: { code: string; retry_after_seconds: number };
    };
    expect(json.error.code).toBe("RATE_LIMITED");
    expect(json.error.retry_after_seconds).toBeGreaterThan(0);
  });

  it("returns 502 SHEET_WRITE_FAILED with prefilled wa_link when Google Sheets fails", async () => {
    const env = await createTestEnv();
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      if (String(url).includes("oauth2.googleapis.com/token")) {
        return new Response(
          JSON.stringify({ access_token: "ya29.ok", expires_in: 3600 }),
          { status: 200 },
        );
      }
      return new Response("down", { status: 503 });
    });

    const res = await handleBookingRequest(
      makeReq(VALID_BODY),
      env,
      fetchMock as unknown as typeof fetch,
      new Date("2026-11-12T05:00:00Z"),
    );
    expect(res.status).toBe(502);
    const json = (await res.json()) as {
      error: { code: string; wa_link: string };
    };
    expect(json.error.code).toBe("SHEET_WRITE_FAILED");
    expect(json.error.wa_link).toContain("https://wa.me/6281200001111");
    errSpy.mockRestore();
  });
});
