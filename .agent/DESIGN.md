---
version: alpha
name: "web-apps-beauty-care (Aurelia Skin Clinic [DEMO])"
description: "BYME_SDLC V1.0 Design Context — Clinical Warm Editorial (Warm Ivory + Terracotta + Sage)."
colors:
  primary: "#1C1917"
  secondary: "#57534E"
  muted: "#A8A29E"
  accent: "#B45339"
  accent-hover: "#A3452C"
  accent-focus: "#B45339"
  accent-tint: "#FDF3F0"
  sage: "#2F5241"
  sage-tint: "#ECF3EF"
  neutral: "#FAF8F5"
  surface: "#FFFFFF"
  surface-muted: "#F3EFE8"
  border: "#E7E1D8"
  border-strong: "#D6CFC4"
  success: "#15803D"
  success-tint: "#ECFDF5"
  warning: "#B45309"
  warning-tint: "#FFFBEB"
  error: "#B91C1C"
  error-tint: "#FEF2F2"
typography:
  display:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: 2.125rem
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  h1:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: 1.75rem
    fontWeight: 700
    lineHeight: 1.3
  h2:
    fontFamily: "'Playfair Display', Georgia, serif"
    fontSize: 1.375rem
    fontWeight: 700
    lineHeight: 1.35
  body-md:
    fontFamily: "'Inter', system-ui, sans-serif"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: "'Inter', system-ui, sans-serif"
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.4
  number:
    fontFamily: "'Inter', system-ui, sans-serif"
    fontSize: 0.875rem
    fontWeight: 600
    fontFeature: tnum
rounded:
  xs: 4px
  sm: 6px
  md: 8px
  lg: 12px
  xl: 16px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: 12px 20px
    minHeight: 44px
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
    textColor: "#FFFFFF"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    borderColor: "{colors.primary}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    minHeight: 44px
  input-default:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.primary}"
    borderColor: "{colors.border}"
    rounded: "{rounded.md}"
    minHeight: 44px
  card-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.primary}"
    borderColor: "{colors.border}"
    rounded: "{rounded.lg}"
    padding: 20px
---

# `.agent/DESIGN.md` — `web-apps-beauty-care`

> **BYME_SDLC V1.0 — Phase 3 (Context Repo · Design-to-Code Handoff)** · **Kode:** `DSGN-BEAUTY-v1.0`  
> **Owner:** Kay (UI/UX) & Zero (Tech Lead) · **Standar Format:** Google `DESIGN.md` + BYME Anti-Slop (`SOP-UIX-001`)

---

## Overview
- **Sumber Aset Proyek (Google Drive — biner tidak masuk Git):**
  - `DESIGN_TASK`: `02_workspace/02_projects/beauty_care_demo/DESIGN_TASK_Beauty_Care.md` (Obsidian Vault)
  - `Design_System`: `https://drive.google.com/file/d/1E1riKMFmr1duuGlbxbpg9MCKYFrkl6GT/view` (`512` node)
  - `Wireframe`: `https://drive.google.com/file/d/1AQ_-HYKWsbQjhcNmPyMUQ8CVfNuvWJR9/view` (`886` node)
  - `Final_Design`: `https://drive.google.com/file/d/1ewfEmeQK_8A5PF33iwHiHqLF6JdNpOvI/view` (`798` node / 4 halaman hi-fi: Desktop `1qQNaRhbVAG5Jj986WDg23sjMBChRjctc`, Mobile `1zKBi92VPCe0zQr3byB5KPcCr0oS875de`, Tablet `1oFR4aTxmG-_SxNO1KyW9WeddtvClXjHW`, Interactive States `1CJpzXZU2mwoK5sgmsHH5boXefjVoWWpf`)
- **Arah Visual (*Clinical Warm Editorial*):** Kanvas Warm Ivory `#FAF8F5`, permukaan kartu `#FFFFFF`, warm surface `#F3EFE8`, ink charcoal `#1C1917`, dan **tepat 1 aksen utama Terracotta `#B45339`** (hover `#A3452C`) untuk CTA & slot aktif. Sage Clinical `#2F5241` (`#ECF3EF`) dipakai khusus untuk bukti Google Sheet / guardrail medis.

