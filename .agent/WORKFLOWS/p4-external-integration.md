# Workflow 12: External & AI Integration (`p4-external-integration.md`)

**Trigger:** Task integrasi pihak ketiga (Midtrans/Xendit, WhatsApp API, SMTP, atau LLM/AI call sesuai `TSD §6.1`).  
**Owner:** Zero & Tri

## Konteks Wajib Dibaca
- `.agent/TASK.md` (1 task aktif)
- `.agent/ARCHITECTURE.md` (§4–§5 wrapper `src/lib/clients/` & daftar nama env var)
- `.agent/KNOWLEDGE.md` (§5 *Known Gotchas* integrasi)

## Langkah Berurutan & Skills Dipanggil
1. **Adapter Tunggal & Ketahanan (`project/external-integration-resilience.md`):** bungkus seluruh panggilan HTTP dalam 1 adapter (`src/lib/clients/`), set hard timeout `<= 15s`, retry transient maksimal `2x`, plus JSON repair & fallback deterministik bila memakai LLM.
2. **Secrets & Webhook Guard (`core/security-and-auth-guard.md`):** baca key hanya dari `.env`, verifikasi HMAC/signature webhook, dan pastikan pemrosesan webhook idempoten terhadap callback ganda.
3. **Uji Simulasi Kegagalan (`core/tdd-and-verification.md`):** tulis test untuk respons sukses, timeout/error `503` (memastikan fallback aman), dan signature invalid (`401/403`) -> jalankan hingga **exit 0**.
4. **Containment & Log Gotcha (`core/diff-containment.md`):** cek 0 secret key/payload nyata di repo, `git diff --stat` sesuai boundary -> catat gotcha baru (jika ada) di `KNOWLEDGE.md §5` -> `IN_REVIEW`.
