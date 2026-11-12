# Default `.agent/WORKFLOWS/` — Peta End-to-End BYME_SDLC V1.0

Folder ini berisi **resep kerja berurutan untuk fase eksekusi di dalam repo** (`Phase 4–5`, Workflow `#9–#18`). Setiap workflow memanggil file konteks (`.agent/*.md`) dan kombinasi skill on-demand di `.agent/SKILLS/`.

> **Split 2 Lapis (Keputusan Arsitektur):** Workflow pra-coding & dokumen klien (`#1–#8, #19`) dijalankan melalui Global Hermes Skills (`sdlc-phase0..5`), sehingga repo kode tetap ringkas, portabel, dan bebas *dead tools*.

## 1. Peta Lengkap Phase 0–5 (Referensi Lintas Tim)
| Phase | Workflow ID | Dijalankan Di | Owner | Referensi / Skills Utama |
|---|---|---|---|---|
| **0** | `p0-discovery-research-plan` | Global Hermes | Sarah, Ivan | `sdlc-phase0-prerequisite`, `grounded-citations`, `docx` |
| **0** | `p0-interview-and-observation` | Global Hermes | Sarah, Ivan, Kay | `sdlc-phase0-prerequisite`, `meeting-action-items`, `docx` |
| **1** | `p1-enterprise-deal-docs` | Global Hermes | Ivan, Sarah, One | `sdlc-phase1-deal-validation` (BRD, SOW, Plan, MSA, NDA, SLA) |
| **1** | `p1-umkm-deal-docs` | Global Hermes | Ivan, Sarah | `sdlc-phase1-deal-validation` (Proposal, Kontrak, Plan) |
| **1** | `p1-saas-validation` | Global Hermes | Sarah, Alveria | `sdlc-phase1-deal-validation` (`VALIDATION.md`) |
| **2** | `p2-prd-and-tsd-spec` | Global Hermes | Sarah, Zero | `sdlc-phase2-spec-design` (`PRD` + `TSD`) |
| **2** | `p2-design-and-figcraft` | Global Hermes | Kay | `sdlc-phase2-spec-design` (`DESIGN_TASK`, `Design_System`, `Wireframe`, `Final_Design`) |
| **3** | `p3-context-repo-bootstrap` | Global Hermes | Zero, Sarah, Kay | `sdlc-phase3-context-repo` (`.agent/*`) + `github` |
| **4** | `p4-project-scaffolding` | **Repo (`.agent/WORKFLOWS/`)** | Zero | Lihat file di folder ini (`#9`) |
| **4** | `p4-database-schema-backend` | **Repo (`.agent/WORKFLOWS/`)** | Zero | Lihat file di folder ini (`#10`) |
| **4** | `p4-backend-api-endpoint` | **Repo (`.agent/WORKFLOWS/`)** | Zero | Lihat file di folder ini (`#11`) |
| **4** | `p4-external-integration` | **Repo (`.agent/WORKFLOWS/`)** | Zero, Tri | Lihat file di folder ini (`#12`) |
| **4** | `p4-slicing-ui-frontend` | **Repo (`.agent/WORKFLOWS/`)** | Kay, Zero | Lihat file di folder ini (`#13`) |
| **4** | `p4-api-integration-frontend` | **Repo (`.agent/WORKFLOWS/`)** | Zero | Lihat file di folder ini (`#14`) |
| **4** | `p4-qa-full-verification` | **Repo (`.agent/WORKFLOWS/`)** | One, Kay | Lihat file di folder ini (`#15`) |
| **4** | `p4-bugfix-hotfix` | **Repo (`.agent/WORKFLOWS/`)** | Zero, One | Lihat file di folder ini (`#16`) |
| **4** | `p4-pre-merge-review` | **Repo (`.agent/WORKFLOWS/`)** | Zero, Alveria | Lihat file di folder ini (`#17`) |
| **5** | `p5-staging-and-prod-deploy` | **Repo (`.agent/WORKFLOWS/`)** | One | Lihat file di folder ini (`#18`) |
| **5** | `p5-demo-and-handover-docs` | Global Hermes | Kay, Sarah, One | `sdlc-phase5-demo-handover` (`pptx`, `docx`, `google-workspace`) |

## 2. Cara Memakai di Repo Proyek
1. Ambil 1 `TASK-xxx` aktif dari `.agent/TASK.md`.
2. Pilih 1 file workflow `p4-*.md` atau `p5-*.md` yang sesuai jenis task-nya.
3. Ikuti langkah berurutan dan muat skill `.agent/SKILLS/` yang disebut di workflow tersebut — jangan melompati verification gate.
