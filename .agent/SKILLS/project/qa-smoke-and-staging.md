# Skill: QA Smoke Test, Security Headers & Staging (`project/qa-smoke-and-staging.md`)

> Aktif untuk verifikasi integrasi pra-rilis, setup staging berproteksi, dan gate QA One (`TSD §8`, `SOP-OPS-003`).

## 1. Pre-Release Verification Suite (Non-Interactive / Headless)
1. **Build & Config Check:** Build produksi berhasil bersih (`exit 0`); cek `.env` lengkap terhadap `.env.example`; pastikan 0 kredensial hardcode.
2. **Health & DB Check:** `/health` mengembalikan `200 OK` beserta status koneksi DB.
3. **API Smoke Test (Positif & Negatif):**
   - Uji endpoint utama dengan `curl` / skrip integrasi: happy path (`200/201`), payload invalid (`422`), akses tanpa token (`401`), dan lintas-role/IDOR (`403`).
4. **Responsive & UI Smoke Check:**
   - Cek semua halaman `SCR-xx` render tanpa console error / uncaught exception di viewport `390px`, `768px`, dan `1280px` (0 horizontal overflow di body).

## 2. Standar Staging Berproteksi (Caddy / Reverse Proxy)
- Port aplikasi internal wajib bind ke `127.0.0.1` saja (tidak diekspos langsung ke internet).
- Staging/demo klien wajib dilindungi HTTPS otomatis + `basic_auth` (hash bcrypt) dan security headers:
  - `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`.
- Dilarang meninggalkan proses/artefak uji sementara menumpuk di VPS ber-RAM kecil (`>= 800 MB` available harus terjaga).

## 3. Aturan Rilis & Rollback (`TSD §8`)
- Sebelum deploy produksi: pastikan tag rilis sebelumnya siap dan migrasi bersifat forward-safe.
- Jika setelah rilis `error rate > 2%` atau muncul bug P1: rollback ke tag rilis sebelumnya dan matikan feature flag terkait (tanpa `DROP TABLE`).
