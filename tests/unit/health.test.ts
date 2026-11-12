import { describe, expect, it } from "vitest";
import { SECURITY_HEADERS } from "../../src/lib/errors";
import { GET } from "../../src/pages/api/health";

describe("GET /api/health", () => {
  it("returns 200 ok with version, ts, and security headers", async () => {
    const res = await GET({} as Parameters<typeof GET>[0]);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(res.headers.get("X-Content-Type-Options")).toBe(
      SECURITY_HEADERS["X-Content-Type-Options"],
    );
    expect(res.headers.get("X-Frame-Options")).toBe(
      SECURITY_HEADERS["X-Frame-Options"],
    );
    const body = (await res.json()) as {
      ok: boolean;
      version: string;
      ts: string;
    };
    expect(body.ok).toBe(true);
    expect(typeof body.version).toBe("string");
    expect(Number.isNaN(Date.parse(body.ts))).toBe(false);
  });
});
