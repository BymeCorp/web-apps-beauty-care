# Skill: Diff & Blast-Radius Containment (`core/diff-containment.md`)

> Prinsip: Lulus test bukan berarti perubahan aman. **Every mutation must be intentional, explainable, and contained.**

## 1. Baseline Sebelum Mulai
Sebelum menyentuh file apa pun untuk `TASK-xxx`:
- Jalankan `git status` dan `git branch --show-current`.
- Jika ada perubahan pra-eksis yang bukan milik `TASK-xxx`, **jangan** di-revert, diformat ulang, atau ikut di-commit.

## 2. Kontrak Batas File (*Boundary Law*)
- Hanya boleh membuat/mengubah file yang terdaftar di **`Change Boundary`** `TASK-xxx` (`Primary` + `Supporting Files`).
- Jika ada file di luar daftar yang terpaksa disentuh, hentikan sebentar untuk menilai apakah butuh justifikasi eksplisit atau `TASK` baru.
- **Dilarang diam-diam menyentuh:**
  - Lockfile & manifest (`package.json`, `pyproject.toml`, `Cargo.toml`) -> butuh izin HITL `ORCHESTRATOR.md §6`.
  - Config linter/compiler/test (`tsconfig`, `eslint`, `vitest`) untuk mengakali test gagal -> **DILARANG KERAS**.
  - File `.env`, `*.key`, `*.pem`, atau artefak build (`dist/`, `.next/`, `coverage/`).

## 3. Audit Pra-Selesai (*Wajib Sebelum Lapor `IN_REVIEW`*)
Jalankan dan periksa seluruh output:
```bash
git status
git diff --stat
git diff
```
Pastikan 6 hal berikut bersih:
1. **File Containment:** 100% path berubah ada di `Change Boundary` (termasuk file baru, hapus, atau rename).
2. **Secret Scan:** 0 hardcoded key/token/password di baris `+`.
3. **Formatting Sprawl:** 0 reformat seluruh file atau ubah baris yang tidak terkait `TASK-xxx`.
4. **No Deleted Safety:** tidak ada validasi, guard auth, error handling, atau test yang diam-diam terhapus.
5. **No Stray Artifacts:** tidak ada file sementara, `console.log`/`print` debug, atau kode ter-comment sisa.
6. **Rollback Aman:** jika ada mutasi nyasar, revert spesifik path itu saja (`git checkout -- <path>`) — jangan `git reset --hard` pada worktree kotor.
