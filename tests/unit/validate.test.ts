import { describe, expect, it } from "vitest";
import catalog from "../../src/lib/catalog.json";
import {
  BOOKING_SLOTS,
  getTodayWib,
  normalizeWhatsapp,
  sanitizeSheetCell,
  validateBooking,
  validateChatPayload,
} from "../../src/lib/validate";

describe("catalog.json", () => {
  it("contains 8 treatments across Facial, Laser, and Skin Booster", () => {
    expect(catalog).toHaveLength(8);
    const categories = new Set(catalog.map((t) => t.category));
    expect(categories).toEqual(new Set(["Facial", "Laser", "Skin Booster"]));
    for (const item of catalog) {
      expect(Number.isInteger(item.price_idr)).toBe(true);
      expect(item.price_idr).toBeGreaterThanOrEqual(350000);
      expect(item.price_idr).toBeLessThanOrEqual(1850000);
      expect(item.duration_minutes).toBeGreaterThan(0);
      expect(item.prep_note.length).toBeGreaterThan(5);
    }
  });
});

describe("normalizeWhatsapp", () => {
  it("normalizes 08, +62, and 62 formats to 628... digits", () => {
    expect(normalizeWhatsapp("0812-3456-7890")).toBe("6281234567890");
    expect(normalizeWhatsapp("+62 812 3456 7890")).toBe("6281234567890");
    expect(normalizeWhatsapp("6281234567890")).toBe("6281234567890");
  });

  it("rejects invalid numbers", () => {
    expect(normalizeWhatsapp("12345")).toBeNull();
    expect(normalizeWhatsapp("071234567890")).toBeNull();
    expect(normalizeWhatsapp("0812")).toBeNull();
  });
});

describe("sanitizeSheetCell", () => {
  it("prefixes single quote for formula injection prefixes", () => {
    expect(sanitizeSheetCell("=CMD('calc')")).toBe("'=CMD('calc')");
    expect(sanitizeSheetCell("+1+1")).toBe("'+1+1");
    expect(sanitizeSheetCell("-2+3")).toBe("'-2+3");
    expect(sanitizeSheetCell("@SUM(A1)")).toBe("'@SUM(A1)");
    expect(sanitizeSheetCell("\tfoo")).toBe("'\tfoo");
    expect(sanitizeSheetCell("\rbar")).toBe("'\rbar");
    expect(sanitizeSheetCell("Rina Lestari")).toBe("Rina Lestari");
  });
});

describe("validateBooking", () => {
  const todayWib = getTodayWib(new Date("2026-11-12T05:00:00Z"));

  it("accepts valid booking payload and returns catalog treatment metadata", () => {
    const res = validateBooking(
      {
        treatment_id: "laser-1",
        booking_date: "2026-11-14",
        booking_slot: "14:00",
        customer_name: "Rina Lestari",
        whatsapp: "+62 812-3456-7890",
        notes: "Kulit sensitif",
        company_website: "",
      },
      new Date("2026-11-12T05:00:00Z"),
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.data.whatsapp).toBe("6281234567890");
      expect(res.data.treatment.id).toBe("laser-1");
      expect(res.data.treatment.price_idr).toBe(1250000);
    }
  });

  it("flags honeypot when company_website is filled", () => {
    const res = validateBooking({
      treatment_id: "laser-1",
      booking_date: todayWib,
      booking_slot: BOOKING_SLOTS[0],
      customer_name: "Bot",
      whatsapp: "081234567890",
      company_website: "https://spam.example",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.honeypot).toBe(true);
    }
  });

  it("returns field errors for invalid whatsapp, unknown treatment, past or >30d date, and bad slot", () => {
    const res = validateBooking(
      {
        treatment_id: "unknown-id",
        booking_date: "2026-12-30",
        booking_slot: "23:00",
        customer_name: "A",
        whatsapp: "12345",
        notes: "x".repeat(161),
      },
      new Date("2026-11-12T05:00:00Z"),
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      const fields = res.details.map((d) => d.field);
      expect(fields).toContain("treatment_id");
      expect(fields).toContain("booking_date");
      expect(fields).toContain("booking_slot");
      expect(fields).toContain("customer_name");
      expect(fields).toContain("whatsapp");
      expect(fields).toContain("notes");
    }
  });
});

describe("validateChatPayload", () => {
  it("keeps at most 6 recent messages and enforces 1-400 char user content", () => {
    const okRes = validateChatPayload({
      messages: [
        { role: "user", content: "1" },
        { role: "assistant", content: "2" },
        { role: "user", content: "3" },
        { role: "assistant", content: "4" },
        { role: "user", content: "5" },
        { role: "assistant", content: "6" },
        { role: "user", content: "Berapa harga Pico Laser?" },
      ],
    });
    expect(okRes.ok).toBe(true);
    if (okRes.ok) {
      expect(okRes.messages).toHaveLength(6);
      expect(okRes.messages[5].content).toBe("Berapa harga Pico Laser?");
    }

    const emptyRes = validateChatPayload({
      messages: [{ role: "user", content: "   " }],
    });
    expect(emptyRes.ok).toBe(false);
  });
});
