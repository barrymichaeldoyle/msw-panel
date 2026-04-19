import { expect, test } from "@playwright/test";

test("example react panel toggles handlers and persists disabled state", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Fetch mocked user" }).click();
  await expect(page.getByText("Barry · Maintainer · Cape Town")).toBeVisible();

  await page.getByRole("button", { name: "Open MSW Panel" }).click();

  const projectsRow = page.locator(
    'li[data-handler-method="GET"][data-handler-path="https://msw-panel.test/api/projects"]',
  );
  await projectsRow.getByRole("switch").click();

  await expect(page.getByText("29 enabled")).toBeVisible();
  await expect(page.getByText("1 disabled")).toBeVisible();

  await page.getByRole("button", { name: "Close MSW Panel" }).click();
  await page.getByRole("button", { name: "Fetch mocked projects" }).click();
  await expect(page.getByText(/Request escaped MSW: Failed to fetch/)).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Open MSW Panel" }).click();

  await expect(page.getByText("29 enabled")).toBeVisible();
  await expect(page.getByText("1 disabled")).toBeVisible();
  await expect(projectsRow.getByRole("switch")).toHaveAttribute("aria-checked", "false");
});
