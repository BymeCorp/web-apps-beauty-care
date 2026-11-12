# Workflow 18: Staging & Production Deploy (`p5-staging-and-prod-deploy.md`)

**Trigger:** Gate 4 QA lolos (deploy staging demo) atau pelunasan Termin 2 50% terkonfirmasi (deploy produksi klien — `SOP-OPS-003` & Gate 5).  
**Owner:** One

## Konteks Wajib Dibaca
- `.agent/RULES.md §4` & `.agent/ARCHITECTURE.md §5` (daftar env var wajib)
- `TSD §8` (rollout & rollback plan)

## Langkah Berurutan & Skills Dipanggil
1. **Security & HITL Check (`core/security-and-auth-guard.md`):** pastikan seluruh `.env` target terisi aman di server, port internal hanya bind ke `127.0.0.1`, dan untuk deploy **produksi** wajib ada izin HITL Pak Yasfiq + konfirmasi pelunasan 50% (jika proyek klien).
2. **Build, Migrasi & Reverse Proxy (`project/qa-smoke-and-staging.md`):**
   - Catat tag git rilis sebelumnya untuk rollback cepat.
   - Jalankan migrasi SQL forward-only (`project/db-migration-safety.md` bila ada DB), build produksi, dan pasang Caddy HTTPS + security headers (`basic_auth` wajib untuk staging demo).
3. **Post-Deploy Smoke & Hygiene (`project/qa-smoke-and-staging.md`):** verifikasi `/health` `200 OK`, cek 1 alur login/read/write kritis, pastikan RAM VPS tetap sehat (`>= 800 MB` available), dan amati log bebas error rate `> 2%` sebelum lapor **LIVE**.
