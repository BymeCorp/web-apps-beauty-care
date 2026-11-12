# `.agent/KNOWLEDGE.md` — `web-apps-beauty-care`

> **BYME_SDLC V1.0 — Phase 3 (Context Repo · Domain & Pitfalls)** · **Kode:** `KNOW-BEAUTY-v1.0`  
> **Sumber Spec:** `PRD-BEAUTY-v1.0` (`FROZEN`) + `DESIGN-BEAUTY-v1.0` + `RP-BEAUTY-01` · **Owner:** Sarah (PM) & Zero (Tech Lead) · **Diperbarui:** `2026-11-12`  
> **Fungsi Dokumen:** Pengetahuan bisnis, kamus istilah wajib, aturan numerik/zona waktu, serta daftar jebakan agar agen coding tidak mengarang aturan sendiri.

---

## 1. Ringkasan Domain & Persona Inti
- **Bisnis / Produk:** *Portfolio Mini Live Demo* Byme Corporate untuk prospek pemilik/admin klinik kecantikan & salon UMKM (1–3 cabang). Brand fiktif terkunci: **`Aurelia Skin Clinic [DEMO]`** (dokter demo: `dr. Nadya Aurelia, Sp.KK [DEMO]`, alamat demo: `Jl. Senopati No. 48, Jakarta Selatan [DEMO]`).
- **Pengguna Utama:** Prospek owner klinik yang membuka link dari HP `390px` (prioritas #1, harus langsung paham dalam `<= 10 detik` dan berhasil kirim booking ke Sheet dalam `<= 60 detik`) tanpa login apa pun.
- **Batas Scope Kunci (`PRD §2.2`):** v1 **hanya** Showcase + Katalog 8 Treatment (`FR-01`), Form Booking -> Google Sheet Sandbox (`FR-02`), dan Widget AI CS Non-Medis (`FR-03`). Tidak ada login, DB SQL, RME/rekam medis, foto wajah, kasir/P&L, atau payment gateway.

---

## 2. Ubiquitous Language (*Kamus Istilah & Sinonim Dilarang*)
*Gunakan HANYA Istilah Resmi di kode, nama field JSON, tab Sheet, dan copy UI.*

| Istilah Resmi | Definisi Bisnis (1 Kalimat) | Nama di Kode / Sheet | Sinonim yang Dilarang |
|---|---|---|---|
| **Treatment** | Layanan perawatan klinik yang punya kategori, durasi, harga IDR, dan persiapan | `treatment_id`, `treatment_name` | `Service`, `Product`, `Package`, `Item` |
| **Booking** | Permintaan jadwal kunjungan demo yang dicatat ke tab `Appointments` | `booking_id` (`BK-XXXXXX`), `Appointments` | `Order`, `Reservation`, `Ticket` |
| **Slot Jam** | Pilihan jam mulai kunjungan 60 menit antara `09:00` s/d `19:00` WIB | `booking_slot` (`"09:00"`..`"19:00"`) | `TimeBlock`, `ScheduleUnit` |
| **Lead** | Data kontak pengunjung demo yang ikut tercatat di tab `Client_Leads` | `Client_Leads` | `Prospect`, `PatientRecord` |
| **Status `Pending Demo`** | Status konstan awal baris booking baru di Google Sheet Sandbox | `"Pending Demo"` | `"Booked"`, `"Confirmed"`, `"Paid"` |

- **Kardinalitas:** 1 submit booking valid menghasilkan tepat `1` `booking_id` (`BK-XXXXXX`) dan ditulis ke `1` baris `Client_Leads` + `1` baris `Appointments` pada `DEMO_SPREADSHEET_ID`.

---

## 3. Aturan Bisnis Baku, Rumus & Invariants (*The "Why"*)
1. **Format Harga & Sumber Kebenaran:**
   - Harga disimpan sebagai integer Rupiah (`price_idr`, mis. `450000`) di `src/lib/catalog.json` dan diformat di UI sebagai `Rp 450.000` dengan CSS `font-variant-numeric: tabular-nums`.
   - Server **selalu** mengambil `treatment_name` & `price_idr` dari `catalog.json` berdasarkan `treatment_id` (tidak pernah mempercayai harga dari payload browser).
2. **Zona Waktu (`Asia/Jakarta`, WIB) & Rentang Tanggal:**
   - Seluruh validasi tanggal booking (`today <= booking_date <= today + 30 hari`) dan `created_at_wib` dihitung memakai **zona waktu `Asia/Jakarta` (UTC+7)**, bukan UTC server Cloudflare.
   - Jam buka klinik demo: `09:00–20:00 WIB`; slot mulai yang tersedia: `09:00` s/d `19:00` (step 60 menit). Untuk tanggal hari ini (`today` WIB), slot jam yang sudah lewat di UI ditandai `disabled`.
3. **Invariants Normalisasi WhatsApp & Sanitasi Sheet:**
   - Input WA boleh `08...`, `628...`, atau `+628...` (boleh ada spasi/tanda hubung saat mengetik); server menghapus spasi/dash, menormalkan menjadi format `628...` (`9–15` digit total), dan **wajib** memastikan panjang valid.
   - Setiap string sebelum dikirim ke `values:append` Google Sheets **wajib** melalui `sanitizeSheetCell()` (prefix tanda kutip tunggal `'` bila diawali `=`, `+`, `-`, `@`, `\t`, atau `\r` agar tidak memicu formula injection di Google Sheets).
4. **Guardrail AI CS (`FR-03`):**
   - Hanya menjawab info katalog (8 treatment, harga, durasi, persiapan), jam buka, lokasi demo, dan cara booking.
   - Pertanyaan diagnosis kulit, jerawat meradang, resep obat/krim racikan, atau dosis medis **wajib** ditolak sopan di prompt + pre-filter keyword (`obat`, `resep`, `steroid`, `diagnosis`, `dosis`, `ruam`, `infeksi`, `hamil`, `menyusui`) dan diarahkan ke dokter + CTA booking.

---

## 4. Edge Cases Lapangan & Batas Regulasi
- **Sinyal Lemah / Error API saat Submit (`502/429/422`):** Data form yang sudah diketik user **tidak pernah boleh dikosongkan** ketika error terjadi. Pada `502` / `429`, tampilkan pesan ramah + tombol `wa.me` praisi detail booking dari state form.
- **Double-Click / Double-Submit:** Tombol submit masuk state `loading` + `disabled` saat request berjalan, dan header `X-Idempotency-Key` mencegah baris duplikat dalam window 15 menit di KV.
- **Append Parsial 2 Tab Sheet:** `Client_Leads` ditulis pertama; bila `Appointments` gagal setelah `Client_Leads` berhasil, API tetap kembalikan `201` dengan flag `partial: true` + log `WARN` agar booking demo tidak hilang.
- **UU PDP & Demo Disclaimer:** Seluruh UI menampilkan penanda `[DEMO]` / `LIVE DEMO BYME CORPORATE`; jangan masukkan data rekam medis nyata.

---

## 5. Known Gotchas & Lessons Learned (*Living Log*)
| Tanggal | Area / Integrasi | Gejala & Akar Masalah | Aturan Wajib Agar Tidak Terulang |
|---|---|---|---|
| `2026-11-12` | Cloudflare Workers + Sheets | `googleapis` Node SDK gagal/terlalu gemuk di edge runtime Workers | Gunakan JWT signing WebCrypto (`crypto.subtle` RS256) + `fetch()` langsung ke `oauth2.googleapis.com/token` & `sheets.googleapis.com/v4` |
| `2026-11-12` | Zona Waktu CF Edge | `new Date().toISOString().slice(0,10)` di CF Worker memakai UTC (meleset 7 jam dini hari WIB) | Gunakan `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' })` untuk `today` WIB |
| `2026-11-12` | Alamat Demo Konsisten | Sempat ada perbedaan alamat antara early wireframe (`Melati/Bandung`) vs `DESIGN_TASK` (`Senopati/Jaksel`) | Selalu gunakan `Jl. Senopati No. 48, Jakarta Selatan [DEMO]` dari `DESIGN_TASK §1.2` |

---

## 6. Asumsi Terbuka & Eskalasi Domain
- **`OQ-02` (`PRD §8`):** Penyediaan `DEMO_SPREADSHEET_ID` & Google Service Account JSON untuk `bymecorporate@gmail.com` dijadwalkan untuk Pak Yasfiq / One sebelum deploy staging (`TASK-008` / Phase 5). Selama dev lokal & test, gunakan mock fetch & `.dev.vars` placeholder.
- **Eskalasi:** Jika ditemukan konflik copy/harga/guardrail medis di luar 8 item katalog, berhenti dan tanyakan ke Sarah / Pak Yasfiq sebelum mengarang harga baru.
