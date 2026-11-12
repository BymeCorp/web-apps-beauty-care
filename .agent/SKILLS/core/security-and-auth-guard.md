# Skill: Security & Auth Guard (`core/security-and-auth-guard.md`)

> Prioritas #1 di `RULES.md §1`: keamanan dan privasi mengalahkan kecepatan rilis.

## 1. Manajemen Secrets & Environment
- 100% API key, DB URL, JWT/auth secret, dan webhook key hanya berasal dari environment variable (`.env`).
- Pastikan `.env`, `.env.*` (kecuali `.env.example`), `*.key`, `*.pem` selalu masuk `.gitignore`.
- **Dilarang** mengekspos secret ke client bundle (`NEXT_PUBLIC_*` hanya untuk kunci publik yang memang aman di browser) atau ke test fixture produksi.

## 2. Autentikasi, RBAC & Anti-IDOR
- Cek sesi/token **di server** pada setiap route/action non-publik (jangan pernah mengandalkan penyembunyian tombol di UI).
- **Anti-IDOR:** Setiap query baca/ubah/hapus entitas milik user (`orders`, `bookings`, `invoices`, `files`) **wajib** menyertakan filter kepemilikan (`WHERE id = $1 AND owner_id = $2`) atau verifikasi role eksplisit di server; tolak dengan `403 Forbidden`.
- Password wajib di-hash dengan `argon2` atau `bcrypt` (cost >= 10), dilarang plaintext/MD5/SHA256 mentah.

## 3. Validasi Input, Injection & Webhook
- Semua input luar (body, query, params, header, file upload) wajib melewati validator skema ketat (`Zod/Pydantic`) di boundary API.
- Query DB wajib parameterized/ORM safe — **dilarang** string interpolation di SQL.
- Endpoint webhook eksternal (Midtrans, Xendit, WhatsApp, GitHub) wajib memverifikasi **HMAC/signature header** sebelum memproses payload atau memutasi DB.
- Untuk endpoint auth & publik sensitif, pastikan rate limiting aktif sesuai `TSD §5`.

## 4. Privasi Data (UU PDP) & Logging
- Dilarang menaruh PII (email, nomor HP, NIK, token) di URL query string atau mencetaknya ke log plaintext / error response klien.
- Pesan error produksi ke user tidak boleh membocorkan stack trace, nama tabel SQL, atau detail internal server.
