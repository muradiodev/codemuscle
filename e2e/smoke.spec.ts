import { expect, test } from "@playwright/test";

test("onboarding opens Java HR practice workspace", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: /Preserve/ })).toBeVisible();
  await page.getByLabel("Language").selectOption("java");
  await expect(page.locator('option[value="python"]')).toBeEnabled();
  await page.getByRole("button", { name: "Start manual practice" }).click();
  await expect(page).toHaveURL(/practice\/employee-hr-system\//);
  await expect(page.getByText("HrApplication.java").first()).toBeVisible();
  await expect(page.getByText("Reference").first()).toBeVisible();
  const typing = page.locator(".editor-host").first();
  await typing.click();
  await page.keyboard.type("package com.codemuscle.hr;");
  await expect(page.getByText(/Token accuracy|Progress|Typing editor|Current mismatch/i).first()).toBeVisible();
});

test("project catalog lists Java and Python projects", async ({ page }) => {
  await page.goto("/projects");
  await expect(page.getByText("Employee HR Management System", { exact: true })).toBeVisible();
  await expect(page.getByText("Logistics and Shipment Management System", { exact: true })).toBeVisible();
  await expect(page.getByText("Energy Consumption and Billing System", { exact: true })).toBeVisible();
  await expect(page.getByText("Multi-Tenant B2B SaaS Platform", { exact: true })).toBeVisible();
  await expect(page.getByText("Employee HR Management System (Python)", { exact: true })).toBeVisible();
  await expect(page.getByText("Multi-Tenant B2B SaaS Platform (Python)", { exact: true })).toBeVisible();
});
