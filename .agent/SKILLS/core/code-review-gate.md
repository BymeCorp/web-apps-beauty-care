# Skill: Code Review Gate (`core/code-review-gate.md`)

> Prinsip: **Reviewer tidak boleh mengedit implementasi saat menilai, dan tidak boleh otomatis melakukan `git commit` sebelum seluruh gate lolos.**

## 1. Pemindaian Statis Keamanan (*Static Diff Scan*)
Periksa baris baru (`git diff`) terhadap pola berbahaya berikut:
- Hardcoded secrets (`api_key`, `secret`, `password`, `token` literal).
- Shell injection (`os.system`, `subprocess(..., shell=True)` dengan input user).
- Dangerous eval/deserialization (`eval()`, `exec()`, `pickle.loads()`, `dangerouslySetInnerHTML` tanpa sanitasi).
- SQL injection (string formatting/concatenation di query alih-alih parameterized query).

*Temuan satu pun pola di atas = **AUTO-FAIL**.*

## 2. Audit Keselarasan Spec & Arsitektur (`BYME_SDLC V1.0`)
- **Traceability:** Semua *Acceptance Criteria* di `TASK-xxx` (merujuk `PRD FR-xx` / `SCR-xx`) punya implementasi & bukti test nyata.
- **Layer Boundaries (`ARCHITECTURE.md §4`):** Tidak ada query DB di komponen UI, tidak ada logika bisnis berat di controller/route, tidak ada `fetch()` liar di luar adapter.
- **Ubiquitous Language (`KNOWLEDGE.md §2`):** Penamaan variabel/DTO/endpoint memakai istilah resmi, bebas sinonim terlarang.
- **No Slop:** Tidak ada `catch {}` kosong, dummy fallback palsu, `as any`, atau komentar bertele-tele.

## 3. Review 4 Lensa Cepat (Untuk Perubahan >= 2 File)
1. **Correctness & Edge Cases:** Kondisi batas, null/empty, race/idempotency, dan error path ditangani deterministik.
2. **Reuse & Simplicity:** Tidak menduplikasi helper yang sudah ada; mengikuti *Developer Ladder*.
3. **Efficiency:** Tidak ada N+1 query, loop blocking, atau pemanggilan berulang yang tidak perlu.
4. **Root Depth (Altitude):** Perbaikan menyelesaikan akar masalah di jalur bersama, bukan menambal gejala dengan `if` khusus.

## 4. Keputusan & Tindak Lanjut
- **PASS:** Lanjut ke `git-branch-and-pr.md` untuk commit bersih (`TASK` -> `DONE`).
- **REQUEST CHANGES:** Daftar temuan spesifik (`file:line + masalah + perbaikan minimal`); kembalikan ke implementer (`RETRY`, maksimal 2 siklus sebelum eskalasi `BLOCKED`).