## Colors
- **Netral Hangat:** teks utama `#1C1917` (`16.50:1` vs kanvas), subteks `#57534E` (`7.2:1`), muted `#A8A29E`, border hairline `#E7E1D8` / `#D6CFC4`, kanvas `#FAF8F5`, surface `#FFFFFF`, warm card `#F3EFE8`.
- **Single Accent (Terracotta):** default `#B45339` (`4.96:1` teks putih), hover `#A3452C`, tint `#FDF3F0`. **DILARANG** menambah aksen kedua (biru/ungu SaaS).
- **Sage Clinical & Semantik:** sage `#2F5241` on `#ECF3EF` (`7.75:1`), success `#15803D` / `#ECFDF5`, warning `#B45309` / `#FFFBEB`, error `#B91C1C` / `#FEF2F2`.

## Typography
- **Font Pairing:** Display/Heading `'Playfair Display', Georgia, serif` (bold untuk H1/H2 & nomor langkah `01–03`); UI & Body `'Inter', system-ui, sans-serif` (gunakan `font-display: swap` + subset ringkas atau fallback metrik ketat agar LCP `< 1.0s`).
- **Tabular Numbers Wajib:** Seluruh harga IDR (`Rp 450.000`), durasi menit, slot jam (`09:00–19:00`), dan kode booking (`BK-8K2M4Q`) **wajib** memakai class `tabular-nums`.

## Layout
- **Breakpoints (`PRD §6`, `0px` horizontal overflow):**
  - **Mobile `390px` (Prioritas #1):** Single column `px-4`, chip filter wrap 2 baris (`min-h-[44px]`), slot jam **3 kolom (`grid-cols-3`)**, bottom-sheet AI CS `82dvh`, `pb-20` agar sticky pill AI CS tidak menutupi footer.
  - **Tablet `768px`:** Sticky nav + tombol drawer hamburger `44x44px`, hero `55/45`, katalog **2 kolom (`md:grid-cols-2`)**, booking 2 kolom (ringkasan kiri + form kanan), slot jam **4 kolom (`md:grid-cols-4`)**, drawer AI CS panel floating `380px`.
  - **Desktop `1280px+`:** Max container `max-w-6xl`, hero asimetris `60/40` + kartu preview Live Google Sheet, katalog **3 kolom (`lg:grid-cols-3`)**, booking 2 kolom + FAB AI CS kanan bawah.

## Elevation & Depth
- **Default = Hairline:** Kartu treatment, form, dan ringkasan memakai `1px solid #E7E1D8` tanpa drop-shadow berat.
- **Floating Layer:** Hanya drawer/FAB AI CS (`z-40`/`z-50`) yang memakai border `#1C1917` atau shadow tipis terukur.

## Shapes
- **Radius:** input/badge kecil `6px`, button/slot jam `8px`, kartu `12px`, filter chip & pill FAB `9999px` (`rounded-full`).

## Components
- **Wajib State-Complete (`Final_Design` Hal 4):**
  - `SCR-01`: `default`, `filtered`, `empty-filter` (kontainer tinggi stabil `CLS = 0.00` + tombol *"Reset ke Semua (8)"*).
  - `SCR-02`: `default`, `prefilled`, `loading-submit` (disabled anti-double-submit), `422` validasi per-field, `502` gagal Sheet + fallback WA, `429` rate-limit, `201` Kartu Konfirmasi `BK-8K2M4Q` — **seluruh state error wajib mempertahankan input form**.
  - `SCR-03`: `closed-fab`, `open` (3 quick chips `min-h-[44px]`), `typing-skeleton` (3-bar pulse), `replied-grounded` + tombol *"Isi Form Booking"*, `medical-refusal` (banner sage `#ECF3EF`), `504/429` fallback deterministik.

## Do's and Don'ts
- **DO:** Tampilkan strip `LIVE DEMO BYME CORPORATE`, badge `[DEMO]`, identitas `dr. Nadya Aurelia, Sp.KK [DEMO]` + `Jl. Senopati No. 48, Jakarta Selatan [DEMO]`, dan target sentuh minimal `44x44px`.
- **DON'T (Zero-Slop Hard Rules):**
  - **DILARANG emoji** di mana pun (tombol, badge, header, AI chat).
  - **DILARANG gradien warna**, glassmorphism dekoratif, atau foto stok generik berat yang merusak `LCP < 1.0s`.
  - **DILARANG memotong harga/nama treatment** dengan `truncate`/`...` di layar `390px`.
