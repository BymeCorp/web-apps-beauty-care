# Skill: The Developer Ladder & Minimal Diff (`core/developer-ladder.md`)

> Dipanggil oleh workflow build backend/frontend sebelum menulis baris kode baru.

## 1. Tangga Pengambilan Keputusan (*Berhenti di Tangga Pertama yang Cukup*)
1. **YAGNI:** Apakah fitur/abstraksi ini benar-benar diminta `TASK-xxx` & `PRD` saat ini? Jika spekulatif ("siapa tahu nanti butuh"), **jangan buat**.
2. **Reuse Eksisting:** Cek utilitas/helper/komponen yang sudah ada di repo via `search_files` sebelum membuat baru.
3. **Stdlib Bahasa:** Gunakan fungsi standar runtime (`pathlib`, `json`, `urllib`, `URL`, `Intl`) sebelum menulis utilitas rumahan.
4. **Fitur Native Platform / DB:** Gunakan HTML/CSS native (Grid/Flex, `<input>` validasi) dan constraint SQL (`UNIQUE`, `CHECK`, `FK`) dibanding kode aplikasi ratusan baris.
5. **Library Terpasang (`TSD §2`):** Pakai dependency yang sudah tertera di `TSD §2`. **DILARANG** menambah package baru tanpa izin HITL Zero / Pak Yasfiq.
6. **Kode Minimal:** Tulis implementasi paling sederhana dan membosankan (*boring over clever*) yang lulus test.

## 2. Larangan Arsitektur Bloat
- **Dilarang abstraksi prematur:** tidak ada interface dengan 1 implementasi, factory untuk 1 tipe, atau file config untuk konstanta tetap.
- **Controller/Route Tipis:** logika bisnis wajib terpisah di `src/modules/<domain>/` (lihat `ARCHITECTURE.md §4`), bukan di dalam route handler atau komponen UI.
- **Minimal Diff:** sentuh sesedikit mungkin baris yang relevan dengan `TASK-xxx`; jangan memformat ulang kode di luar scope.
