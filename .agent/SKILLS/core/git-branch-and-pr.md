# Skill: Git Branch, Commit & PR Hygiene (`core/git-branch-and-pr.md`)

> Prinsip: Setiap commit harus kecil, atomik terhadap 1 `TASK-xxx`, bersih dari junk, dan mudah di-rollback.

## 1. Konvensi Branch
- Dilarang coding langsung di `main` untuk perubahan fitur/fix substantif.
- Gunakan nama branch terikat task:
  - `feat/TASK-xxx-deskripsi-singkat`
  - `fix/TASK-xxx-deskripsi-bug`
  - `chore/TASK-xxx-setup`

## 2. Aturan Commit Atomik
- Satu commit = satu `TASK-xxx` (atau satu sub-slice bersih yang bisa build & lulus test).
- Sebelum `git add`, jalankan `git status` dan `git diff --stat` (`diff-containment.md`):
  - **Dilarang** `git add -A` secara membabi buta jika ada file untracked/eksperimen di luar `Change Boundary` — stage eksplisit file yang disetujui (`git add <file1> <file2>`).
- Format pesan commit:
  - `feat(TASK-003): tambah endpoint buat order dengan idempotency`
  - `fix(TASK-012): tangani timeout webhook payment`

## 3. Larangan Keras Git
- **DILARANG** `git push --force` atau `git push -f` ke `main`/branch bersama.
- **DILARANG** `--no-verify` untuk melewati pre-commit lint/test hooks.
- **DILARANG** `git reset --hard` sebelum memeriksa perubahan lokal yang belum di-commit.
- Jangan merge/push ke `main` tanpa bukti verification gate exit `0` dan approval sesuai `ORCHESTRATOR.md`.

## 4. Ringkasan PR / Handover Task
Setiap PR atau laporan selesai menyertakan tepat 3 hal:
1. **Task & Traceability:** `TASK-xxx` (`PRD FR-xx` / `SCR-xx`).
2. **Files Changed:** daftar path sesuai `Change Boundary`.
3. **Verification Proof:** command exact + ringkasan output (`exit 0`).
