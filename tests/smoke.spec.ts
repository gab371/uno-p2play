import { test, expect } from "@playwright/test";

test("smoke: home lobby renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "P2UNO" })).toBeVisible();
  await expect(page.getByText("Créer une Table")).toBeVisible();
});
