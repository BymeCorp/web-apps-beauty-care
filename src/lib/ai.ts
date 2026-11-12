import { CATALOG, type ChatMessageInput, formatIdr } from "./validate";

export interface AiReplyParams {
  messages: ChatMessageInput[];
  baseUrl: string;
  apiKey: string;
  model: string;
  waNumber: string;
  disableAi?: boolean;
}

export type AiReplyResult =
  | { ok: true; reply: string; medicalRefusal: boolean; staticMode?: boolean }
  | { ok: false; status: number; fallback: string; waLink: string };

const MEDICAL_KEYWORDS = [
  "obat",
  "resep",
  "steroid",
  "antibiotik",
  "racikan",
  "diagnosis",
  "diagnosa",
  "dosis",
  "ruam",
  "infeksi",
  "nanah",
  "berdarah",
  "hamil",
  "menyusui",
  "penyakit",
  "salep",
  "kortikosteroid",
  "isotretinoin",
];

const AI_TIMEOUT_MS = 15_000;
const MAX_RETRIES = 2;

export function buildFallbackWaLink(waNumber: string): string {
  const clean = waNumber.replace(/\D/g, "") || "6281234567890";
  return `https://wa.me/${clean}?text=${encodeURIComponent("Halo Aurelia Skin Clinic [DEMO], saya ingin bertanya jadwal dan treatment.")}`;
}

export function buildStaticFallbackText(): string {
  return "Info singkat Aurelia Skin Clinic [DEMO]: buka setiap hari 09:00–20:00 WIB (slot 60 menit 09:00–19:00 WIB), kisaran harga treatment Rp 350.000 – Rp 1.850.000. Silakan isi form booking di bawah atau chat WhatsApp kami.";
}

export function isMedicalQuery(text: string): boolean {
  const lower = text.toLowerCase();
  return MEDICAL_KEYWORDS.some((kw) => new RegExp(`\\b${kw}`, "i").test(lower));
}

export function buildSystemPrompt(): string {
  const catalogLines = CATALOG.map(
    (t) =>
      `- ${t.name} (${t.category}, ${t.duration_minutes} menit, ${formatIdr(t.price_idr)}): ${t.description} Persiapan: ${t.prep_note}`,
  ).join("\n");

  return [
    "Anda adalah Asisten Klinik Aurelia Skin Clinic [DEMO] (layanan informasi katalog non-medis).",
    "Aturan wajib:",
    "1. Jawab singkat dalam Bahasa Indonesia yang jelas dan sopan (maksimal 3-4 kalimat, tanpa emoji).",
    "2. Gunakan HANYA data katalog dan info klinik di bawah ini. Jangan mengarang harga, promo, atau layanan baru.",
    "3. Jam buka setiap hari 09:00–20:00 WIB, lokasi Jl. Senopati No. 48, Jakarta Selatan [DEMO], slot booking 09:00–19:00 WIB.",
    "4. Anda BUKAN dokter/tenaga medis. Jika pengguna bertanya diagnosis kulit, keluhan penyakit, resep obat/krim, kehamilan, atau dosis medis, TOLAK secara sopan dan arahkan konsultasi langsung dengan dokter melalui form booking.",
    "5. Bila relevan, ajak pengguna menekan tombol 'Isi Form Booking'.",
    "",
    "Katalog Resmi:",
    catalogLines,
  ].join("\n");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function requestAiReply(
  params: AiReplyParams,
  fetchImpl: typeof fetch = fetch,
): Promise<AiReplyResult> {
  const latestUser = [...params.messages]
    .reverse()
    .find((m) => m.role === "user");
  if (latestUser && isMedicalQuery(latestUser.content)) {
    return {
      ok: true,
      medicalRefusal: true,
      reply:
        "Maaf, saya asisten informasi katalog non-medis sehingga tidak dapat memberikan diagnosis atau rekomendasi obat/krim medis. Untuk keluhan tersebut, silakan konsultasi langsung dengan dokter kami melalui form booking.",
    };
  }

  if (params.disableAi || !params.apiKey) {
    return {
      ok: true,
      medicalRefusal: false,
      staticMode: true,
      reply: buildStaticFallbackText(),
    };
  }

  const endpoint = `${params.baseUrl.replace(/\/+$/, "")}/chat/completions`;
  const body = JSON.stringify({
    model: params.model,
    messages: [
      { role: "system", content: buildSystemPrompt() },
      ...params.messages,
    ],
    max_tokens: 300,
    temperature: 0.3,
  });

  let lastStatus = 504;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), AI_TIMEOUT_MS);
    try {
      const res = await fetchImpl(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${params.apiKey}`,
          "Content-Type": "application/json",
        },
        body,
        signal: ac.signal,
      });
      clearTimeout(timer);

      if (res.ok) {
        const json = (await res.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        const reply = json.choices?.[0]?.message?.content?.trim();
        if (reply) {
          return { ok: true, medicalRefusal: false, reply };
        }
        lastStatus = 502;
      } else {
        lastStatus = res.status;
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          break;
        }
      }
    } catch (err) {
      clearTimeout(timer);
      lastStatus = 504;
      console.warn("AI request error", {
        attempt,
        err: err instanceof Error ? err.message : String(err),
      });
    }

    if (attempt < MAX_RETRIES) {
      await sleep(attempt === 0 ? 50 : 100);
    }
  }

  console.warn("AI fallback triggered", { model: params.model, lastStatus });
  return {
    ok: false,
    status: 504,
    fallback: buildStaticFallbackText(),
    waLink: buildFallbackWaLink(params.waNumber),
  };
}
