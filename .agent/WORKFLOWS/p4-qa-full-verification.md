# Workflow 15: Full QA Verification (`p4-qa-full-verification.md`)

**Trigger:** Seluruh task fitur utama `TASK.md` selesai (pra-UAT / sebelum Gate 4).  
**Owner:** One & Kay

## Konteks Wajib Dibaca
- `.agent/TASK.md`, `.agent/RULES.md §2 & §4`, `.agent/DESIGN.md`
- Dokumen `PRD` (Given-When-Then `§5`), `TSD §8`, dan `DESIGN_TASK §4 & §6`

## Langkah Berurutan & Skills Dipanggil
1. **Verifikasi Suite Penuh (`core/tdd-and-verification.md`):** jalankan full unit, integration, typecheck, lint, dan production build -> seluruhnya wajib **exit 0**.
2. **Smoke, Keamanan & Headers (`project/qa-smoke-and-staging.md` + `core/security-and-auth-guard.md`):** uji `/health`, endpoint positif/negatif (`200/401/403/422`), 0 secret di diff/env, dan verifikasi akses RBAC lintas role.
3. **Audit UI, CWV & Responsivitas (`core/anti-slop-ui.md` + `project/frontend-cwv-and-responsive.md`):** cek setiap `SCR-xx` di viewport `390px`, `768px`, dan `1280px` (0 horizontal scroll, 0 console error, 0 emoji, 0 truncated nominal).
4. **Catat Temuan:** jika semua lolos -> siap staging/UAT (`p5-staging-and-prod-deploy.md`); jika ada cacat -> buat item perbaikan atau jalankan `p4-bugfix-hotfix.md`.
