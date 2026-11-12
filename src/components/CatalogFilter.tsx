import { useEffect, useState } from "preact/hooks";
import {
  SELECT_TREATMENT_EVENT,
  type SelectTreatmentDetail,
  dispatchSelectTreatment,
} from "../lib/events";
import { type TreatmentItem, formatIdr } from "../lib/validate";

export type CategoryFilter =
  | "Semua"
  | "Facial"
  | "Laser"
  | "Skin Booster"
  | string;

export function getCategoryCounts(
  items: readonly TreatmentItem[],
): Record<string, number> {
  const counts: Record<string, number> = {
    Semua: items.length,
    Facial: 0,
    Laser: 0,
    "Skin Booster": 0,
  };
  for (const item of items) {
    counts[item.category] = (counts[item.category] ?? 0) + 1;
  }
  return counts;
}

export function filterCatalog(
  items: readonly TreatmentItem[],
  category: CategoryFilter,
): TreatmentItem[] {
  if (category === "Semua") return [...items];
  return items.filter((item) => item.category === category);
}

interface Props {
  items: TreatmentItem[];
}

const CATEGORIES: readonly CategoryFilter[] = [
  "Semua",
  "Facial",
  "Laser",
  "Skin Booster",
];

export default function CatalogFilter({ items }: Props) {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("Semua");
  const [selectedId, setSelectedId] = useState<string>("laser-1");
  const counts = getCategoryCounts(items);
  const filtered = filterCatalog(items, activeCategory);

  useEffect(() => {
    const onSelect = (e: Event) => {
      const detail = (e as CustomEvent<SelectTreatmentDetail>).detail;
      if (detail?.treatmentId) {
        setSelectedId(detail.treatmentId);
      }
    };
    window.addEventListener(SELECT_TREATMENT_EVENT, onSelect);
    return () => window.removeEventListener(SELECT_TREATMENT_EVENT, onSelect);
  }, []);

  const handleChoose = (id: string) => {
    setSelectedId(id);
    dispatchSelectTreatment(id, true);
  };

  return (
    <div>
      <div
        class="flex flex-wrap gap-2.5"
        role="tablist"
        aria-label="Filter kategori treatment"
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          const count = counts[cat] ?? 0;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(cat)}
              class={`min-h-[44px] cursor-pointer rounded-full px-4 py-2 text-xs font-semibold tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                isActive
                  ? "bg-ink text-canvas"
                  : "border border-subtle bg-surface text-ink hover:border-ink"
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      <div class="mt-6 min-h-[340px]">
        {filtered.length === 0 ? (
          <div class="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface p-6 text-center">
            <h3 class="font-display text-lg font-bold text-ink">
              Tidak ada layanan di filter ini
            </h3>
            <p class="mt-2 text-xs text-muted">
              Kategori pilihan belum memiliki treatment aktif pada katalog demo.
            </p>
            <button
              type="button"
              onClick={() => setActiveCategory("Semua")}
              class="mt-4 min-h-[44px] cursor-pointer rounded-lg bg-terracotta px-5 text-xs font-semibold text-white hover:bg-terracotta-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta"
            >
              Reset ke Semua ({items.length})
            </button>
          </div>
        ) : (
          <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <article
                  key={item.id}
                  data-treatment-id={item.id}
                  class={`flex flex-col justify-between rounded-xl bg-surface p-5 transition-colors ${
                    isSelected
                      ? "border-2 border-terracotta"
                      : "border border-border hover:border-subtle"
                  }`}
                >
                  <div>
                    <div class="flex items-center justify-between gap-2">
                      <span class="rounded bg-warm px-2 py-1 text-[10px] font-semibold tracking-wider text-ink uppercase">
                        {item.category}
                      </span>
                      {isSelected ? (
                        <span class="rounded-full bg-terracotta px-2.5 py-0.5 text-[10px] font-bold text-white">
                          DIPILIH
                        </span>
                      ) : (
                        <span class="text-xs font-medium text-muted tabular-nums">
                          {item.duration_minutes} mnt · 1x sesi
                        </span>
                      )}
                    </div>

                    <h3 class="mt-3 font-display text-base font-bold text-ink leading-snug">
                      {item.name}
                    </h3>
                    <p class="mt-1.5 text-xs text-muted leading-relaxed">
                      {item.description}
                    </p>
                    <p class="mt-2 text-[11px] text-muted">
                      <span class="font-semibold text-ink">Persiapan:</span>{" "}
                      {item.prep_note}
                    </p>
                  </div>

                  <div class="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3.5">
                    <div>
                      <span class="block text-[10px] text-muted tabular-nums">
                        {item.duration_minutes} menit
                      </span>
                      <span class="text-sm font-bold text-ink tabular-nums">
                        {formatIdr(item.price_idr)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleChoose(item.id)}
                      class={`min-h-[44px] cursor-pointer rounded-lg px-4 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-terracotta ${
                        isSelected
                          ? "bg-terracotta text-white hover:bg-terracotta-hover"
                          : "border border-terracotta bg-terracotta-tint text-terracotta hover:bg-terracotta hover:text-white"
                      }`}
                    >
                      {isSelected ? "Terpilih" : "Pilih & Booking"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
