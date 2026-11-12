# Skill: TDD & Verification Runner (`core/tdd-and-verification.md`)

> Core principle: **No production behavior without a failing test first. No evidence -> No completion.**

## 1. Siklus Wajib (`RED -> GREEN -> REFACTOR`)
1. **RED (Test Gagal Lebih Dulu):**
   - Turunkan minimal 1 test dari *Acceptance Criteria* `TASK.md` (mencakup Happy Path + minimal 1 Error/Boundary Case).
   - Jalankan test tunggal tersebut dan pastikan gagal karena **assertion perilaku yang belum ada** (bukan typo/syntax/import error).
2. **GREEN (Kode Minimal):**
   - Tulis kode seminimal mungkin sampai test merah tadi lulus. Dilarang memodifikasi/melonggarkan test atau menulis mock palsu agar hijau.
3. **REFACTOR (Bersih Saat Hijau):**
   - Hapus duplikasi, rapikan penamaan sesuai `KNOWLEDGE.md §2`, jalankan ulang suite test untuk memastikan nol regresi.

*(Pengecualian TDD hanya untuk perubahan konfigurasi/dokumen/CSS murni yang tidak mengubah logika — tetap wajib verifikasi alternatif seperti lint/build/typecheck.)*

## 2. Integritas Test (*Anti Test-Theater*)
- Dilarang menulis assertion hampa (`expect(true).toBe(true)` atau hanya mengecek mock terpanggil).
- Uji output nyata, perubahan state DB, kontrak status HTTP (`200/201/400/403/409/422`), atau perilaku UI nyata.

## 3. Verification Gate Sebelum `IN_REVIEW` / `DONE`
Jalankan berurutan dari `RULES.md §2` setelah edit terakhir:
1. Target test (`TASK-xxx`) -> **exit 0**
2. Full test suite (regression check) -> **exit 0**
3. Typecheck (`tsc --noEmit` / `mypy`) -> **exit 0**
4. Linter & Formatter -> **exit 0**
5. Build produksi (jika menyentuh aplikasi web/bundle) -> **exit 0**

Catat command persis + hasil ringkasnya pada laporan penyelesaian `TASK.md` (dilarang klaim "seharusnya lulus" atau "PASS" jika command belum dijalankan).
