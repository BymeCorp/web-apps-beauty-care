# `.agent/TASK.md` — `web-apps-beauty-care`

> **BYME_SDLC V1.0 — Phase 3 (Context Repo · Atomic Backlog)** · **Kode:** `TASK-BEAUTY-v1.0`  
> **Sumber Spec:** `PRD-BEAUTY-v1.0` (`FROZEN`) + `TSD-BEAUTY-v1.0` (`LOCKED`) + `DESIGN-BEAUTY-v1.0` (`APPROVED`)  
> **Owner:** Sarah (PM) & Zero (Tech Lead) · **Aturan Eksekusi:** `1 TASK = 1 giliran` sesuai `ORCHESTRATOR.md`; wajib exit `0` pada `Verification Gate` + `Containment Audit` sebelum status `DONE`.

---

## 1. Ringkasan Progres
- **Total Task:** `8` · **Done:** `1` · **Blocked:** `0`
- **Task Aktif Sekarang:** `TASK-002`
- **Aturan Ukuran Slice:** Maksimal `~5–6` file disentuh per task (kecuali scaffolding awal).

---

## 2. Daftar Task Atomik (*Dependency-Ordered Backlog*)

### Fase A — Setup & Pondasi (`Scaffolding, Katalog & Validasi`)

#### `[x] TASK-001` — Scaffolding Astro 5 + Preact + Tailwind CSS v4 + Biome + Vitest + `/api/health`
- **Status:** `DONE` · **Owner:** `Zero` · **Workflow:** `.agent/WORKFLOWS/p4-project-scaffolding.md`
- **Traceability:** `TSD §2, §5, §8` · **Dependencies:** `None`
- **Change Boundary:**
  - Primary: `package.json`, `pnpm-lock.yaml`, `astro.config.mjs`, `tsconfig.json`, `biome.json`, `vitest.config.ts`, `src/styles/global.css`, `src/pages/api/health.ts`, `src/lib/errors.ts`, `src/middleware.ts`, `tests/unit/health.test.ts`
  - Supporting: `.env.example`, `.dev.vars.example`, `.gitignore`
