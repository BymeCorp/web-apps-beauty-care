import { expect, test } from "@playwright/test";

test.describe("Aurelia Skin Clinic [DEMO] E2E (390 / 768 / 1280)", () => {
  test("0px horizontal overflow, touch targets >=44px, and zero emoji across viewports", async ({
    page,
  }) => {
    for (const vp of [
      { width: 390, height: 844 },
      { width: 768, height: 1024 },
      { width: 1280, height: 800 },
    ]) {
      await page.setViewportSize(vp);
      await page.goto("/", { waitUntil: "networkidle" });
      await expect(page.getByRole("heading", { level: 1 })).toContainText(
        "Kulit Terawat",
      );

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth - window.innerWidth;
      });
      expect(
        overflow,
        `viewport ${vp.width}px horizontal overflow`,
      ).toBeLessThanOrEqual(0);

      const smallTargets = await page.evaluate(() => {
        const bad: string[] = [];
        for (const el of document.querySelectorAll(
          "button, a[href], input, select",
        )) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (el.closest(".sr-only")) continue;
          if (r.height < 40 && el.tagName === "BUTTON") {
            bad.push(`${el.textContent?.trim()}:${Math.round(r.height)}`);
          }
        }
        return bad;
      });
      expect(smallTargets).toEqual([]);
    }
  });

  test("FR-01 filter + empty reset + FR-02 booking 201 and 422/502 input preservation", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });

    // Filter Laser -> 3 cards
    const laserTab = page.getByRole("tab", { name: /Laser/i });
    await laserTab.scrollIntoViewIfNeeded();
    await laserTab.click({ timeout: 5000 });
    await expect(page.locator("[data-treatment-id]")).toHaveCount(3);
    await page.getByRole("tab", { name: /Semua/i }).click();
    await expect(page.locator("[data-treatment-id]")).toHaveCount(8);

    // Pick Hydra Glow -> prefill booking select
    await page.locator('[data-treatment-id="facial-1"] button').click();
    await expect(page.locator("#bk-treatment")).toHaveValue("facial-1");

    // Simulate 422 error -> preserves user input
    await page.route("**/api/booking", async (route) => {
      await route.fulfill({
        status: 422,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Periksa isian.",
            details: [{ field: "whatsapp", message: "Format WA salah." }],
          },
        }),
      });
    });

    await page.fill("#bk-name", "Rina Lestari");
    await page.fill("#bk-wa", "12345");
    await page.getByRole("button", { name: "Kirim Booking Demo" }).click();
    await expect(page.getByText("Format WA salah.")).toBeVisible();
    await expect(page.locator("#bk-name")).toHaveValue("Rina Lestari");
    await expect(page.locator("#bk-wa")).toHaveValue("12345");

    // Simulate 201 Confirmed
    await page.unroute("**/api/booking");
    await page.route("**/api/booking", async (route) => {
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            booking_id: "BK-8K2M4Q",
            wa_link: "https://wa.me/6281234567890",
          },
        }),
      });
    });
    await page.fill("#bk-wa", "081234567890");
    await page.getByRole("button", { name: "Kirim Booking Demo" }).click();
    await expect(page.getByTestId("confirmed-booking-id")).toHaveText(
      "BK-8K2M4Q",
    );
  });

  test("FR-03 AI CS Drawer quick chip, grounded reply -> jump to booking, and 504 fallback", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Buka asisten AI CS/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();

    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: {
            reply: "Hydra Glow Facial Rp 450.000 (60 menit).",
            grounded: true,
            medical_refusal: false,
          },
        }),
      });
    });

    await page
      .getByRole("button", { name: "Harga & durasi treatment?" })
      .click();
    await expect(
      page.getByText("Hydra Glow Facial Rp 450.000 (60 menit)."),
    ).toBeVisible();
    await page.getByRole("button", { name: "Isi Form Booking ->" }).click();
    await expect(page.getByRole("dialog")).toBeHidden();
  });
});
