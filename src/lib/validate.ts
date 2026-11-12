import catalogData from "./catalog.json";

export type TreatmentCategory = "Facial" | "Laser" | "Skin Booster";

export interface TreatmentItem {
  id: string;
  category: TreatmentCategory;
  name: string;
  duration_minutes: number;
  price_idr: number;
  description: string;
  prep_note: string;
}

export const CATALOG: readonly TreatmentItem[] = catalogData as TreatmentItem[];

export const BOOKING_SLOTS = [
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
] as const;

export interface ValidationDetail {
  field: string;
  message: string;
}

export interface ValidatedBooking {
  treatment: TreatmentItem;
  booking_date: string;
  booking_slot: string;
  customer_name: string;
  whatsapp: string;
  notes: string;
}

export type BookingValidationResult =
  | { ok: true; data: ValidatedBooking }
  | { ok: false; honeypot: boolean; details: ValidationDetail[] };

export interface ChatMessageInput {
  role: "user" | "assistant";
  content: string;
}

export type ChatValidationResult =
  | { ok: true; messages: ChatMessageInput[] }
  | { ok: false; details: ValidationDetail[] };

export function formatIdr(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function getTodayWib(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function normalizeWhatsapp(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const cleaned = raw.replace(/[\s\-().]/g, "").trim();
  let digits = "";
  if (cleaned.startsWith("+62")) {
    digits = `62${cleaned.slice(3)}`;
  } else if (cleaned.startsWith("62")) {
    digits = cleaned;
  } else if (cleaned.startsWith("08")) {
    digits = `62${cleaned.slice(1)}`;
  } else {
    return null;
  }
  if (!/^628\d{7,12}$/.test(digits)) {
    return null;
  }
  return digits;
}

export function sanitizeSheetCell(value: string): string {
  if (value.length === 0) return "";
  const first = value[0];
  if (
    first === "=" ||
    first === "+" ||
    first === "-" ||
    first === "@" ||
    first === "\t" ||
    first === "\r"
  ) {
    return `'${value}`;
  }
  return value;
}

export function validateBooking(
  input: unknown,
  now: Date = new Date(),
): BookingValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      honeypot: false,
      details: [{ field: "body", message: "Payload JSON tidak valid." }],
    };
  }
  const body = input as Record<string, unknown>;

  if (
    typeof body.company_website === "string" &&
    body.company_website.trim().length > 0
  ) {
    return { ok: false, honeypot: true, details: [] };
  }

  const details: ValidationDetail[] = [];

  const treatmentId =
    typeof body.treatment_id === "string" ? body.treatment_id.trim() : "";
  const treatment = CATALOG.find((item) => item.id === treatmentId);
  if (!treatment) {
    details.push({
      field: "treatment_id",
      message: "Pilih treatment yang tersedia di katalog.",
    });
  }

  const bookingDate =
    typeof body.booking_date === "string" ? body.booking_date.trim() : "";
  const todayWib = getTodayWib(now);
  const maxDate = addDaysIso(todayWib, 30);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) ||
    bookingDate < todayWib ||
    bookingDate > maxDate
  ) {
    details.push({
      field: "booking_date",
      message: "Pilih tanggal mulai hari ini hingga maksimal 30 hari ke depan.",
    });
  }

  const bookingSlot =
    typeof body.booking_slot === "string" ? body.booking_slot.trim() : "";
  if (!BOOKING_SLOTS.includes(bookingSlot as (typeof BOOKING_SLOTS)[number])) {
    details.push({
      field: "booking_slot",
      message: "Pilih slot jam layanan antara 09:00 hingga 19:00 WIB.",
    });
  }

  const customerName =
    typeof body.customer_name === "string" ? body.customer_name.trim() : "";
  if (customerName.length < 2 || customerName.length > 60) {
    details.push({
      field: "customer_name",
      message: "Nama lengkap wajib diisi (2 hingga 60 karakter).",
    });
  }

  const normalizedWa = normalizeWhatsapp(body.whatsapp);
  if (!normalizedWa) {
    details.push({
      field: "whatsapp",
      message:
        "Format nomor WhatsApp belum sesuai. Gunakan awalan 08 atau +62 (9–15 digit angka).",
    });
  }

  const notes = typeof body.notes === "string" ? body.notes.trim() : "";
  if (notes.length > 160) {
    details.push({
      field: "notes",
      message: "Catatan opsional maksimal 160 karakter.",
    });
  }

  if (details.length > 0 || !treatment || !normalizedWa) {
    return { ok: false, honeypot: false, details };
  }

  return {
    ok: true,
    data: {
      treatment,
      booking_date: bookingDate,
      booking_slot: bookingSlot,
      customer_name: customerName,
      whatsapp: normalizedWa,
      notes,
    },
  };
}

export function validateChatPayload(input: unknown): ChatValidationResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return {
      ok: false,
      details: [{ field: "messages", message: "Payload chat tidak valid." }],
    };
  }
  const rawMsgs = (input as Record<string, unknown>).messages;
  if (!Array.isArray(rawMsgs) || rawMsgs.length === 0) {
    return {
      ok: false,
      details: [{ field: "messages", message: "Minimal 1 pesan diperlukan." }],
    };
  }

  const valid: ChatMessageInput[] = [];
  for (const m of rawMsgs) {
    if (!m || typeof m !== "object") continue;
    const role = (m as Record<string, unknown>).role;
    const content = (m as Record<string, unknown>).content;
    if (
      (role === "user" || role === "assistant") &&
      typeof content === "string"
    ) {
      const trimmed = content.trim();
      if (trimmed.length >= 1 && trimmed.length <= 400) {
        valid.push({ role, content: trimmed });
      }
    }
  }

  const trimmedSlice = valid.slice(-6);
  const last = trimmedSlice[trimmedSlice.length - 1];
  if (!last || last.role !== "user") {
    return {
      ok: false,
      details: [
        {
          field: "messages",
          message: "Pesan terakhir harus dari pengguna (1–400 karakter).",
        },
      ],
    };
  }

  return { ok: true, messages: trimmedSlice };
}
