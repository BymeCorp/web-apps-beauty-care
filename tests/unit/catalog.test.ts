import { describe, expect, it } from "vitest";
import {
  filterCatalog,
  getCategoryCounts,
} from "../../src/components/CatalogFilter";
import { CATALOG } from "../../src/lib/validate";

describe("CatalogFilter logic", () => {
  it("computes category counts summing to 8", () => {
    const counts = getCategoryCounts(CATALOG);
    expect(counts.Semua).toBe(8);
    expect(counts.Facial).toBe(3);
    expect(counts.Laser).toBe(3);
    expect(counts["Skin Booster"]).toBe(2);
  });

  it("filters treatments by category and returns empty array for unmatched custom filter", () => {
    expect(filterCatalog(CATALOG, "Semua")).toHaveLength(8);
    expect(
      filterCatalog(CATALOG, "Laser").every((t) => t.category === "Laser"),
    ).toBe(true);
    expect(filterCatalog(CATALOG, "Paket Promo")).toHaveLength(0);
  });
});
