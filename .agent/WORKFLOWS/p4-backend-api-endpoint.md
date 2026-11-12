# Workflow 11: Backend API & Domain Service (`p4-backend-api-endpoint.md`)

**Trigger:** Task implementasi logika bisnis, domain service, dan endpoint API (`PRD FR-xx` / `TSD §5`).  
**Owner:** Zero

## Konteks Wajib Dibaca
- `.agent/TASK.md` (1 task aktif + `AC` Happy Path & Error Path)
- `.agent/ARCHITECTURE.md` (§3–§4 batas layer: route tipis -> domain service -> DB)
- `.agent/KNOWLEDGE.md` (§2 istilah baku & §3 invariants)

## Langkah Berurutan & Skills Dipanggil
1. **Cek Reuse & Layer (`core/developer-ladder.md`):** cek helper eksisting; pisahkan logika bisnis murni di `src/modules/<domain>/service.*` agar bebas object HTTP.
2. **Kontrak & Validasi (`project/api-contract-validation.md`):** pasang skema DTO (`Zod`/`Pydantic`), `idempotency_key` untuk mutasi kritis, normalisasi IDR/HP/UTC, dan respons JSON deterministik (`200/201` vs `400/403/409/422`).
3. **Auth & Anti-IDOR (`core/security-and-auth-guard.md`):** verifikasi sesi/token & role di server, filter kepemilikan data di query DB (tolak `403`), parameterized query wajib.
4. **TDD Red-Green-Refactor (`core/tdd-and-verification.md`):** tulis unit + integration test (Happy Path + Error Path + 403/422) gagal dulu -> implementasi minimal -> jalankan full suite, typecheck, lint hingga **exit 0**.
5. **Containment (`core/diff-containment.md`):** verifikasi `git diff --stat` hanya menyentuh file di `Change Boundary` -> status `IN_REVIEW`.
