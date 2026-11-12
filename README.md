# web-apps-beauty-care — Aurelia Skin Clinic [DEMO]

Live Portfolio Demo B2B oleh **Byme Corporate** (`BYME_SDLC V1.0`):
- **SCR-01:** Showcase Klinik & Katalog 8 Treatment dengan filter kategori (`CatalogFilter.tsx`)
- **SCR-02:** Booking Slot -> Google Sheet Demo Sandbox + fallback `wa.me` (`BookingForm.tsx`, `POST /api/booking`)
- **SCR-03:** Asisten AI CS Non-Medis grounded katalog (`AiChatDrawer.tsx`, `POST /api/chat`)
- **SCR-04:** Footer & CTA konsultasi Byme Corporate

## Stack & Target Kualitas
- **Astro 5 (SSR Cloudflare) + Preact Islands + Tailwind CSS v4**
- **Cloudflare Pages + KV** (`Rp 0/bulan` free tier) + **Google Sheets API v4 (WebCrypto JWT)** + **TokenHarbour `:free`**
- **Quality Gate:** `CLS = 0.00`, `JS client < 45 KB gzip`, `0px` horizontal scroll (`390/768/1280`), `>= 44px` touch targets, `0` emoji.

## Menjalankan Lokal
```bash
pnpm install
cp .dev.vars.example .dev.vars   # isi env var demo lokal
pnpm dev                         # http://localhost:4321
```

## Pengujian
```bash
pnpm lint       # Biome check
pnpm typecheck  # astro sync && tsc --noEmit
pnpm test       # Vitest unit + integration
pnpm build      # Astro production build
pnpm test:e2e   # Playwright WebKit (390px) & Chromium (1280px)
```
