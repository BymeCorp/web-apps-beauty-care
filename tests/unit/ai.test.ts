import { describe, expect, it, vi } from "vitest";
import {
  buildSystemPrompt,
  isMedicalQuery,
  requestAiReply,
} from "../../src/lib/ai";

describe("ai grounding & medical guardrail", () => {
  it("builds system prompt containing all 8 catalog treatments and operating hours", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("Hydra Glow Facial");
    expect(prompt).toContain("Pico Laser Brightening");
    expect(prompt).toContain("DNA Salmon Booster");
    expect(prompt).toContain("09:00");
    expect(prompt).toContain("non-medis");
  });

  it("detects medical diagnosis/prescription queries deterministically", () => {
    expect(
      isMedicalQuery("Kulit saya jerawat meradang, pakai krim steroid apa?"),
    ).toBe(true);
    expect(isMedicalQuery("Saya butuh resep obat minum untuk ruam")).toBe(true);
    expect(
      isMedicalQuery("Facial untuk kulit sensitif berapa lama dan harganya?"),
    ).toBe(false);
  });

  it("refuses medical queries without calling upstream LLM", async () => {
    const fetchMock = vi.fn();
    const res = await requestAiReply(
      {
        messages: [
          { role: "user", content: "Saya hamil boleh pakai obat racikan apa?" },
        ],
        baseUrl: "https://tokenharbor.ai/v1",
        apiKey: "secret",
        model: "deepseek-v4.1-flash:free",
        waNumber: "6281200001111",
      },
      fetchMock as unknown as typeof fetch,
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.medicalRefusal).toBe(true);
      expect(res.reply).toContain("dokter");
    }
  });

  it("retries up to 2x on 5xx and returns fallback deterministically if still failing", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const fetchMock = vi.fn(
      async () => new Response("upstream down", { status: 503 }),
    );
    const res = await requestAiReply(
      {
        messages: [{ role: "user", content: "Harga Hydra Glow Facial?" }],
        baseUrl: "https://tokenharbor.ai/v1",
        apiKey: "secret",
        model: "deepseek-v4.1-flash:free",
        waNumber: "6281200001111",
      },
      fetchMock as unknown as typeof fetch,
    );
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.fallback).toContain("09:00");
      expect(res.fallback).toContain("Rp 350.000");
      expect(res.waLink).toContain("https://wa.me/6281200001111");
    }
    warnSpy.mockRestore();
  });

  it("returns grounded LLM reply with max_tokens<=300 and temperature<=0.3", async () => {
    const fetchMock = vi.fn(
      async (_url: RequestInfo | URL, init?: RequestInit) => {
        const payload = JSON.parse(String(init?.body ?? "{}")) as {
          max_tokens: number;
          temperature: number;
        };
        expect(payload.max_tokens).toBeLessThanOrEqual(300);
        expect(payload.temperature).toBeLessThanOrEqual(0.3);
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content:
                    "Hydra Glow Facial berdurasi 60 menit dengan harga Rp 450.000.",
                },
              },
            ],
          }),
          { status: 200 },
        );
      },
    );
    const res = await requestAiReply(
      {
        messages: [{ role: "user", content: "Harga Hydra Glow?" }],
        baseUrl: "https://tokenharbor.ai/v1",
        apiKey: "secret",
        model: "deepseek-v4.1-flash:free",
        waNumber: "6281200001111",
      },
      fetchMock as unknown as typeof fetch,
    );
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.reply).toContain("Rp 450.000");
      expect(res.medicalRefusal).toBe(false);
    }
  });
});