- **Acceptance Criteria:**
  - `AC-01`: `pnpm lint`, `pnpm typecheck`, `pnpm build` exit `0`.
  - `AC-02`: `GET /api/health` mengembalikan `200 { ok: true, version, ts }` + security headers (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`).
  - `AC-03`: `@theme` di `src/styles/global.css` memuat 100% token warna/font dari `.agent/DESIGN.md`.
- **TDD & Langkah:**
  1. [x] **RED:** Tulis `tests/unit/health.test.ts` (assert status `200`, payload JSON, security headers).
  2. [x] **GREEN:** Inisialisasi proyek Astro 5 + Preact + `@astrojs/cloudflare` + Tailwind v4 + Biome + `/api/health`.
  3. [x] **REFACTOR:** Pastikan `.gitignore` mengecualikan `.env`, `.dev.vars`, `node_modules`, `dist`, `.wrangler`.
- **Verification Gate:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build` -> Exit `0` (Biome 11 files 0 err, tsc 0 err, Vitest 1/1 pass, Astro build OK).

---

#### `[ ] TASK-002` — Katalog Treatment Statis (`catalog.json`), Validasi Deterministik & Sanitizer (`validate.ts`)
- **Status:** `PENDING` · **Owner:** `Zero` · **Workflow:** `.agent/WORKFLOWS/p4-backend-api-endpoint.md`
- **Traceability:** `PRD §5 FR-01, FR-02` · `TSD §4.2, §5, §6.2` · `KNOWLEDGE §2–§3` · **Dependencies:** `TASK-001`
- **Change Boundary:**
  - Primary: `src/lib/catalog.json`, `src/lib/validate.ts`, `tests/unit/validate.test.ts`
  - Supporting: `src/lib/events.ts` *(tipe & event prefill antar island)*
- **Acceptance Criteria:**
  - `AC-01`: `catalog.json` berisi **8 treatment** resmi (3 kategori: `Facial`, `Laser`, `Skin Booster`, harga `Rp 350.000`–`Rp 1.850.000`, durasi, persiapan).
  - `AC-02`: `validateBooking()` menolak input salah dengan daftar detail `{ field, message }`, menormalkan WA (`08...`/`+628...` -> `628...`, `9–15` digit), mengecek tanggal `today..+30d` zona **Asia/Jakarta**, dan slot `09:00..19:00`.
  - `AC-03`: `sanitizeSheetCell()` mengawali `'` pada string berawalan `=`, `+`, `-`, `@`, `\t`, `\r`.
- **TDD & Langkah:**
  1. [ ] **RED:** Unit test edge cases WA, tanggal WIB lewat/+31 hari, slot invalid, `treatment_id` liar, dan formula injection (`=CMD(...)`, `+1+1`).
  2. [ ] **GREEN:** Implementasi `catalog.json` dan `validate.ts`.
  3. [ ] **REFACTOR:** Pastikan nol library validasi eksternal (Zod-lite manual sesuai `TSD §6.1`).
- **Verification Gate:** `pnpm test -- tests/unit/validate.test.ts && pnpm lint && pnpm typecheck` -> Exit `0`.

---

### Fase B — Fitur Inti (`Rate Limit, Google Sheets API, AI CS`)

#### `[ ] TASK-003` — Rate Limiter CF KV (`rate-limit.ts`) & Google Sheets WebCrypto Client (`sheets.ts`)
- **Status:** `PENDING` · **Owner:** `Zero` · **Workflow:** `.agent/WORKFLOWS/p4-external-integration.md`
- **Traceability:** `PRD §5 FR-02` · `TSD §4.2, §5, §6.1` · **Dependencies:** `TASK-002`
- **Change Boundary:**
  - Primary: `src/lib/rate-limit.ts`, `src/lib/sheets.ts`, `tests/unit/rate-limit.test.ts`, `tests/unit/sheets.test.ts`
  - Supporting: `None`
- **Acceptance Criteria:**
  - `AC-01`: Rate limiter mengecek KV fixed-window (`3/jam` booking, `15/jam` chat) & idempotency dedup 15 menit; saat KV throw error -> **fail-open** ke `Map` in-memory lokal + log `ERROR`.
  - `AC-02`: `sheets.ts` melakukan JWT RSA signing via `crypto.subtle` (tanpa SDK `googleapis`), request token cache pendek, dan `values:append` dengan timeout `10s`.
  - `AC-03`: Semua sel dilewatkan `sanitizeSheetCell()` sebelum dikirim; gagal pada `Appointments` setelah `Client_Leads` sukses mengembalikan flag `partial: true` tanpa membuang booking.
- **TDD & Langkah:**
  1. [ ] **RED:** Unit test mock KV (normal, limit `429`, KV exception fail-open) dan mock fetch Sheets (JWT header, timeout `10s`, partial second append).
  2. [ ] **GREEN:** Implementasi `rate-limit.ts` & `sheets.ts`.
  3. [ ] **REFACTOR:** Verifikasi masking nomor WA di log (maks 4 digit akhir).
- **Verification Gate:** `pnpm test -- tests/unit/ && pnpm lint && pnpm typecheck` -> Exit `0`.

---

#### `[ ] TASK-004` — Endpoint `POST /api/booking` (`FR-02`) + Integration Tests
- **Status:** `PENDING` · **Owner:** `Zero` · **Workflow:** `.agent/WORKFLOWS/p4-backend-api-endpoint.md`
- **Traceability:** `PRD §5 FR-02` · `TSD §5` · **Dependencies:** `TASK-003`
- **Change Boundary:**
  - Primary: `src/pages/api/booking.ts`, `tests/integration/booking.test.ts`
  - Supporting: `None`
- **Acceptance Criteria:**
  - `AC-01`: Happy path mengembalikan HTTP `201` + `booking_id` (`BK-XXXXXX`) + `wa_link` terisi nama, treatment, tanggal, slot.
  - `AC-02`: Honeypot `company_website` non-kosong mengembalikan `400 HONEYPOT_TRIGGERED`; payload invalid -> `422`; limit -> `429` dengan `retry_after_seconds`; idempotency hit -> `201` tanpa double-append; gagal Sheets -> `502 SHEET_WRITE_FAILED` lengkap dengan `wa_link` fallback.
- **TDD & Langkah:**
  1. [ ] **RED:** Integration test seluruh jalur (`201`, `400`, `422`, `429`, idempotent `201`, `502`).
  2. [ ] **GREEN:** Implementasi `src/pages/api/booking.ts` tipis memanggil `validate.ts`, `rate-limit.ts`, `sheets.ts`.
  3. [ ] **REFACTOR:** Cek tidak ada raw error/stack-trace/secret di body response.
- **Verification Gate:** `pnpm test -- tests/integration/booking.test.ts && pnpm lint && pnpm typecheck` -> Exit `0`.

---

#### `[ ] TASK-005` — Adapter AI CS Grounded (`ai.ts`) & Endpoint `POST /api/chat` (`FR-03`)
- **Status:** `PENDING` · **Owner:** `Zero` · **Workflow:** `.agent/WORKFLOWS/p4-external-integration.md`
- **Traceability:** `PRD §5 FR-03` · `TSD §5, §6.1` · **Dependencies:** `TASK-003`
- **Change Boundary:**
  - Primary: `src/lib/ai.ts`, `src/pages/api/chat.ts`, `tests/unit/ai.test.ts`, `tests/integration/chat.test.ts`
  - Supporting: `None`
- **Acceptance Criteria:**
  - `AC-01`: System prompt dibangun deterministik dari `catalog.json` + jam buka `09:00–20:00 WIB`; hanya kirim maks `6` pesan terakhir; `1–400` char; `max_tokens <= 300`; `temperature <= 0.3`; timeout `15s` + max `2x` retry 5xx saja.
  - `AC-02`: Pertanyaan medis/resep/diagnosis (`steroid`, `obat`, `resep`, `diagnosis`, `dosis`, dll.) ditolak sopan (non-medis) dan diarahkan ke dokter + booking.
  - `AC-03`: Rate-limit `15/jam/IP` (`429`), timeout/error LLM -> `504` / fallback deterministik berisi jam buka, kisaran harga `Rp 350.000–Rp 1.850.000`, serta `wa_link`; mendukung kill-switch `DISABLE_AI=true`.
- **TDD & Langkah:**
  1. [ ] **RED:** Unit + integration test untuk grounding prompt, guardrail medis, max 6 riwayat, `422`, `429`, `504` fallback, `DISABLE_AI=true`.
  2. [ ] **GREEN:** Implementasi `src/lib/ai.ts` & `src/pages/api/chat.ts`.
  3. [ ] **REFACTOR:** Cek zero leak `AI_API_KEY` dan zero reference ke IP/port privat.
- **Verification Gate:** `pnpm test && pnpm lint && pnpm typecheck` -> Exit `0`.

---

### Fase C — Antarmuka UI Hi-Fi (`SCR-01..04`, State-Complete, Anti-Slop)

#### `[ ] TASK-006` — Halaman Utama `index.astro` (`SCR-01` Hero/Alur/Sheet Proof, `SCR-04` Footer) & `CatalogFilter.tsx`
- **Status:** `PENDING` · **Owner:** `Kay & Zero` · **Workflow:** `.agent/WORKFLOWS/p4-slicing-ui-frontend.md`
- **Traceability:** `PRD §5 FR-01, §7` · `DESIGN_TASK §6.1, §6.4` · `Final_Design P1..P4` · **Dependencies:** `TASK-002`
- **Change Boundary:**
  - Primary: `src/pages/index.astro`, `src/layouts/BaseLayout.astro`, `src/components/CatalogFilter.tsx`, `tests/unit/catalog.test.ts`
  - Supporting: `None`
- **Acceptance Criteria:**
  - `AC-01`: Tampilan 1:1 mengikuti `Final_Design` & `.agent/DESIGN.md` (Strip `LIVE DEMO BYME CORPORATE`, Nav sticky `[DEMO]`, Hero asimetris + chip `dr. Nadya Aurelia, Sp.KK [DEMO]` + Kartu Preview Live Sheet, Alur 3 Langkah, Banner Sage Sheet, Footer `Jl. Senopati No. 48, Jakarta Selatan [DEMO]`).
  - `AC-02`: `CatalogFilter.tsx` menyaring 8 treatment (`Semua (8)`, `Facial (3)`, `Laser (3)`, `Skin Booster (2)`), punya **empty state** + tombol *"Reset ke Semua (8)"*, dan tombol *"Pilih & Booking"* memicu event prefill + scroll ke `#booking`.
  - `AC-03`: 0 emoji, semua harga `tabular-nums`, semua tombol/chip `>= 44x44px`, JS bundle `< 45 KB` gzip.
- **Verification Gate:** `pnpm test && pnpm lint && pnpm typecheck && pnpm build` -> Exit `0`.

---

#### `[ ] TASK-007` — Preact Islands `BookingForm.tsx` (`SCR-02`) & `AiChatDrawer.tsx` (`SCR-03`) dengan State Lengkap
- **Status:** `PENDING` · **Owner:** `Kay & Zero` · **Workflow:** `.agent/WORKFLOWS/p4-api-integration-frontend.md`
- **Traceability:** `PRD §5 FR-02, FR-03` · `DESIGN_TASK §5, §6.2, §6.3` · `Final_Design P1..P4` · **Dependencies:** `TASK-004, TASK-005, TASK-006`
- **Change Boundary:**
  - Primary: `src/components/BookingForm.tsx`, `src/components/AiChatDrawer.tsx`
  - Supporting: `src/pages/index.astro` *(mount kedua island + `pb-20` mobile safe clearance)*
- **Acceptance Criteria:**
  - `AC-01`: `BookingForm` mendukung pre-fill dari `CatalogFilter`/`AiChatDrawer`, slot jam 3-kolom (mobile) / 4-kolom (tablet/desktop) dengan slot hari ini yang lewat otomatis `disabled`, honeypot tersembunyi `company_website`, `X-Idempotency-Key`, state `loading` anti-double-submit, error `422`/`502`/`429` **tanpa hapus input** + `aria-live="polite"`, dan Kartu Konfirmasi `BK-XXXX` (`201`) + link Sheet & `wa.me`.
  - `AC-02`: `AiChatDrawer` tampil sebagai FAB sticky di thumb-zone (`pb-20` aman), membuka bottom-sheet `82dvh` di mobile (`<768px`) / panel `380px` di desktop, punya disclaimer non-medis, 3 quick chips, counter `0/400`, `typing-skeleton` 3-bar, tombol pintas *"Isi Form Booking"*, dan fallback `504`/`429`.
- **Verification Gate:** `pnpm lint && pnpm typecheck && pnpm build` + cek ukuran gzip bundle `dist/_astro/*.js < 45 KB` -> Exit `0`.

---

### Fase D — QA Responsif, Security & Smoke (`Gate 4`)

#### `[ ] TASK-008` — Suite E2E Playwright (`390px WebKit` & `1280px Chromium`), Audit CWV/A11y & Pre-Deploy Check
- **Status:** `PENDING` · **Owner:** `One & Kay` · **Workflow:** `.agent/WORKFLOWS/p4-qa-full-verification.md`
- **Traceability:** `PRD §6` · `TSD §8` · `DESIGN_TASK §7` · **Dependencies:** `TASK-007`
- **Change Boundary:**
  - Primary: `playwright.config.ts`, `tests/e2e/beauty-care.spec.ts`
  - Supporting: `README.md`, `wrangler.toml` *(hanya binding KV & Pages config tanpa secret)*
- **Acceptance Criteria:**
  - `AC-01`: 0 px horizontal overflow pada `390x844` (WebKit), `768x1024`, & `1280x800` (Chromium); `CLS = 0.00`; seluruh target sentuh `>= 44x44px`.
  - `AC-02`: E2E lulus untuk: (1) filter -> pilih treatment -> submit valid -> Kartu `BK-XXXX` (`201` mocked/sandbox), (2) error `422` & `502` mempertahankan input form, (3) AI drawer quick chip -> reply -> *"Isi Form Booking"*, dan penolakan medis + fallback `504`.
  - `AC-03`: 0 secret/private IP di `dist/` & Git history.
- **Verification Gate:** `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm exec playwright test` -> Exit `0`.

---

## 3. Log Blocker & Eskalasi (`BLOCKED`)
| Task ID | Tanggal | Akar Masalah / Gate Gagal | 3 Upaya yang Sudah Dicoba | Keputusan / Pemilik |
|---|---|---|---|---|
| `—` | `—` | `—` | `—` | `—` |
