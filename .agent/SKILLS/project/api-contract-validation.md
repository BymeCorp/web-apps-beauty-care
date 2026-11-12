# Skill: API Contract & Boundary Validation (`project/api-contract-validation.md`)

> Aktif untuk endpoint backend & integrasi API frontend. Sumber: `TSD §5` & `KNOWLEDGE.md §3`.

## 1. Validasi Boundary & Format Deterministik
- Setiap input endpoint (body, query, route params) wajib divalidasi dengan skema eksplisit (`Zod` / `Pydantic`) sebelum masuk domain service.
- Kembalikan HTTP status & JSON konsisten sesuai `TSD §5`:
  - Sukses: `200 OK` / `201 Created` -> `{ "success": true, "data": ... }`
  - Gagal deterministik: `400/401/403/404/409/422` -> `{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }`
- Pesan error validasi (`422`) harus mengikat ke field terkait agar UI bisa menampilkannya tepat di bawah input.

## 2. Idempotency & Normalisasi Domain (`KNOWLEDGE.md`)
- Endpoint mutasi kritis (create order/booking, payment, approve) wajib menerima & mengecek `idempotency_key` agar klik ganda atau retry jaringan tidak membuat transaksi ganda (`409` atau mengembalikan hasil awal yang sama).
- Normalisasi format lokal di API boundary: nomor HP (`08..`/`+628..` -> `628..`), uang Rupiah integer, konversi tanggal/jam ke `UTC` (render di frontend ke `Asia/Jakarta` WIB).

## 3. Kontrak Sisi Frontend (`api-integration-frontend`)
- Gunakan tipe DTO bersama (`src/types/`) atau validasi respons di client — jangan mengandalkan `any`.
- Selalu bedakan penanganan UI untuk `401` (redirect login), `403` (akses ditolak), `422` (tampilkan error di field), dan `5xx/network` (tampilkan banner recovery + tombol `Coba Lagi` tanpa menghapus isi form user).
