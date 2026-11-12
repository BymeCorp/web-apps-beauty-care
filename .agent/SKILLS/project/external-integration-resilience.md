# Skill: External & AI Integration Resilience (`project/external-integration-resilience.md`)

> Aktif jika sistem memanggil Payment Gateway, WhatsApp API, SMTP/Email, atau LLM/AI. Sumber: `TSD §6.1`.

## 1. Adapter Tunggal & Timeout Ketat
- Semua panggilan HTTP ke pihak ketiga wajib lewat satu modul adapter di `src/lib/clients/` (`ARCHITECTURE.md §4`), dilarang `fetch()` langsung di route atau UI.
- Set **hard timeout `<= 15 detik`** (atau sesuai SLA endpoint, mis. 5–10 detik untuk gateway sinkron) pada setiap request keluar.

## 2. Retry Aman & Webhook Idempoten
- Hanya retry error transient (`429`, `502`, `503`, `504`, network timeout) maksimal **2x** dengan exponential backoff — jangan pernah retry error `400/401/403/422`.
- Handler webhook/callback wajib: (a) verifikasi signature header, (b) cek apakah event ID sudah pernah diproses (*idempotent*), dan (c) proses secara atomik di DB.

## 3. Guardrail Khusus LLM / AI Call (Jika Dipakai)
- **Self-Healing JSON Parse:** Bersihkan markdown code fences (````json ... ````) sebelum `JSON.parse`, lalu validasi output terhadap skema (`Zod/Pydantic`).
- **Fallback Deterministik:** Jika LLM gagal/timeout/output invalid setelah retry, sistem **tidak boleh crash** — wajib jatuh ke rule/kalkulasi deterministik atau antrean aman dengan status jelas ke user.
- **Dilarang Menaruh Logika Finansial/Harga ke LLM:** Seluruh kalkulasi Rupiah, pajak, dan validasi status wajib kode deterministik.
