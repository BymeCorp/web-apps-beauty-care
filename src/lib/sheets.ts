import { type ValidatedBooking, sanitizeSheetCell } from "./validate";

export interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
}

export interface AppendBookingParams {
  spreadsheetId: string;
  serviceAccount: ServiceAccountCredentials;
  bookingId: string;
  booking: ValidatedBooking;
  now?: Date;
}

export type AppendBookingResult =
  | { ok: true; partial: boolean }
  | { ok: false; status: number; message: string };

const SHEETS_SCOPE = "https://www.googleapis.com/auth/spreadsheets";
const SHEETS_TIMEOUT_MS = 10_000;

export function maskWhatsapp(digits: string): string {
  const tail = digits.slice(-4);
  return `+62***${tail}`;
}

export function formatWibTimestamp(now: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  return `${fmt.format(now).replace(" ", "T")}+07:00`;
}

function toBase64Url(input: Uint8Array | string): string {
  const bytes =
    typeof input === "string" ? new TextEncoder().encode(input) : input;
  let bin = "";
  for (const b of bytes) {
    bin += String.fromCharCode(b);
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function pemToDer(pem: string): ArrayBuffer {
  let text = pem.trim();
  if (text.startsWith('"') && text.endsWith('"')) {
    text = text.slice(1, -1);
  }
  text = text.replace(/\\r/g, "").replace(/\\n/g, "\n");
  const cleanBody = text
    .replace(/-----BEGIN [^-]+-----/g, "")
    .replace(/-----END [^-]+-----/g, "")
    .replace(/\s+/g, "");

  let u8: Uint8Array;
  if (typeof Buffer !== "undefined") {
    const buf = Buffer.from(cleanBody, "base64");
    u8 = new Uint8Array(buf.length);
    for (let i = 0; i < buf.length; i++) u8[i] = buf[i];
  } else {
    const bin = atob(cleanBody);
    u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  }
  return u8.buffer;
}

async function createSignedJwt(sa: ServiceAccountCredentials): Promise<string> {
  const nowSec = Math.floor(Date.now() / 1000);
  const header = toBase64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = toBase64Url(
    JSON.stringify({
      iss: sa.client_email,
      scope: SHEETS_SCOPE,
      aud: "https://oauth2.googleapis.com/token",
      iat: nowSec,
      exp: nowSec + 3600,
    }),
  );
  const signingInput = `${header}.${claim}`;
  let der: ArrayBuffer;
  try {
    der = pemToDer(sa.private_key);
  } catch (err) {
    throw new Error(`PEM_PARSE_ERROR: ${err instanceof Error ? err.message : String(err)}`);
  }

  let key: CryptoKey;
  try {
    key = await crypto.subtle.importKey(
      "pkcs8",
      der,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["sign"],
    );
  } catch (err) {
    const rawLen = sa.private_key ? sa.private_key.length : 0;
    const derLen = der ? der.byteLength : 0;
    const head = sa.private_key ? sa.private_key.slice(0, 30) : "";
    const tail = sa.private_key ? sa.private_key.slice(-30) : "";
    throw new Error(`IMPORT_KEY_FAILED (rawLen:${rawLen}, derLen:${derLen}, head:${JSON.stringify(head)}, tail:${JSON.stringify(tail)}): ${err instanceof Error ? err.message : String(err)}`);
  }
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${toBase64Url(new Uint8Array(sig))}`;
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs = SHEETS_TIMEOUT_MS,
): Promise<Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: ac.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function getAccessToken(
  sa: ServiceAccountCredentials,
  fetchImpl: typeof fetch,
): Promise<string> {
  const jwt = await createSignedJwt(sa);
  const res = await fetchWithTimeout(
    fetchImpl,
    "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }).toString(),
    },
  );
  if (!res.ok) {
    throw new Error(`OAUTH_TOKEN_ERROR_${res.status}`);
  }
  const data = (await res.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error("OAUTH_MISSING_ACCESS_TOKEN");
  }
  return data.access_token;
}

async function appendSheetRow(
  fetchImpl: typeof fetch,
  token: string,
  spreadsheetId: string,
  tabName: string,
  values: (string | number)[],
): Promise<{ ok: boolean; status: number }> {
  const range = encodeURIComponent(`${tabName}!A1`);
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetchWithTimeout(fetchImpl, url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ values: [values] }),
  });
  return { ok: res.ok, status: res.status };
}

export async function appendBookingToSheets(
  params: AppendBookingParams,
  fetchImpl: typeof fetch = fetch,
): Promise<AppendBookingResult> {
  const {
    spreadsheetId,
    serviceAccount,
    bookingId,
    booking,
    now = new Date(),
  } = params;
  const createdAtWib = formatWibTimestamp(now);

  try {
    const token = await getAccessToken(serviceAccount, fetchImpl);
    const safeName = sanitizeSheetCell(booking.customer_name);
    const safeWa = sanitizeSheetCell(booking.whatsapp);
    const safeNotes = sanitizeSheetCell(booking.notes);

    const leadRow = [
      bookingId,
      safeWa,
      safeName,
      booking.treatment.id,
      createdAtWib,
      safeNotes,
      "Demo Web",
    ];

    const leadRes = await appendSheetRow(
      fetchImpl,
      token,
      spreadsheetId,
      "Client_Leads",
      leadRow,
    );
    if (!leadRes.ok) {
      console.error("Sheets Client_Leads append failed", {
        bookingId,
        wa: maskWhatsapp(booking.whatsapp),
        status: leadRes.status,
      });
      return {
        ok: false,
        status: leadRes.status,
        message: "Client_Leads append failed",
      };
    }

    const apptRow = [
      bookingId,
      booking.booking_date,
      booking.booking_slot,
      booking.treatment.name,
      booking.treatment.price_idr,
      "Pending Demo",
      createdAtWib,
    ];
    const apptRes = await appendSheetRow(
      fetchImpl,
      token,
      spreadsheetId,
      "Appointments",
      apptRow,
    );
    if (!apptRes.ok) {
      console.warn("Sheets Appointments append partial failure", {
        bookingId,
        wa: maskWhatsapp(booking.whatsapp),
        status: apptRes.status,
      });
      return { ok: true, partial: true };
    }

    return { ok: true, partial: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Sheets append exception", {
      bookingId,
      wa: maskWhatsapp(booking.whatsapp),
      err: msg,
    });
    return { ok: false, status: 502, message: msg };
  }
}
