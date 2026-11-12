import type { APIRoute } from "astro";
import { errorResponse, jsonResponse } from "../../lib/errors";
import {
  type KvLike,
  checkAndIncrementRateLimit,
  getIdempotentResult,
  setIdempotentResult,
} from "../../lib/rate-limit";
import {
  type ServiceAccountCredentials,
  appendBookingToSheets,
} from "../../lib/sheets";
import { type ValidatedBooking, validateBooking } from "../../lib/validate";

export const prerender = false;

export interface BookingEnv {
  DEMO_SPREADSHEET_ID?: string;
  GOOGLE_SERVICE_ACCOUNT_JSON?: string;
  GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
  PUBLIC_DEMO_WA_NUMBER?: string;
  RATE_LIMIT_KV?: KvLike;
}

function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
  return "127.0.0.1";
}

function generateBookingId(): string {
  const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = "";
  for (const b of bytes) {
    code += alphabet[b % alphabet.length];
  }
  return `BK-${code}`;
}

export function buildWhatsappLink(
  waNumber: string,
  booking: ValidatedBooking,
  bookingId?: string,
): string {
  const cleanTarget = waNumber.replace(/\D/g, "") || "6281234567890";
  const prefix = bookingId ? `[${bookingId}] ` : "";
  const msg = `${prefix}Halo Aurelia Skin Clinic [DEMO], saya ${booking.customer_name} ingin konfirmasi booking ${booking.treatment.name} pada ${booking.booking_date} jam ${booking.booking_slot} WIB.`;
  return `https://wa.me/${cleanTarget}?text=${encodeURIComponent(msg)}`;
}

function parseServiceAccount(
  rawJson: string | undefined,
  fallbackEmail?: string,
  fallbackKey?: string,
): ServiceAccountCredentials | null {
  if (fallbackEmail && fallbackKey) {
    return {
      client_email: fallbackEmail.trim(),
      private_key: fallbackKey.replace(/\\n/g, "\n").trim(),
    };
  }

  if (!rawJson) return null;
  let text = rawJson.trim();

  // Try base64 decode if it starts with base64 signature
  if (!text.startsWith("{")) {
    try {
      text = atob(text).trim();
    } catch {
      // not base64
    }
  }

  try {
    const parsed = JSON.parse(text) as Partial<ServiceAccountCredentials>;
    if (
      typeof parsed.client_email === "string" &&
      typeof parsed.private_key === "string"
    ) {
      return {
        client_email: parsed.client_email.trim(),
        private_key: parsed.private_key.replace(/\\n/g, "\n").trim(),
      };
    }
  } catch (err) {
    console.error("Failed to parse GOOGLE_SERVICE_ACCOUNT_JSON:", err);
    return null;
  }
  return null;
}

export async function handleBookingRequest(
  request: Request,
  env: BookingEnv,
  fetchImpl: typeof fetch = fetch,
  now: Date = new Date(),
): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse(422, "VALIDATION_ERROR", "Body JSON tidak valid.", {
      details: [{ field: "body", message: "Payload harus berupa JSON valid." }],
    });
  }

  const ip = getClientIp(request);
  const validation = validateBooking(rawBody, now);
  if (!validation.ok) {
    if (validation.honeypot) {
      console.warn("SECURITY_AUDIT HONEYPOT_TRIGGERED", { ip });
      return errorResponse(400, "HONEYPOT_TRIGGERED", "Request ditolak.");
    }
    return errorResponse(
      422,
      "VALIDATION_ERROR",
      "Periksa kembali isian formulir booking.",
      {
        details: validation.details,
      },
    );
  }

  const idempotencyKey = request.headers.get("x-idempotency-key")?.trim() ?? "";
  if (idempotencyKey) {
    const cached = await getIdempotentResult<{
      booking_id: string;
      wa_link: string;
      partial?: boolean;
    }>(env.RATE_LIMIT_KV, ip, idempotencyKey);
    if (cached) {
      return jsonResponse(201, { success: true, data: cached });
    }
  }

  const rl = await checkAndIncrementRateLimit(
    env.RATE_LIMIT_KV,
    "booking",
    ip,
    3,
    3600,
    now,
  );
  if (!rl.allowed) {
    return errorResponse(
      429,
      "RATE_LIMITED",
      "Batas uji booking tercapai (maks. 3 kali/jam). Anda tetap bisa lanjut konfirmasi via WhatsApp.",
      { retry_after_seconds: rl.retryAfterSeconds },
      { "Retry-After": String(rl.retryAfterSeconds) },
    );
  }

  const bookingId = generateBookingId();
  const waTarget = env.PUBLIC_DEMO_WA_NUMBER ?? "6281234567890";
  const waLink = buildWhatsappLink(waTarget, validation.data, bookingId);
  const spreadsheetId = env.DEMO_SPREADSHEET_ID ?? "";
  const sa = parseServiceAccount(
    env.GOOGLE_SERVICE_ACCOUNT_JSON,
    env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  );

  if (!spreadsheetId || !sa) {
    console.error("Sheets configuration missing", {
      hasSheetId: Boolean(spreadsheetId),
      hasSa: Boolean(sa),
    });
    return errorResponse(
      502,
      "SHEET_WRITE_FAILED",
      "Koneksi ke Google Sheet Demo belum terkonfigurasi. Gunakan fallback WhatsApp di bawah.",
      { wa_link: buildWhatsappLink(waTarget, validation.data) },
    );
  }

  const appendResult = await appendBookingToSheets(
    {
      spreadsheetId,
      serviceAccount: sa,
      bookingId,
      booking: validation.data,
      now,
    },
    fetchImpl,
  );

  if (!appendResult.ok) {
    return errorResponse(
      502,
      "SHEET_WRITE_FAILED",
      "Koneksi ke pencatat demo gagal. Data Anda tetap aman — coba lagi atau lanjut via WhatsApp.",
      { wa_link: buildWhatsappLink(waTarget, validation.data) },
    );
  }

  const payload = {
    booking_id: bookingId,
    wa_link: waLink,
    partial: appendResult.partial,
  };

  if (idempotencyKey) {
    await setIdempotentResult(
      env.RATE_LIMIT_KV,
      ip,
      idempotencyKey,
      payload,
      900,
    );
  }

  return jsonResponse(201, { success: true, data: payload });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const runtimeEnv =
    (locals as { runtime?: { env?: BookingEnv } }).runtime?.env ?? {};
  const env: BookingEnv = {
    DEMO_SPREADSHEET_ID:
      runtimeEnv.DEMO_SPREADSHEET_ID ?? import.meta.env.DEMO_SPREADSHEET_ID,
    GOOGLE_SERVICE_ACCOUNT_JSON:
      runtimeEnv.GOOGLE_SERVICE_ACCOUNT_JSON ??
      import.meta.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    GOOGLE_SERVICE_ACCOUNT_EMAIL:
      runtimeEnv.GOOGLE_SERVICE_ACCOUNT_EMAIL ??
      import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY:
      runtimeEnv.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ??
      import.meta.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    PUBLIC_DEMO_WA_NUMBER:
      runtimeEnv.PUBLIC_DEMO_WA_NUMBER ?? import.meta.env.PUBLIC_DEMO_WA_NUMBER,
    RATE_LIMIT_KV: runtimeEnv.RATE_LIMIT_KV,
  };
  return handleBookingRequest(request, env);
};
