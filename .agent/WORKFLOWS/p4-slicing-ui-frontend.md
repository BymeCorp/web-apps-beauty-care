# Workflow 13: Slicing UI/UX - Frontend (`p4-slicing-ui-frontend.md`)

**Trigger:** Task pembuatan halaman/komponen antarmuka (`PRD §7 SCR-xx` + `DESIGN_TASK §4`).  
**Owner:** Kay & Zero

## Konteks Wajib Dibaca
- `.agent/TASK.md` (1 task aktif + `Change Boundary`)
- `.agent/DESIGN.md` (YAML token + 8 seksi kanonik + aturan anti-slop)
- `DESIGN_TASK` & `Wireframe` / `Final_Design` proyek untuk layar `SCR-xx` terkait

## Langkah Berurutan & Skills Dipanggil
1. **Visual, Token & All States (`core/anti-slop-ui.md`):** gunakan hanya token `.agent/DESIGN.md` (0 hex mentah, 0 emoji, 1 accent, `tabular-nums`), dan buat seluruh state (`default`, `skeleton` match layout, `empty` + CTA, `error` + retry, `disabled`).
2. **CWV & 3 Breakpoint (`project/frontend-cwv-and-responsive.md`):** pisah Server vs Client Component (`"use client"` hanya di leaf), cegah layout shift (`CLS = 0`), dan atur reflow `390px / 768px / 1280px` (kanban `snap-x`, tabel `overflow-x-auto`, touch `>= 44px`).
3. **Kode Minimal & Test (`core/developer-ladder.md` + `core/tdd-and-verification.md`):** reuse komponen UI bersama, tulis component/smoke test gagal dulu -> slicing minimal -> jalankan `lint`, `typecheck`, `test`, `build` hingga **exit 0**.
4. **Containment (`core/diff-containment.md`):** verifikasi `git diff --stat` sesuai `Change Boundary`, 0 asset dummy/lorem ipsum -> status `IN_REVIEW`.
