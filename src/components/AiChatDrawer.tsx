import { useEffect, useRef, useState } from "preact/hooks";

export const QUICK_PROMPT_CHIPS = [
  "Harga & durasi treatment?",
  "Persiapan sebelum laser?",
  "Jam buka & cara booking?",
] as const;

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
  medicalRefusal?: boolean;
  fallbackWaLink?: string;
}

interface Props {
  waNumber: string;
}

export default function AiChatDrawer({ waNumber }: Props) {
  const [open, setOpen] = useState<boolean>(false);
  const [input, setInput] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const msgCount = messages.length;
  useEffect(() => {
    if (listRef.current && (msgCount > 0 || loading)) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [msgCount, loading]);

  const jumpToBooking = () => {
    setOpen(false);
    const el = document.getElementById("booking");
    if (el) {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      el.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
      });
    }
  };

  const defaultWaLink = () => {
    const clean = waNumber.replace(/\D/g, "") || "6281234567890";
    return `https://wa.me/${clean}?text=${encodeURIComponent("Halo Aurelia Skin Clinic [DEMO], saya ingin konsultasi jadwal.")}`;
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || trimmed.length > 400 || loading) return;

    const nextHistory: ChatMsg[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextHistory);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextHistory
            .slice(-6)
            .map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: {
          reply?: string;
          medical_refusal?: boolean;
          fallback?: string;
          wa_link?: string;
        };
        error?: { message?: string };
      };

      if (res.ok && json.success && json.data?.reply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: json.data?.reply ?? "",
            medicalRefusal: Boolean(json.data?.medical_refusal),
          },
        ]);
        return;
      }

      const fallbackMsg =
        json.data?.fallback ||
        json.error?.message ||
        "Asisten AI sedang sibuk. Jam buka 09:00–20:00 WIB, kisaran harga Rp 350.000 – Rp 1.850.000.";
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: fallbackMsg,
          fallbackWaLink: json.data?.wa_link || defaultWaLink(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Koneksi terganggu. Silakan isi form booking langsung atau hubungi WhatsApp klinik.",
          fallbackWaLink: defaultWaLink(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e: Event) => {
    e.preventDefault();
    void sendMessage(input);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          class="fixed right-4 bottom-4 z-40 inline-flex min-h-[48px] cursor-pointer items-center gap-2 rounded-full border-2 border-canvas bg-terracotta px-5 text-xs font-semibold text-white shadow-sm hover:bg-terracotta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
          aria-label="Buka asisten AI CS"
        >
          <span>Tanya AI CS</span>
        </button>
      )}

      {open && (
        <dialog
          open
          aria-modal="true"
          aria-label="Asisten Klinik Aurelia"
          class="fixed inset-x-0 bottom-0 z-50 flex h-[82dvh] flex-col rounded-t-2xl border border-ink bg-surface shadow-lg md:inset-x-auto md:right-4 md:bottom-4 md:h-[580px] md:w-[380px] md:rounded-2xl"
        >
          <div class="flex items-center justify-between gap-3 border-b border-border bg-canvas px-4 py-3 rounded-t-2xl">
            <div>
              <h2 class="font-display text-sm font-bold text-ink">
                Asisten Klinik Aurelia [DEMO]
              </h2>
              <p class="text-[11px] text-muted">
                Info treatment, harga &amp; jadwal (non-medis)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Tutup asisten chat"
              class="min-h-[44px] min-w-[44px] cursor-pointer rounded-lg border border-border bg-surface text-xs font-bold text-ink hover:bg-warm"
            >
              X
            </button>
          </div>

          <div class="bg-warm px-4 py-2 text-[11px] text-muted leading-snug border-b border-border">
            AI hanya menjawab info katalog &amp; jadwal. Keluhan medis atau
            diagnosis silakan konsultasikan langsung dengan dokter.
          </div>

          <div
            ref={listRef}
            class="flex-1 overflow-y-auto p-4 space-y-3"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div class="space-y-3">
                <p class="text-xs font-semibold text-ink">
                  Halo, pilih topik cepat atau ketik pertanyaan:
                </p>
                <div class="space-y-2">
                  {QUICK_PROMPT_CHIPS.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => void sendMessage(chip)}
                      class="flex min-h-[44px] w-full cursor-pointer items-center rounded-full border border-terracotta bg-terracotta-tint px-4 text-left text-xs font-semibold text-terracotta hover:bg-terracotta hover:text-white transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={`${msg.role}-${idx}`}
                  class={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    class={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-terracotta text-white"
                        : msg.medicalRefusal
                          ? "border border-sage bg-sage-tint text-ink"
                          : "border border-border bg-warm text-ink"
                    }`}
                  >
                    {msg.medicalRefusal && (
                      <p class="mb-1 text-[10px] font-bold tracking-wider text-sage uppercase">
                        GUARDRAIL NON-MEDIS AKTIF
                      </p>
                    )}
                    <p>{msg.content}</p>
                    {msg.role === "assistant" && (
                      <div class="mt-2.5 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={jumpToBooking}
                          class={`min-h-[44px] cursor-pointer rounded-lg px-3.5 text-xs font-semibold text-white ${
                            msg.medicalRefusal
                              ? "bg-sage"
                              : "bg-terracotta hover:bg-terracotta-hover"
                          }`}
                        >
                          {msg.medicalRefusal
                            ? "Booking Konsultasi Dokter ->"
                            : "Isi Form Booking ->"}
                        </button>
                        {msg.fallbackWaLink && (
                          <a
                            href={msg.fallbackWaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="inline-flex min-h-[44px] items-center rounded-lg border border-ink bg-surface px-3.5 text-xs font-semibold text-ink"
                          >
                            Chat WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div
                class="max-w-[75%] rounded-xl border border-border bg-warm p-3 space-y-2"
                aria-label="AI sedang mengetik"
              >
                <div class="h-2.5 w-32 animate-pulse rounded bg-border-strong" />
                <div class="h-2.5 w-44 animate-pulse rounded bg-border-strong" />
                <div class="h-2.5 w-24 animate-pulse rounded bg-border-strong" />
              </div>
            )}
          </div>

          <form
            onSubmit={onSubmit}
            class="border-t border-border bg-surface p-3 flex items-center gap-2"
          >
            <div class="relative flex-1">
              <input
                type="text"
                maxLength={400}
                value={input}
                disabled={loading}
                onInput={(e) => setInput((e.target as HTMLInputElement).value)}
                placeholder="Tanya harga, durasi, atau jadwal..."
                aria-label="Pertanyaan untuk asisten klinik"
                class="min-h-[44px] w-full rounded-lg border border-border bg-canvas pr-12 pl-3 text-xs text-ink focus:border-terracotta focus:outline-none"
              />
              <span class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted tabular-nums">
                {input.length}/400
              </span>
            </div>
            <button
              type="submit"
              disabled={loading || input.trim().length === 0}
              aria-label="Kirim pesan"
              class="min-h-[44px] min-w-[44px] cursor-pointer rounded-lg bg-terracotta px-3 text-xs font-bold text-white hover:bg-terracotta-hover disabled:cursor-not-allowed disabled:bg-border-strong disabled:text-muted"
            >
              -&gt;
            </button>
          </form>
        </dialog>
      )}
    </>
  );
}
