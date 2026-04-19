import { expect, test } from "@playwright/test";

test("minimal react example works with default panel setup", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Fetch mocked user" }).click();
  await expect(page.getByText("Barry · Maintainer · Cape Town")).toBeVisible();

  await page.getByRole("button", { name: "Fetch mocked projects" }).click();
  await expect(page.getByText("Minimal example (active), Smoke coverage (ready)")).toBeVisible();

  await page.getByRole("button", { name: "Open MSW Panel" }).click();
  await expect(page.getByText("2 enabled")).toBeVisible();
  await expect(page.getByText("0 disabled")).toBeVisible();
  await expect(page.getByText("2 used")).toBeVisible();
});
