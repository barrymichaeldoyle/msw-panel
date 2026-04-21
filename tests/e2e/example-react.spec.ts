import { expect, test } from "@playwright/test";

test("example react panel toggles handlers and persists disabled state", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Barry Michael Doyle")).toBeVisible();
  await expect(page.getByText("Docs refresh")).toBeVisible();
  await expect(page.getByText("CI passed")).toBeVisible();
  await expect(page.getByText("Pro", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Open MSW Panel" }).click();

  const projectsRow = page.locator(
    'li[data-handler-method="GET"][data-handler-path="https://msw-panel.test/api/projects"]',
  );
  await expect(projectsRow.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  await projectsRow.getByRole("switch").click();

  await expect(page.getByText("1 disabled")).toBeVisible();
  await expect(projectsRow.getByRole("switch")).toHaveAttribute("aria-checked", "false");

  await page.getByRole("button", { name: "Close MSW Panel" }).click();
  await page.reload();
  await expect(page.getByText("Request failed")).toBeVisible();
  await expect(
    page.getByText("Toggle GET /api/projects in the panel and refresh to restore this section."),
  ).toBeVisible();

  await page.getByRole("button", { name: "Open MSW Panel" }).click();

  await expect(page.getByText("1 disabled")).toBeVisible();
  await expect(projectsRow.getByRole("switch")).toHaveAttribute("aria-checked", "false");
});
