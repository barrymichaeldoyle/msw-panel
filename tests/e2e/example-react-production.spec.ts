import { expect, test } from "@playwright/test";

test("production demo still shows the panel trigger when explicitly enabled", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Barry Michael Doyle")).toBeVisible();
  await expect(page.getByRole("button", { name: "Open MSW Panel" })).toBeVisible();

  await page.getByRole("button", { name: "Open MSW Panel" }).click();
  await expect(page.getByText("0 disabled")).toBeVisible();
});
