# Default `.agent/SKILLS/` — BYME_SDLC V1.0

Katalog standar skill on-demand di dalam setiap repositori proyek (`<repo>/.agent/SKILLS/`), mengikuti pola **Split 2 Lapis**:
- **Global Hermes Skills (`sdlc-phase0..5`):** mengelola Phase 0–3 & Handover Docs (di luar/sebelum repo kode).
- **Repo `.agent/SKILLS/` (folder ini):** mengelola standar teknis Phase 4–5 yang dipanggil langsung oleh `.agent/WORKFLOWS/` saat coding, testing, review, dan deploy.

## 1. `core/` — Wajib Ada di Semua Repo Proyek (8 Skill)
| File | Dipakai Saat | Inti Aturan |
|---|---|---|
| `core/developer-ladder.md` | Semua task coding | YAGNI -> reuse -> stdlib -> native/DB -> installed -> minimal diff; nol abstraksi spekulatif |
| `core/tdd-and-verification.md` | Semua task ber-behavior | Iron Law `RED -> GREEN -> REFACTOR`, mapping AC, regression + evidence exit `0` |
| `core/diff-containment.md` | Sebelum selesai / commit | Mutasi hanya pada `Change Boundary` `TASK.md`, nol dependency/config drift, zero secret |
| `core/code-review-gate.md` | Review pra-merge & hotfix | Static security scan + audit kontrak `PRD/TSD` + 4 lensa kualitas (tanpa auto-commit liar) |
| `core/systematic-debugging.md` | Bugfix & error berulang | 4 tahap root-cause + tight repro loop + 3-strike circuit breaker |
| `core/security-and-auth-guard.md` | Auth, endpoint, DB, integrasi | `.env` only, validasi boundary, RBAC server-side (anti-IDOR), webhook verify, UU PDP |
| `core/git-branch-and-pr.md` | Branching, commit, PR | Branch `feat/`/`fix/`, commit atomik per `TASK-xxx`, larangan `force-push`/`--no-verify` |
| `core/anti-slop-ui.md` | Semua task UI | Token `.agent/DESIGN.md`, single accent, zero emoji, `tabular-nums`, state-complete |

## 2. `project/` — Dipilih Sesuai Stack `TSD §2` (5 Skill)
| File | Aktif Jika Proyek Punya | Inti Aturan |
|---|---|---|
| `project/db-migration-safety.md` | Database SQL/ORM | Forward-only migration, constraint di DB (`UNIQUE/CHECK/FK`), dilarang edit migrasi lama |
| `project/api-contract-validation.md` | REST/RPC API & integrasi FE-BE | Skema DTO ketat, error JSON deterministik `TSD §5`, `idempotency_key`, UTC/WIB & IDR integer |
| `project/frontend-cwv-and-responsive.md` | Frontend Web / Next.js | Server-first, `LCP <= 1.2s / INP <= 80ms / CLS 0`, reflow `390 / 768 / 1280`, touch `>= 44px` |
| `project/external-integration-resilience.md` | Payment, WA, SMTP, atau LLM/AI | Timeout `<= 15s`, retry backoff terbatas, self-healing JSON repair, fallback deterministik |
| `project/qa-smoke-and-staging.md` | Staging & QA rilis | Headless API/UI smoke, security headers/Caddy Basic Auth, healthcheck, rollback tag |

## Cara Pakai Saat Bootstrap Repo (Phase 3)
1. Salin seluruh isi `core/` ke `<repo>/.agent/SKILLS/core/`.
2. Salin modul yang relevan dari `project/` sesuai tabel teknologi di `TSD §2` ke `<repo>/.agent/SKILLS/project/`.
3. Jangan memuat semua file skill ke prompt awal — panggil **on-demand** hanya yang disebut oleh workflow aktif di `.agent/WORKFLOWS/` atau kartu `TASK.md`.
