import { expect, test } from "@playwright/test";

test("biller completes the D1 claim validation flow", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Sign in to MedBill" })).toBeVisible();
  await page.screenshot({ path: "../docs/evidence/01-login.png", fullPage: true });
  await page.getByRole("button", { name: "Sign in" }).click();

  await expect(page.getByRole("heading", { name: "Revenue cycle overview" })).toBeVisible();
  await page.screenshot({ path: "../docs/evidence/02-dashboard.png", fullPage: true });
  await page.getByRole("button", { name: "Create claim" }).first().click();
  await page.getByLabel("Patient").selectOption({ index: 1 });
  await page.getByLabel("ICD-10 diagnosis").fill("J06.9");
  await page.getByLabel("Procedure code").fill("99213");
  await page.getByLabel("Charge amount").fill("145.00");
  await page.getByRole("button", { name: "Validate and save" }).click();

  await expect(page.getByText("Claim passed all D1 validation rules.")).toBeVisible();
  await expect(page.getByText("ready", { exact: true }).first()).toBeVisible();
  await page.screenshot({ path: "../docs/evidence/03-claim-validation.png", fullPage: true });
});

test("backend validation produces actionable correction messages", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.getByRole("button", { name: "Create claim" }).first().click();
  await page.getByLabel("Patient").selectOption({ index: 1 });
  await page.getByLabel("ICD-10 diagnosis").fill("bad");
  await page.getByLabel("Procedure code").fill("12");
  await page.getByLabel("Charge amount").fill("0");
  await page.getByRole("button", { name: "Validate and save" }).click();

  await expect(page.getByText("Claim saved for correction.", { exact: false })).toBeVisible();
  await expect(page.getByText("Diagnosis code must use a recognizable ICD-10 format", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Procedure code must contain exactly five", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Claim amount must be greater than zero.").first()).toBeVisible();
});
