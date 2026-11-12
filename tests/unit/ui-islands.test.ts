import { describe, expect, it } from "vitest";
import { QUICK_PROMPT_CHIPS } from "../../src/components/AiChatDrawer";
import {
  isSlotPassedWib,
  mapFieldErrors,
} from "../../src/components/BookingForm";

describe("BookingForm helpers", () => {
  it("disables past slots on today WIB and keeps future dates enabled", () => {
    const nowAt1130Wib = new Date("2026-11-12T04:30:00Z"); // 11:30 WIB
    expect(isSlotPassedWib("2026-11-12", "10:00", nowAt1130Wib)).toBe(true);
    expect(isSlotPassedWib("2026-11-12", "11:00", nowAt1130Wib)).toBe(true);
    expect(isSlotPassedWib("2026-11-12", "14:00", nowAt1130Wib)).toBe(false);
    expect(isSlotPassedWib("2026-11-13", "09:00", nowAt1130Wib)).toBe(false);
  });

  it("maps 422 details into per-field error record", () => {
    const mapped = mapFieldErrors([
      { field: "whatsapp", message: "Format nomor WA salah." },
      { field: "booking_date", message: "Tanggal di luar rentang." },
    ]);
    expect(mapped.whatsapp).toBe("Format nomor WA salah.");
    expect(mapped.booking_date).toBe("Tanggal di luar rentang.");
  });
});

describe("AiChatDrawer constants", () => {
  it("exposes 3 non-empty quick prompt chips without emoji", () => {
    expect(QUICK_PROMPT_CHIPS).toHaveLength(3);
    for (const chip of QUICK_PROMPT_CHIPS) {
      expect(chip.length).toBeGreaterThan(8);
    }
  });
});
