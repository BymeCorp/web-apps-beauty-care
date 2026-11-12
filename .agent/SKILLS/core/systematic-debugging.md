# Skill: Systematic Debugging & 3-Strike Circuit Breaker (`core/systematic-debugging.md`)

> Iron Law: **NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.** Dilarang menebak-nebak patch tanpa repro merah yang pasti.

## 1. Fase 1 — Root Cause Investigation (*Wajib Sebelum Edit Kode*)
1. **Baca Error Utuh:** Stack trace lengkap, kode status HTTP, baris persis, dan log server/DB.
2. **Buat Tight Repro Loop:** Satu command cepat & deterministik yang gagal pada gejala persis (unit test repro, `curl`, atau skrip CLI) dan hanya lulus saat bug teratasi.
3. **Cek Perubahan Terakhir:** Jalankan `git log -n 5 --oneline` dan `git diff` untuk melihat apa yang baru berubah.
4. **Telusuri Aliran Data:** Lacak dari tempat error muncul mundur ke hulu hingga sumber data rusak ditemukan.

## 2. Fase 2 & 3 — Pattern Compare & Minimal Hypothesis
- Bandingkan dengan jalur serupa di repo yang bekerja normal (`search_files`).
- Rumuskan maksimal 1 hipotesis terkuat per langkah ("Jika X penyebabnya, mengubah Y akan menghasilkan Z") dan uji satu variabel pada satu waktu.
- Jika menambah log debug sementara, beri tag unik `[DEBUG-TASK]` agar bersih saat dihapus.

## 3. Fase 4 — Fix & Regression Proof
1. Tulis test otomatis yang mereproduksi bug (**RED**).
2. Perbaiki akar masalah dengan diff minimal (**GREEN**).
3. Hapus log debug, jalankan full test suite (`tdd-and-verification.md`), dan catat 1 baris pelajaran di `.agent/KNOWLEDGE.md §5` (*Known Gotchas*) agar tidak berulang.

## 4. Aturan 3-Strike Circuit Breaker (`ORCHESTRATOR.md §5`)
- Jika **3 percobaan perbaikan gagal** pada akar masalah yang sama (atau setiap fix memunculkan bug baru di tempat lain -> tanda masalah arsitektur):
  1. **BERHENTI.** Jangan coba fix ke-4 secara membabi buta.
  2. Kembalikan perubahan yang tidak stabil (`git checkout -- <affected>`).
  3. Ubah status di `TASK.md` menjadi `BLOCKED` dan laporkan command gagal + 3 hal yang sudah dicoba + dugaan akar masalah ke Zero / Pak Yasfiq.
