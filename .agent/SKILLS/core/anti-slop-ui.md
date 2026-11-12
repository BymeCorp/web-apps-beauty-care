# Skill: Anti-Slop UI & Design Token Compliance (`core/anti-slop-ui.md`)

> Merujuk `.agent/DESIGN.md`, `DESIGN_TASK §3–§4`, dan `2A3_Master_Design_System`.

## 1. Kepatuhan Token (Zero Hardcoded Styles)
- Seluruh warna, tipografi, radius, dan spacing wajib mengambil token dari `.agent/DESIGN.md` / konfigurasi Tailwind tema proyek.
- **Dilarang** menulis hex liar (`#...`) atau spacing arbitrer di luar skala `4px` tanpa alasan tercatat.
- Gunakan tepat **1 warna accent** primer + maksimal **1 primary CTA** per viewport; warna semantik (`success/warning/error/info`) hanya dipakai saat status data memang menuntut.

## 2. Zero Emoji & High-Density Layout
- **Dilarang emoji** di seluruh elemen antarmuka: tab, tombol, badge, judul tabel, alert, maupun navigasi. Gunakan ikon SVG stroke monokrom (`w-4 h-4`) atau teks kontras.
- Utamakan tabel data padat (baris `44–48px`), divider hairline (`1px`), dan daftar metrik bersih daripada card besar dekoratif, glassmorphism, atau label marketing kosong (*"AI-Powered", "Next-Gen"*).

## 3. Tipografi Data & Anti-Truncation
- Seluruh nominal Rupiah, persentase, angka KPI, ID (`TCK-1042`), dan tanggal wajib memakai **`tabular-nums`**.
- Dilarang memotong nilai krusial (harga, status, ID) dengan ellipsis `...`; gunakan format ringkas (`Rp 1,45 M`) + angka presisi penuh di tooltip/detail.

## 4. Wajib State-Complete (No Happy-Path-Only)
Setiap layar/komponen data wajib mengimplementasikan seluruh state di `DESIGN_TASK §4`:
1. **Default / Populated**
2. **Hover / Focus Ring / Disabled**
3. **Loading:** **skeleton** yang menyamai ukuran/kolom layout final (bukan spinner mentah).
4. **Empty:** pesan jelas + aksi CTA primer langsung (atau tombol `Reset Filter` bila hasil filter 0).
5. **Error / Recovery:** pesan menyebut apa yang gagal + cara mengatasi + tombol ulang, sambil **menjaga isi input form user tetap tersimpan**.
6. **Permission:** fallback rapi bila role tidak berhak akses.
