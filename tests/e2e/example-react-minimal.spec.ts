import { expect, test } from "@playwright/test";

test("minimal react example works with default panel setup", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Barry Michael Doyle")).toBeVisible();
  await expect(page.getByText("Cape Town, ZA")).toBeVisible();
  await expect(page.getByText("msw-panel")).toBeVisible();
  await expect(page.getByText("smoke-coverage")).toBeVisible();

  await page.getByRole("button", { name: "Open MSW Panel" }).click();
  // Summary shows enabled as a fraction of the total; the used count sits under the "Only used" toggle.
  await expect(page.getByText("2/2 enabled")).toBeVisible();
  await expect(page.getByText("2 used")).toBeVisible();
});
