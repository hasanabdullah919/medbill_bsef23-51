import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

async function login(page: Page, role: "Biller" | "Admin" = "Biller") {
  await page.goto("/login");
  await page.getByRole("button", { name: role }).click();
  await page.getByRole("button", { name: "Open D1 workspace" }).click();
  await expect(page.getByRole("heading", { name: "Create a claim from a form or a PDF." })).toBeVisible();
}

test("sign-in opens the scoped D1 workspace", async ({ page }) => {
  await login(page);
  await expect(page.getByText("D1 WORKING PROTOTYPE").first()).toBeVisible();
  await expect(page.getByText(/No payer submission, payment posting or insurer approval/)).toBeVisible();
  await expect(page.getByRole("button", { name: "Upload PDF claim" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enter manually" })).toBeVisible();
});

test("manual entry creates a saved validated claim and CMS preview", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Enter manually" }).click();
  await page.getByRole("button", { name: "Use demo data" }).click();
  await page.getByRole("button", { name: "Continue to claim" }).click();
  await page.getByRole("button", { name: "Review claim" }).click();
  await page.getByRole("button", { name: "Validate and save draft" }).click();
  await expect(page.getByText("BASIC VALIDATION PASSED")).toBeVisible();
  await expect(page.getByText(/is stored in PostgreSQL as a validated draft/)).toBeVisible();
  await page.getByRole("button", { name: "Generate CMS-1500 preview" }).click();
  await expect(page.getByRole("heading", { name: "CMS-1500-style preview" })).toBeVisible();
  await expect(page.getByLabel("CMS-1500-style claim preview")).toContainText("BC-2048917");
  await expect(page.getByLabel("CMS-1500-style claim preview")).toContainText("99213");
});

test("PDF extraction populates an editable claim and completes the same flow", async ({ page }) => {
  await login(page);
  await page.getByRole("button", { name: "Upload PDF claim" }).click();
  await page.getByLabel("Choose a claim PDF").setInputFiles(path.resolve("tests/fixtures/claim-sample.pdf"));
  await page.getByRole("button", { name: "Extract claim information" }).click();
  await expect(page.getByRole("heading", { name: "Review the complete claim" })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText("claim-sample.pdf")).toBeVisible();
  await expect(page.getByLabel("First name")).toHaveValue("Amina");
  await expect(page.getByLabel("Member ID")).toHaveValue("BCX-771204");
  await page.getByLabel("Date of birth").fill("1994-04-21");
  await page.getByRole("button", { name: "Validate and save draft" }).click();
  await expect(page.getByText("BASIC VALIDATION PASSED")).toBeVisible();
  await page.getByRole("button", { name: "Generate CMS-1500 preview" }).click();
  await expect(page.getByLabel("CMS-1500-style claim preview")).toContainText("Shah, Amina");
  await expect(page.getByText("Uploaded PDF", { exact: true })).toBeVisible();
});

test("invalid credentials are refused", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Open D1 workspace" }).click();
  await expect(page.locator(".d1-alert[role='alert']")).toContainText("Use the demo account");
});

test("Admin can open the preserved technical evidence workspace", async ({ page }) => {
  await login(page, "Admin");
  await page.getByRole("link", { name: "Technical evidence" }).click();
  await expect(page.getByRole("heading", { name: "Process PDFs" })).toBeVisible();
});
