import { useEffect, useState } from "preact/hooks";
import {
  SELECT_TREATMENT_EVENT,
  type SelectTreatmentDetail,
  dispatchSelectTreatment,
} from "../lib/events";
import {
  BOOKING_SLOTS,
  type TreatmentItem,
  type ValidationDetail,
  addDaysIso,
  formatIdr,
  getTodayWib,
} from "../lib/validate";

export function isSlotPassedWib(
  bookingDate: string,
  slot: string,
  now: Date = new Date(),
): boolean {
  const todayWib = getTodayWib(now);
  if (bookingDate !== todayWib) return false;
  const currentHm = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(now);
  return slot <= currentHm;
}

export function mapFieldErrors(
  details: readonly ValidationDetail[],
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const d of details) {
    if (!map[d.field]) {
      map[d.field] = d.message;
    }
  }
  return map;
}

interface Props {
  items: TreatmentItem[];
  sheetUrl: string;
  waNumber: string;
}

interface ConfirmedBooking {
  booking_id: string;
  wa_link: string;
  treatmentName: string;
  bookingDate: string;
  bookingSlot: string;
  customerName: string;
  whatsapp: string;
}

export default function BookingForm({ items, sheetUrl, waNumber }: Props) {
  const today = getTodayWib();
  const maxDate = addDaysIso(today, 30);

  const [treatmentId, setTreatmentId] = useState<string>("laser-1");
  const [bookingDate, setBookingDate] = useState<string>(addDaysIso(today, 1));
  const [bookingSlot, setBookingSlot] = useState<string>("14:00");
  const [customerName, setCustomerName] = useState<string>("");
  const [whatsapp, setWhatsapp] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [honeypot, setHoneypot] = useState<string>("");

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [bannerError, setBannerError] = useState<{
    code: string;
    message: string;
    waLink?: string;
  } | null>(null);
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);
  const [idemKey, setIdemKey] = useState<string>(() => crypto.randomUUID());

  const selectedTreatment = items.find((i) => i.id === treatmentId) ?? items[0];

  useEffect(() => {
    const onSelect = (e: Event) => {
      const detail = (e as CustomEvent<SelectTreatmentDetail>).detail;
      if (detail?.treatmentId) {
        setTreatmentId(detail.treatmentId);
        setConfirmed(null);
      }
    };
    window.addEventListener(SELECT_TREATMENT_EVENT, onSelect);
    return () => window.removeEventListener(SELECT_TREATMENT_EVENT, onSelect);
  }, []);

  const fallbackWaLink = () => {
    const clean = waNumber.replace(/\D/g, "") || "6281234567890";
    const msg = `Halo Aurelia Skin Clinic [DEMO], saya ${customerName || "calon pasien"} ingin booking ${selectedTreatment?.name ?? "treatment"} pada ${bookingDate} jam ${bookingSlot} WIB.`;
    return `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
  };

  const handleTreatmentChange = (id: string) => {
    setTreatmentId(id);
    dispatchSelectTreatment(id, false);
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setFieldErrors({});
    setBannerError(null);

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Idempotency-Key": idemKey,
        },
        body: JSON.stringify({
          treatment_id: treatmentId,
          booking_date: bookingDate,
          booking_slot: bookingSlot,
          customer_name: customerName,
          whatsapp,
          notes,
          company_website: honeypot,
        }),
      });

      const json = (await res.json()) as {
        success: boolean;
        data?: { booking_id: string; wa_link: string };
        error?: {
          code: string;
          message: string;
          details?: ValidationDetail[];
          wa_link?: string;
        };
      };

      if (res.ok && json.success && json.data) {
        setConfirmed({
          booking_id: json.data.booking_id,
          wa_link: json.data.wa_link,
          treatmentName: selectedTreatment.name,
          bookingDate,
          bookingSlot,
          customerName,
          whatsapp,
        });
        setIdemKey(crypto.randomUUID());
        return;
      }

      if (res.status === 422 && json.error?.details) {
        const mapped = mapFieldErrors(json.error.details);
        setFieldErrors(mapped);
        setBannerError({ code: "422", message: json.error.message });
        return;
      }

      setBannerError({
        code: String(res.status),
        message:
          json.error?.message ||
          "Terjadi kendala sementara. Data form Anda tetap aman.",
        waLink: json.error?.wa_link || fallbackWaLink(),
      });
    } catch {
      setBannerError({
        code: "NETWORK",
        message:
          "Koneksi terputus saat menyimpan ke Google Sheet. Data Anda tidak hilang — coba lagi atau lanjut via WhatsApp.",
        waLink: fallbackWaLink(),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForAnother = () => {
    setConfirmed(null);
    setBannerError(null);
    setFieldErrors({});
    setNotes("");
    setIdemKey(crypto.randomUUID());
  };

  return (
    <div class="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
      {/* Ringkasan Booking Kiri */}
      <aside class="rounded-xl border border-border bg-warm p-5 sm:p-6 lg:col-span-5">
        <p class="text-[11px] font-bold tracking-wider text-ink uppercase">
          RINGKASAN BOOKING
        </p>
        <dl class="mt-4 divide-y divide-border text-xs">
          <div class="flex items-center justify-between gap-4 py-2.5">
            <dt class="text-muted">Treatment</dt>
            <dd class="text-right font-semibold text-ink">
              {selectedTreatment?.name}
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4 py-2.5">
            <dt class="text-muted">Durasi</dt>
            <dd class="font-semibold text-ink tabular-nums">
              {selectedTreatment?.duration_minutes} menit
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4 py-2.5">
            <dt class="text-muted">Jadwal</dt>
            <dd class="font-semibold text-ink tabular-nums">
              {bookingDate} &bull; {bookingSlot} WIB
            </dd>
          </div>
          <div class="flex items-center justify-between gap-4 py-2.5">
            <dt class="text-muted">Lokasi</dt>
            <dd class="text-right font-semibold text-ink">
              Jl. Senopati No. 48, Jaksel [DEMO]
            </dd>
          </div>
        </dl>

        <div class="mt-4 flex items-baseline justify-between border-t border-border-strong pt-4">
          <span class="text-xs font-bold text-ink">
            Total Estimasi (1 sesi)
          </span>
          <span class="text-lg font-bold text-ink tabular-nums">
            {selectedTreatment ? formatIdr(selectedTreatment.price_idr) : "-"}
          </span>
        </div>

        <div class="mt-5 rounded-lg border border-sage bg-surface p-3.5 text-[11px] font-semibold text-sage leading-relaxed">
          Setelah kirim: kode BK-XXXX tampil &amp; baris Google Sheet Sandbox
          bertambah otomatis (&lt; 2 detik). Data uji ini hanya untuk demo.
        </div>
      </aside>

      {/* Form atau Kartu Konfirmasi 201 Kanan */}
      <div class="rounded-xl border border-border bg-surface p-5 sm:p-6 lg:col-span-7">
        {confirmed ? (
          <div aria-live="polite" class="space-y-5">
            <div class="rounded-xl border border-success bg-success-tint p-5">
              <p class="text-[10px] font-bold tracking-wider text-success uppercase">
                BOOKING DEMO TERCATAT DI GOOGLE SHEET
              </p>
              <p
                class="mt-1 font-mono text-2xl font-bold text-ink tabular-nums"
                data-testid="confirmed-booking-id"
              >
                {confirmed.booking_id}
              </p>
              <p class="mt-1 text-xs font-medium text-success">
                Status: Pending Demo &bull; Tersimpan
              </p>
            </div>

            <dl class="divide-y divide-border text-xs">
              <div class="flex justify-between py-2.5">
                <dt class="text-muted">Treatment</dt>
                <dd class="font-semibold text-ink">
                  {confirmed.treatmentName}
                </dd>
              </div>
              <div class="flex justify-between py-2.5">
                <dt class="text-muted">Jadwal</dt>
                <dd class="font-semibold text-ink tabular-nums">
                  {confirmed.bookingDate} &bull; {confirmed.bookingSlot} WIB
                </dd>
              </div>
              <div class="flex justify-between py-2.5">
                <dt class="text-muted">Nama</dt>
                <dd class="font-semibold text-ink">{confirmed.customerName}</dd>
              </div>
              <div class="flex justify-between py-2.5">
                <dt class="text-muted">WhatsApp</dt>
                <dd class="font-semibold text-ink tabular-nums">
                  {confirmed.whatsapp}
                </dd>
              </div>
            </dl>

            <div class="flex flex-col gap-3 sm:flex-row">
              <a
                href={sheetUrl}
                target={sheetUrl.startsWith("http") ? "_blank" : undefined}
                rel={
                  sheetUrl.startsWith("http")
                    ? "noopener noreferrer"
                    : undefined
                }
                class="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-lg bg-terracotta px-4 text-xs font-semibold text-white hover:bg-terracotta-hover"
              >
                Buka Google Sheet Sandbox -&gt;
              </a>
              <a
                href={confirmed.wa_link}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex min-h-[46px] flex-1 items-center justify-center rounded-lg border border-ink bg-surface px-4 text-xs font-semibold text-ink hover:bg-warm"
              >
                Lanjut Konfirmasi WhatsApp
              </a>
            </div>

            <button
              type="button"
              onClick={resetForAnother}
              class="min-h-[44px] w-full cursor-pointer text-center text-xs font-semibold text-terracotta hover:underline"
            >
              Buat Booking Uji Lain
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate class="space-y-4">
            {bannerError && (
              <div
                role="alert"
                aria-live="polite"
                class={`rounded-lg border p-3.5 text-xs ${
                  bannerError.code === "429"
                    ? "border-warning bg-warning-tint text-warning"
                    : "border-error bg-error-tint text-error"
                }`}
              >
                <p class="font-semibold">{bannerError.message}</p>
                {bannerError.waLink && (
                  <div class="mt-2.5 flex flex-wrap gap-2">
                    <button
                      type="submit"
                      class="min-h-[44px] cursor-pointer rounded-md bg-error px-3.5 text-xs font-semibold text-white"
                    >
                      Coba Lagi
                    </button>
                    <a
                      href={bannerError.waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      class="inline-flex min-h-[44px] items-center rounded-md border border-ink bg-surface px-3.5 text-xs font-semibold text-ink"
                    >
                      Fallback WhatsApp -&gt;
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Honeypot */}
            <div class="sr-only" aria-hidden="true">
              <label for="company_website">Website</label>
              <input
                id="company_website"
                name="company_website"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onInput={(e) =>
                  setHoneypot((e.target as HTMLInputElement).value)
                }
              />
            </div>

            <div>
              <label
                for="bk-treatment"
                class="block text-xs font-semibold text-ink"
              >
                Pilih Treatment *
              </label>
              <select
                id="bk-treatment"
                value={treatmentId}
                disabled={submitting}
                onChange={(e) =>
                  handleTreatmentChange((e.target as HTMLSelectElement).value)
                }
                class="mt-1.5 min-h-[44px] w-full rounded-lg border border-border bg-canvas px-3 text-sm text-ink focus:border-terracotta focus:outline-none disabled:opacity-60"
              >
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} — {formatIdr(item.price_idr)} (
                    {item.duration_minutes} mnt)
                  </option>
                ))}
              </select>
              {fieldErrors.treatment_id && (
                <p class="mt-1 text-xs text-error">
                  {fieldErrors.treatment_id}
                </p>
              )}
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  for="bk-name"
                  class="block text-xs font-semibold text-ink"
                >
                  Nama Lengkap *
                </label>
                <input
                  id="bk-name"
                  name="customer_name"
                  type="text"
                  required
                  maxLength={60}
                  disabled={submitting}
                  placeholder="Contoh: Rina Lestari"
                  value={customerName}
                  onInput={(e) =>
                    setCustomerName((e.target as HTMLInputElement).value)
                  }
                  class={`mt-1.5 min-h-[44px] w-full rounded-lg border px-3 text-sm text-ink focus:outline-none disabled:opacity-60 ${
                    fieldErrors.customer_name
                      ? "border-error bg-error-tint"
                      : "border-border bg-canvas focus:border-terracotta"
                  }`}
                />
                {fieldErrors.customer_name && (
                  <p class="mt-1 text-xs text-error" aria-live="polite">
                    {fieldErrors.customer_name}
                  </p>
                )}
              </div>

              <div>
                <label for="bk-wa" class="block text-xs font-semibold text-ink">
                  Nomor WhatsApp *
                </label>
                <input
                  id="bk-wa"
                  name="whatsapp"
                  type="tel"
                  required
                  disabled={submitting}
                  placeholder="081234567890 atau +62812..."
                  value={whatsapp}
                  onInput={(e) =>
                    setWhatsapp((e.target as HTMLInputElement).value)
                  }
                  class={`mt-1.5 min-h-[44px] w-full rounded-lg border px-3 text-sm text-ink tabular-nums focus:outline-none disabled:opacity-60 ${
                    fieldErrors.whatsapp
                      ? "border-error bg-error-tint"
                      : "border-border bg-canvas focus:border-terracotta"
                  }`}
                />
                {fieldErrors.whatsapp && (
                  <p class="mt-1 text-xs text-error" aria-live="polite">
                    {fieldErrors.whatsapp}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label for="bk-date" class="block text-xs font-semibold text-ink">
                Tanggal Kunjungan (H+0 s/d +30 hari WIB) *
              </label>
              <input
                id="bk-date"
                name="booking_date"
                type="date"
                required
                min={today}
                max={maxDate}
                disabled={submitting}
                value={bookingDate}
                onInput={(e) =>
                  setBookingDate((e.target as HTMLInputElement).value)
                }
                class={`mt-1.5 min-h-[44px] w-full rounded-lg border px-3 text-sm text-ink tabular-nums focus:outline-none disabled:opacity-60 ${
                  fieldErrors.booking_date
                    ? "border-error bg-error-tint"
                    : "border-border bg-canvas focus:border-terracotta"
                }`}
              />
              {fieldErrors.booking_date && (
                <p class="mt-1 text-xs text-error" aria-live="polite">
                  {fieldErrors.booking_date}
                </p>
              )}
            </div>

            <div>
              <span class="block text-xs font-semibold text-ink">
                Slot Jam (09:00–19:00 WIB) *
              </span>
              <div class="mt-1.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {BOOKING_SLOTS.map((slot) => {
                  const passed = isSlotPassedWib(bookingDate, slot);
                  const active = bookingSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={passed || submitting}
                      onClick={() => setBookingSlot(slot)}
                      class={`min-h-[44px] rounded-lg text-xs font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                        active
                          ? "bg-terracotta text-white"
                          : passed
                            ? "cursor-not-allowed border border-border bg-warm text-subtle line-through"
                            : "cursor-pointer border border-subtle bg-surface text-ink hover:border-ink"
                      }`}
                    >
                      {slot}
                    </button>
                  );
                })}
              </div>
              {fieldErrors.booking_slot && (
                <p class="mt-1 text-xs text-error" aria-live="polite">
                  {fieldErrors.booking_slot}
                </p>
              )}
            </div>

            <div>
              <div class="flex items-center justify-between">
                <label
                  for="bk-notes"
                  class="block text-xs font-semibold text-ink"
                >
                  Catatan Persiapan (Opsional)
                </label>
                <span class="text-[10px] text-muted tabular-nums">
                  {notes.length}/160
                </span>
              </div>
              <input
                id="bk-notes"
                name="notes"
                type="text"
                maxLength={160}
                disabled={submitting}
                placeholder="Hindari menulis data rekam medis sensitif"
                value={notes}
                onInput={(e) => setNotes((e.target as HTMLInputElement).value)}
                class="mt-1.5 min-h-[44px] w-full rounded-lg border border-border bg-canvas px-3 text-sm text-ink focus:border-terracotta focus:outline-none disabled:opacity-60"
              />
            </div>

            <div class="pt-1 flex flex-col gap-2 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={submitting}
                class="min-h-[48px] cursor-pointer rounded-lg bg-terracotta px-6 text-sm font-semibold text-white hover:bg-terracotta-hover disabled:cursor-wait disabled:bg-border-strong disabled:text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
              >
                {submitting
                  ? "Menyimpan ke Google Sheet..."
                  : "Kirim Booking Demo"}
              </button>
              <span class="text-[11px] text-muted">
                Tanpa OTP SMS &bull; data hanya dicatat di Sheet demo.
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
