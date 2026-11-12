import type { APIRoute } from "astro";
import { requestAiReply } from "../../lib/ai";
import { errorResponse, jsonResponse } from "../../lib/errors";
import { type KvLike, checkAndIncrementRateLimit } from "../../lib/rate-limit";
import { validateChatPayload } from "../../lib/validate";

export const prerender = false;

export interface ChatEnv {
  AI_BASE_URL?: string;
  AI_API_KEY?: string;
  AI_MODEL?: string;
  PUBLIC_DEMO_WA_NUMBER?: string;
  DISABLE_AI?: string;
  RATE_LIMIT_KV?: KvLike;
}

function getClientIp(request: Request): string {
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]?.trim() ?? "unknown";
  return "127.0.0.1";
}

export async function handleChatRequest(
  request: Request,
  env: ChatEnv,
  fetchImpl: typeof fetch = fetch,
  now: Date = new Date(),
): Promise<Response> {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse(422, "VALIDATION_ERROR", "Payload JSON tidak valid.");
  }

  const validation = validateChatPayload(rawBody);
  if (!validation.ok) {
    return errorResponse(
      422,
      "VALIDATION_ERROR",
      "Pertanyaan harus 1–400 karakter.",
      {
        details: validation.details,
      },
    );
  }

  const ip = getClientIp(request);
  const rl = await checkAndIncrementRateLimit(
    env.RATE_LIMIT_KV,
    "chat",
    ip,
    15,
    3600,
    now,
  );
  if (!rl.allowed) {
    return errorResponse(
      429,
      "RATE_LIMITED",
      "Batas chat AI demo tercapai (15 pertanyaan/jam). Silakan langsung isi form booking atau hubungi WhatsApp.",
      { retry_after_seconds: rl.retryAfterSeconds },
      { "Retry-After": String(rl.retryAfterSeconds) },
    );
  }

  const waNumber = env.PUBLIC_DEMO_WA_NUMBER ?? "6281234567890";
  const aiRes = await requestAiReply(
    {
      messages: validation.messages,
      baseUrl: env.AI_BASE_URL ?? "https://tokenharbor.ai/v1",
      apiKey: env.AI_API_KEY ?? "",
      model: env.AI_MODEL ?? "deepseek-v4.1-flash:free",
      waNumber,
      disableAi: env.DISABLE_AI === "true",
    },
    fetchImpl,
  );

  if (!aiRes.ok) {
    return jsonResponse(504, {
      success: false,
      error: {
        code: "AI_TIMEOUT",
        message: "Asisten AI sedang sibuk. Berikut ringkasan info klinik.",
      },
      data: {
        fallback: aiRes.fallback,
        wa_link: aiRes.waLink,
      },
    });
  }

  return jsonResponse(200, {
    success: true,
    data: {
      reply: aiRes.reply,
      grounded: true,
      medical_refusal: aiRes.medicalRefusal,
    },
  });
}

export const POST: APIRoute = async ({ request, locals }) => {
  const runtimeEnv =
    (locals as { runtime?: { env?: ChatEnv } }).runtime?.env ?? {};
  const env: ChatEnv = {
    AI_BASE_URL: runtimeEnv.AI_BASE_URL ?? import.meta.env.AI_BASE_URL,
    AI_API_KEY: runtimeEnv.AI_API_KEY ?? import.meta.env.AI_API_KEY,
    AI_MODEL: runtimeEnv.AI_MODEL ?? import.meta.env.AI_MODEL,
    PUBLIC_DEMO_WA_NUMBER:
      runtimeEnv.PUBLIC_DEMO_WA_NUMBER ?? import.meta.env.PUBLIC_DEMO_WA_NUMBER,
    DISABLE_AI: runtimeEnv.DISABLE_AI ?? import.meta.env.DISABLE_AI,
    RATE_LIMIT_KV: runtimeEnv.RATE_LIMIT_KV,
  };
  return handleChatRequest(request, env);
};
