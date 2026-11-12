# Workflow 17: Pre-Merge Code Review (`p4-pre-merge-review.md`)

**Trigger:** Setiap `TASK-xxx` masuk status `IN_REVIEW` sebelum ditandai `DONE` atau di-merge ke `main`.  
**Owner:** Zero & Alveria

## Konteks Wajib Dibaca
- `.agent/TASK.md` (1 task target + `Acceptance Criteria` + `Change Boundary`)
- `.agent/RULES.md §4–§6` & `.agent/ORCHESTRATOR.md §2–§4`

## Langkah Berurutan & Skills Dipanggil
1. **Verifikasi Bukti Eksekusi (`core/tdd-and-verification.md`):** konfirmasi command test, typecheck, lint, dan build benar-benar dijalankan setelah edit terakhir (bukan hasil lama) dengan **exit 0**.
2. **Audit Blast-Radius (`core/diff-containment.md`):** jalankan `git status` dan `git diff --stat`; tolak mutasi file di luar `Change Boundary`, lockfile liar, atau reformat massal.
3. **Independent Code Review (`core/code-review-gate.md`):** jalankan static security scan, cek kesesuaian layer (`ARCHITECTURE.md §4`), *Ubiquitous Language*, dan 4 lensa kualitas. *(Jika gagal -> `RETRY` ke implementer; maks 2 siklus sebelum `BLOCKED`.)*
4. **Commit & PR Clean (`core/git-branch-and-pr.md`):** stage hanya file disetujui, commit konvensional `feat/fix(TASK-xxx): ...`, tulis ringkasan 3 poin, lalu tandai `TASK-xxx` **DONE** di `TASK.md`.
