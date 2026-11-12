export const SELECT_TREATMENT_EVENT = "aurelia:select-treatment";

export interface SelectTreatmentDetail {
  treatmentId: string;
  scrollToBooking?: boolean;
}

export function dispatchSelectTreatment(
  treatmentId: string,
  scrollToBooking = true,
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<SelectTreatmentDetail>(SELECT_TREATMENT_EVENT, {
      detail: { treatmentId, scrollToBooking },
    }),
  );
  if (scrollToBooking) {
    const target = document.getElementById("booking");
    if (target) {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      target.scrollIntoView({
        behavior: reduced ? "auto" : "smooth",
        block: "start",
      });
    }
  }
}
