# `.agent/ORCHESTRATOR.md` — `web-apps-beauty-care`

> **BYME_SDLC V1.0 — Phase 3 (Context Repo · Execution & Coordination)** · **Kode:** `ORCH-BEAUTY-v1.0`  
> **Sumber Spec:** `TASK.md` + `RULES.md` + `ARCHITECTURE.md` · **Owner:** Alveria (Lead) & Zero (Tech Lead) · **Diperbarui:** `2026-11-12`  
> **Fungsi Dokumen:** Mengatur eksekusi 1 task per giliran, handoff subagent, verification gate berlapis, dan circuit breaker 3-strike pada Acer WSL (`web-apps-beauty-care`).

---

## 1. Peran & Peta Routing (*Who Does What*)
| Peran / Agen | Fokus Tanggung Jawab | Target Node / Scope | Larangan |
|---|---|---|---|
| **Alveria** *(Lead / SPOC)* | Triase task, pecah giliran (`1 TASK = 1 giliran`), konsolidasi lapor Pak Yasfiq | VPS -> SSH Acer WSL | Tidak menulis kode produksi langsung tanpa task aktif |
| **Zero** *(Tech Lead)* | Implementasi Astro/Preact, API endpoints, Sheets WebCrypto, AI client, Vitest | Acer WSL `/home/yasfiq/Projects/web-apps-beauty-care` | Tidak mengubah scope `PRD` atau palet `DESIGN.md` |
| **Kay** *(UI/UX)* | Audit slicing UI terhadap `DESIGN.md` & `Final_Design`, responsif `390/768/1280` | Acer WSL `src/pages/index.astro`, `src/components/*` | Tidak menyentuh API/rate-limiter/env secrets |
| **One** *(QA & Infra)* | Playwright WebKit/Chromium, smoke `/health`, headers security, deploy CF Pages | Acer WSL `tests/e2e/*` & CF Pages | Tidak menambah fitur di luar `TASK.md` |
| **Sarah** *(PM / Spec)* | Verifikasi AC `Given-When-Then` & copy Bahasa Indonesia non-klise | Dokumen `.agent/` & UAT | Tidak menyunting kode implementasi |

---

## 2. Siklus Eksekusi Task Atomik (*Closed Execution Loop*)
Kerjakan **tepat 1 `TASK-xxx` aktif (`IN_PROGRESS`) per giliran** sesuai urutan di `TASK.md`:
1. **Preflight & Load Konteks:** Baca `RULES.md`, `TASK.md` (1 task aktif + `Change Boundary`), workflow `.agent/WORKFLOWS/` terkait, dan skill `.agent/SKILLS/` yang dirujuk.
2. **Baseline Check:** Pastikan `git status` bersih dan berada di branch fitur (`feat/task-xxx`), jangan bekerja langsung menumpuk kotoran di `main`.
3. **Implementasi (TDD):** Tulis test gagal (`RED`) -> kode minimal sesuai *Developer Ladder* (`GREEN`) -> refactor bersih.
4. **Verification Gate Berlapis (berhenti jika layer mana pun gagal):**
   - `Layer 1:` `pnpm typecheck` & `pnpm test -- <unit>`
   - `Layer 2:` Integration API contract (`POST /api/booking`, `POST /api/chat` mock fetch)
   - `Layer 3:` `pnpm lint` & `pnpm build` (wajib exit `0` + cek 0 secret di `dist/`)
   - `Layer 4:` `pnpm exec playwright test` (WebKit `@390` + Chromium `@1280` pada task UI/E2E)
5. **Containment Audit & Review:** Jalankan `git diff --stat` (hanya file dalam `Change Boundary`), perbarui status `TASK.md` & `ARCHITECTURE.md` (bila ada modul baru).

---

## 3. Mesin Status Task (*State Machine*)
```text
PENDING ──(preflight OK)──► IN_PROGRESS ──(semua verification gate exit 0)──► IN_REVIEW ──(containment + review OK)──► DONE
                                 │                                               │
                                 ├──(gagal < 3x, akar jelas)──► RETRY ───────────┘
                                 └──(gagal >= 3x / butuh HITL)──────────────────► BLOCKED
```
- Dilarang menandai `DONE` tanpa output nyata dari command verifikasi (`exit 0`).

---

## 4. Kontrak Handoff & Delegasi Subagent
```text
TARGET AGENT : [Zero / Kay / One / Sarah]
TASK ID      : [TASK-xxx + 1 kalimat tujuan]
CONTEXT      : [File terkait + batasan TSD/DESIGN + dependensi]
SCOPE FILES  : [Hanya file Change Boundary TASK-xxx]
VERIFY CMD   : [Command persis yang wajib exit 0]
CONSTRAINTS  : [No new package outside TSD §2, no emoji, preserve input on error]
```

---

## 5. Circuit Breaker & Anti-Loop (*Batas Gagal Otomatis*)
- Jika perbaikan pada akar masalah sama gagal **3 kali berturut-turut**, hentikan loop, set status `BLOCKED` di `TASK.md`, catat 3 percobaan & gejala di tabel §3 `TASK.md`, dan laporkan ke Pak Yasfiq.

---

## 6. Human-in-the-Loop (HITL) Gates — Wajib Izin Pak Yasfiq
1. Menambah dependency baru di luar daftar `TSD §2`.
2. Mengubah kontrak API publik (`TSD §5`) atau skema kolom Google Sheets (`TSD §4.2`).
3. Menambah fitur di luar 3 pilar `PRD §2.1`.
4. Menyunting `.agent/RULES.md` atau deploy/secret ke Cloudflare Pages produksi (`wrangler pages secret put` / `wrangler pages deploy`).
5. Operasi Git destruktif (`--force`, `reset --hard`).
