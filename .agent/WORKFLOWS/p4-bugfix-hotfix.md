# Workflow 16: Bugfix & Hotfix (`p4-bugfix-hotfix.md`)

**Trigger:** Penemuan bug dari QA, staging, error log produksi, atau laporan klien.  
**Owner:** Zero & One

## Konteks Wajib Dibaca
- `.agent/TASK.md` (atau tiket bug baru dengan `Change Boundary`)
- `.agent/KNOWLEDGE.md §5` (*Known Gotchas*) & `.agent/ORCHESTRATOR.md §5` (3-Strike Breaker)

## Langkah Berurutan & Skills Dipanggil
1. **Root Cause Investigation (`core/systematic-debugging.md`):** baca error/stack trace utuh, buat 1 command repro cepat yang pasti gagal pada gejala bug, cek `git log`/`git diff` terakhir, dan lacak sumber data di hulu (dilarang menebak patch).
2. **TDD Regression (`core/tdd-and-verification.md`):** tulis test otomatis yang mereproduksi bug (**RED**) -> terapkan perbaikan akar masalah minimal (**GREEN**) -> jalankan full suite agar nol regresi (**exit 0**). *(Jika gagal 3x pada akar sama -> stop, ubah status `BLOCKED`.)*
3. **Review & Containment (`core/diff-containment.md` + `core/code-review-gate.md`):** hapus seluruh log `[DEBUG-*]`, pastikan diff minimal hanya di boundary bug, dan cek static security scan.
4. **Update Memori Proyek:** catat 1 baris akar masalah + pencegahan di `.agent/KNOWLEDGE.md §5` sebelum status `DONE`.
