# Skill: Frontend CWV & Responsive Breakpoints (`project/frontend-cwv-and-responsive.md`)

> Aktif untuk aplikasi web/frontend (`Next.js / React / Tailwind`). Target: `LCP <= 1.2s`, `INP <= 80ms`, `CLS = 0.00`.

## 1. Performa & Rendering (`Core Web Vitals`)
- **Server-First Boundary:** Pertahankan page dan layout sebagai Server Component; pasang `"use client"` hanya pada leaf interaktif terkecil (tombol, slider, form input).
- **Zero Layout Shift (`CLS = 0`):** Semua gambar/media wajib punya dimensi/aspect-ratio eksplisit; skeleton loading wajib memiliki tinggi yang sama persis dengan elemen hasil akhir.
- **Above-the-Fold Priority:** Aset/hero layar pertama dilarang memakai lazy-loading; gunakan font stack sistem atau preload font yang terukur (`display: swap`).
- **INP Cepat (`<= 80ms`):** Hindari blocking computation di main thread; gunakan debounce ringan (16–30ms) untuk slider/filter live.

## 2. Reflow 3 Breakpoint Wajib (`390px / 768px / 1280px`)
- **Mobile (`390px`, `< 768px`):**
  - Wajib **0 horizontal scroll** pada body halaman (`p-3 sm:p-6`).
  - Touch target kontrol minimal `44x44px` (`min-h-[38px]` untuk tombol aksi dalam baris tabel).
  - **Kanban:** wajib horizontal snap (`flex lg:grid overflow-x-auto snap-x snap-mandatory`, kolom `80-85vw`) — dilarang stack vertikal memanjang.
  - **KPI:** `grid-cols-2 lg:grid-cols-4`.
  - **Tabel Data:** bungkus dengan `overflow-x-auto` + `min-w-[560px]` (atau konversi ke stacked card padat bila mobile-first).
- **Tablet (`768px`):** sidebar kolaps ke slide-over drawer.
- **Desktop (`1280–1440px`):** sidebar persisten + max container width terkontrol.
