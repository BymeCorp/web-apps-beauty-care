import { describe, expect, it, vi } from "vitest";
import {
  type ServiceAccountCredentials,
  appendBookingToSheets,
  maskWhatsapp,
} from "../../src/lib/sheets";
import type { ValidatedBooking } from "../../src/lib/validate";

async function generateTestPrivateKeyPem(): Promise<string> {
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
  const b64 = btoa(bin).replace(/(.{64})/g, "$1\n");
  return `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----`;
}

const SAMPLE_BOOKING: ValidatedBooking = {
  treatment: {
    id: "laser-1",
    category: "Laser",
    name: "Pico Laser Brightening",
    duration_minutes: 30,
    price_idr: 1250000,
    description: "Desc",
    prep_note: "Prep",
  },
  booking_date: "2026-11-14",
  booking_slot: "14:00",
  customer_name: "=SUM(1,1) Rina",
  whatsapp: "6281234567890",
  notes: "+test note",
};

describe("sheets client", () => {
  it("masks whatsapp keeping only last 4 digits", () => {
    expect(maskWhatsapp("6281234567890")).toBe("+62***7890");
  });

  it("signs JWT via WebCrypto, sanitizes cells, and appends to Client_Leads and Appointments", async () => {
    const sa: ServiceAccountCredentials = {
      client_email: "demo-sa@project.iam.gserviceaccount.com",
      private_key: await generateTestPrivateKeyPem(),
    };
    const calls: { url: string; body: string }[] = [];
    const fetchMock = vi.fn(
      async (url: RequestInfo | URL, init?: RequestInit) => {
        const u = String(url);
        calls.push({ url: u, body: String(init?.body ?? "") });
        if (u.includes("oauth2.googleapis.com/token")) {
          return new Response(
            JSON.stringify({ access_token: "ya29.test", expires_in: 3600 }),
            { status: 200 },
          );
        }
        return new Response(JSON.stringify({ updates: { updatedRows: 1 } }), {
          status: 200,
        });
      },
    );

    const res = await appendBookingToSheets(
      {
        spreadsheetId: "sheet-123",
        serviceAccount: sa,
        bookingId: "BK-8K2M4Q",
        booking: SAMPLE_BOOKING,
      },
      fetchMock as unknown as typeof fetch,
    );

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.partial).toBe(false);
    }
    const leadCall = calls.find((c) => c.url.includes("Client_Leads"));
    const apptCall = calls.find((c) => c.url.includes("Appointments"));
    expect(leadCall).toBeDefined();
    expect(apptCall).toBeDefined();
    expect(leadCall?.body).toContain("'=SUM(1,1) Rina");
    expect(apptCall?.body).toContain("Pending Demo");
    expect(leadCall?.body).toContain("'+test note");
  });

  it("returns ok with partial=true if Client_Leads succeeds but Appointments fails", async () => {
    const sa: ServiceAccountCredentials = {
      client_email: "demo-sa@project.iam.gserviceaccount.com",
      private_key: await generateTestPrivateKeyPem(),
    };
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      const u = String(url);
      if (u.includes("oauth2.googleapis.com/token")) {
        return new Response(
          JSON.stringify({ access_token: "ya29.test", expires_in: 3600 }),
          { status: 200 },
        );
      }
      if (u.includes("Client_Leads")) {
        return new Response(JSON.stringify({ updates: { updatedRows: 1 } }), {
          status: 200,
        });
      }
      return new Response("upstream error", { status: 500 });
    });

    const res = await appendBookingToSheets(
      {
        spreadsheetId: "sheet-123",
        serviceAccount: sa,
        bookingId: "BK-PART12",
        booking: SAMPLE_BOOKING,
      },
      fetchMock as unknown as typeof fetch,
    );

    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.partial).toBe(true);
    }
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("returns ok=false when Client_Leads append fails", async () => {
    const sa: ServiceAccountCredentials = {
      client_email: "demo-sa@project.iam.gserviceaccount.com",
      private_key: await generateTestPrivateKeyPem(),
    };
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const fetchMock = vi.fn(async (url: RequestInfo | URL) => {
      const u = String(url);
      if (u.includes("oauth2.googleapis.com/token")) {
        return new Response(
          JSON.stringify({ access_token: "ya29.test", expires_in: 3600 }),
          { status: 200 },
        );
      }
      return new Response("bad gateway", { status: 502 });
    });

    const res = await appendBookingToSheets(
      {
        spreadsheetId: "sheet-123",
        serviceAccount: sa,
        bookingId: "BK-FAIL01",
        booking: SAMPLE_BOOKING,
      },
      fetchMock as unknown as typeof fetch,
    );
    expect(res.ok).toBe(false);
    errSpy.mockRestore();
  });
});
