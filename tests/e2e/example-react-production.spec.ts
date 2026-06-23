import { expect, test } from "@playwright/test";

test("production demo still shows the panel trigger when explicitly enabled", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Barry Michael Doyle")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open MSW Panel" })).toBeVisible();

  await page.getByRole("button", { name: "Open MSW Panel" }).click();
  // Panel opened and rendered its summary (enabled count shown as a fraction of the total).
  await expect(page.locator('[data-msw-panel-count="enabled"]')).toBeVisible();
});
