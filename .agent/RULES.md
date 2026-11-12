# `.agent/RULES.md` — `web-apps-beauty-care`

> **BYME_SDLC V1.0 — Phase 3 (Context Repo · Always Loaded)** · **Kode:** `RULES-BEAUTY-v1.0`  
> **Sumber Otoritatif:** `PRD-BEAUTY-v1.0` (`FROZEN`) + `TSD-BEAUTY-v1.0` (`LOCKED`) · **Owner:** Zero (Tech Lead)  
> **Kebijakan Edit:** File ini **read-only untuk coding agent**. Hanya boleh diubah lewat persetujuan Zero / Pak Yasfiq saat TSD atau stack diperbarui.  
> **Bridge Root Repo:** `AGENTS.md` & `CLAUDE.md` di root merujuk `@.agent/RULES.md` — tanpa duplikasi aturan.

---

## 1. Prioritas Aturan (*Conflict Resolution*)
1. **Keamanan & Privasi (§4)** — tidak pernah bisa dinegosiasikan.
2. **Scope Freeze (`PRD` & `TSD`)** — dilarang menambah fitur di luar `TASK.md` (no login, no DB SQL, no RME, no payment gateway, no gateway WA berbayar).
3. **Aturan Repo ini (`RULES.md`) & `ARCHITECTURE.md`**.
4. **Prompt tugas aktif di `TASK.md`**.

---

## 2. Perintah Proyek (*Exact Commands — Jangan Menebak*)
| Aksi | Command Persis | Keterangan |
|---|---|---|
| Install deps | `pnpm install --frozen-lockfile` | Jalankan hanya saat lockfile berubah (Node `>= 22 LTS` + `pnpm 9`) |
| Dev server | `pnpm dev` | Astro SSR dev lokal (`http://localhost:4321`) |
| Lint & Format | `pnpm lint` | Biome check (`0` error & `0` warning sebelum selesai) |
| Typecheck | `pnpm typecheck` | `astro check && tsc --noEmit` (`strict: true`) |
| Single test | `pnpm test -- <path>` | Vitest target spesifik selama TDD |
| Full test & build | `pnpm test && pnpm build` | Vitest + Astro build (`dist/`), wajib exit `0` |
| E2E responsif | `pnpm exec playwright test` | WebKit `@390` + Chromium `@1280` (sebelum QA Gate 4) |

---

## 3. Prinsip Engineering & Batas Dependensi (*The Developer Ladder*)
1. **Urutan solusi:** `Stdlib` TS/Web -> `Native platform` (CSS, Astro SSR, CF KV, fetch AbortController) -> `Library terdaftar di TSD §2` -> `Kode minimal`.
2. **Dependency Boundary:** **DILARANG** menambah package di luar `astro 5`, `preact 10`, `@astrojs/preact`, `tailwindcss 4`, `@astrojs/cloudflare`, `vitest`, `playwright`, `@biomejs/biome` tanpa izin tertulis Zero / Pak Yasfiq. (Validasi form manual deterministik di `src/lib/validate.ts`, tanpa Zod/ORM).
3. **Minimal Diff & YAGNI:** Baca file target & utilitas yang sudah ada sebelum menulis kode. Dilarang membuat abstraksi untuk 1 implementasi maupun merapikan file di luar scope `TASK` aktif.
4. **Konvensi Bahasa & Boundary:** TypeScript `strict`, 2-spasi, `camelCase`/`PascalCase` komponen; JSON API `snake_case` (`treatment_id`, `booking_date`, `booking_slot`, `customer_name`, `booking_id`). Pisahkan logika murni (`src/lib/`) dari route handler (`src/pages/api/`).

---

## 4. Batasan Keamanan, Data & Git (*Hard Guardrails*)
- **Secrets:** 100% kredensial (`GOOGLE_SERVICE_ACCOUNT_JSON`, `DEMO_SPREADSHEET_ID`, `AI_API_KEY`, `AI_BASE_URL`, `AI_MODEL`) lewat `.dev.vars` (lokal) & Cloudflare Pages Secrets. **DILARANG** hardcode di kode, test fixture nyata, atau `dist/` client bundle, maupun menyebut IP/port VPS privat (`43.173.42.244:20128`).
- **Input & Anti-Abuse:** Validasi seluruh payload di server (`POST /api/booking`, `POST /api/chat`), cek honeypot `company_website` (wajib kosong), rate-limit via CF KV, serta **wajib lewatkan setiap sel ke `sanitizeSheetCell()`** (prefix `'` untuk awalan `=`, `+`, `-`, `@`, `\t`, `\r`).
- **Privasi Log (UU PDP):** Jangan cetak WA/nama penuh ke log plaintext — tampilkan maks 4 digit terakhir WA (mis. `+628...7890`).
- **Git Hygiene:** Bekerja di branch task (`feat/task-xxx`, `fix/...`); **DILARANG** `git push --force`, `git reset --hard`, atau `--no-verify`.

---

## 5. Anti-Slop & Common Pitfalls
- **Error Handling:** **DILARANG** menelan error (`catch {}` kosong) atau mengembalikan mock sukses palsu; gunakan format error JSON deterministik (`400/422/429/502/504`) sesuai `TSD §5` dan **pertahankan seluruh input form** saat error.
- **No Stubs / Hallucinated APIs:** Jangan menyebut file/fungsi sebelum dicek ada. Jangan tinggalkan `TODO` di jalur produksi.
- **UI & Aset (lihat `DESIGN.md`):** 0 emoji di UI/copy; pakai token *Clinical Warm Editorial* (`#FAF8F5` / `#B45339` / `#2F5241`); harga/kode `BK-XXXX` wajib `tabular-nums`; seluruh kontrol interaktif `>= 44x44px`; AI CS wajib non-medis + fallback deterministik.

---

## 6. Verifikasi & *Definition of Done* (Pre-Done Gate)
1. TDD nyata: tulis test/assert gagal dulu (`RED`) -> implementasi minimal (`GREEN`) -> refactor.
2. `pnpm lint && pnpm typecheck && pnpm test && pnpm build` keluar dengan **exit code 0** setelah edit terakhir.
3. `git status` & `git diff --stat` hanya menyentuh file `Change Boundary` task aktif, 0 secret di `dist/` & Git.
4. Lapor hanya fakta output command nyata — bukan asumsi.

---

## 7. Stop & Escalate Triggers (*Wajib Berhenti*)
1. Kontradiksi antara `PRD`, `TSD`, `DESIGN.md`, atau kondisi repo nyata.
2. Perbaikan gagal **3x berturut-turut** pada akar masalah sama (*Circuit Breaker*).
3. Tugas butuh package baru di luar `TSD §2` atau mengubah kontrak JSON publik.
4. Mutasi menyentuh file di luar scope `TASK` aktif atau menemukan kebocoran kredensial.
