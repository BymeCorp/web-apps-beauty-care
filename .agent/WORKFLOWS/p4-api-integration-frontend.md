# Workflow 14: API Integration - Frontend (`p4-api-integration-frontend.md`)

**Trigger:** Task menghubungkan UI (`SCR-xx`) ke endpoint API nyata, mutasi form, filter/pagination, dan error recovery.  
**Owner:** Zero

## Konteks Wajib Dibaca
- `.agent/TASK.md` (1 task aktif + `AC`)
- `.agent/ARCHITECTURE.md` (§6 lokasi data fetching hooks & error formatter)
- `.agent/DESIGN.md` (state `loading/empty/error`)

## Langkah Berurutan & Skills Dipanggil
1. **Sinkron Kontrak DTO (`project/api-contract-validation.md`):** pakai tipe DTO bersama (dilarang `any`), kirim `idempotency_key` pada aksi submit/pembayaran, dan tangani khusus `401`, `403`, `422` (ikat ke field), serta `5xx`/offline.
2. **Jaga UX & Input State (`core/anti-slop-ui.md`):** pastikan submit button masuk state loading/disabled saat request berjalan (cegah klik ganda), skeleton menjaga `CLS = 0`, dan error jaringan **tidak menghapus input form user**.
3. **Test Integrasi Client (`core/tdd-and-verification.md`):** tulis test untuk submit sukses, error validasi per field (`422`), dan recovery retry saat API gagal -> jalankan `lint`, `typecheck`, `test`, `build` hingga **exit 0**.
4. **Containment (`core/diff-containment.md`):** cek tidak ada API key rahasia masuk client bundle dan mutasi file tetap di `Change Boundary` -> status `IN_REVIEW`.
