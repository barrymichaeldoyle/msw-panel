import { expect, test } from "@playwright/test";

test("example react panel toggles handlers and persists disabled state", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Barry Michael Doyle")).toBeVisible();
  await expect(page.getByText("Docs refresh")).toBeVisible();
  await expect(page.getByText("CI passed")).toBeVisible();
  await expect(page.getByText("Pro", { exact: true })).toBeVisible();

  const projectsRow = page.locator(
    'li[data-handler-method="GET"][data-handler-path="https://msw-panel.test/api/projects"]',
  );

  // The example groups handlers by feature tag by default, so filter then expand the group. The
  // panel persists the filter and expanded-group state across reloads, so only expand when the group
  // is still collapsed — otherwise a click would toggle it back shut.
  const revealProjects = async () => {
    await page.getByRole("button", { name: "Open MSW Panel" }).click();
    await page.getByLabel("Filter handlers").fill("api/projects");
    const group = page.locator('[data-msw-panel-group="tag:projects"]');
    if ((await group.getAttribute("aria-expanded")) !== "true") {
      await group.click();
    }
  };

  await revealProjects();
  await expect(projectsRow.getByRole("switch")).toHaveAttribute("aria-checked", "true");
  await projectsRow.getByRole("switch").click();

  // The summary reports enabled handlers as a fraction of the total (one of 30 now disabled).
  await expect(page.getByText("29/30 enabled")).toBeVisible();
  await expect(projectsRow.getByRole("switch")).toHaveAttribute("aria-checked", "false");

  await page.getByRole("button", { name: "Close MSW Panel" }).click();
  await page.reload();
  await expect(page.getByText("Request failed")).toBeVisible();
  await expect(
    page.getByText("Toggle GET /api/projects in the panel and refresh to restore this section."),
  ).toBeVisible();

  await revealProjects();

  await expect(page.getByText("29/30 enabled")).toBeVisible();
  await expect(projectsRow.getByRole("switch")).toHaveAttribute("aria-checked", "false");
});
