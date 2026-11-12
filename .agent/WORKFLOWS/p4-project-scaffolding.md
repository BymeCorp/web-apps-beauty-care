# Workflow 09: Project Scaffolding (`p4-project-scaffolding.md`)

**Trigger:** Task awal Phase A di `.agent/TASK.md` (inisialisasi struktur repo, linter, typecheck, env, `/health`).  
**Owner:** Zero

## Konteks Wajib Dibaca
- `.agent/RULES.md` (§2 exact commands & §3 Dependency Boundary)
- `.agent/ARCHITECTURE.md` (§1–§2 peta direktori target)
- `.agent/TASK.md` (1 task aktif + `Change Boundary`)

## Langkah Berurutan & Skills Dipanggil
1. **Preflight & Branch (`core/git-branch-and-pr.md`):** pastikan working tree bersih dan buat branch `chore/TASK-xxx-scaffold`.
2. **Struktur & Stack Minimal (`core/developer-ladder.md`):** bangun hanya paket/folder yang tercantum di `TSD §2` & `ARCHITECTURE.md §2`; konfigurasi linter + strict typecheck (`noImplicitAny` / `mypy strict`).
3. **Env & Security Baseline (`core/security-and-auth-guard.md`):** siapkan `.env.example` (kunci saja, tanpa nilai nyata) dan pastikan `.env`, `*.key`, `dist/`, `node_modules/` masuk `.gitignore`.
4. **Healthcheck & Verifikasi (`core/tdd-and-verification.md`):** tulis test/assert `/health` -> implementasi endpoint `/health` -> jalankan `lint`, `typecheck`, `test`, `build` hingga **exit 0**.
5. **Audit Containment (`core/diff-containment.md`):** cek `git status` & `git diff --stat` sesuai `Change Boundary` -> status `IN_REVIEW`.
