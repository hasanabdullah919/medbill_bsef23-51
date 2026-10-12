import { expect, test } from "@playwright/test";
import path from "node:path";

test("uploads to input, scans, classifies, and moves a PDF", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Process PDFs" })).toBeVisible();
  await expect(page.getByText("input/", { exact: true }).first()).toBeVisible();

  const fixture = path.resolve("tests", "fixtures", "sample.pdf");
  await page.getByLabel("Add PDF to input folder").setInputFiles(fixture);
  await expect(page.getByRole("status")).toContainText("added to input");
  await expect(page.getByRole("heading", { name: "sample.pdf" })).toBeVisible();

  await page.getByLabel("Input folder files").getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "Run complete flow" }).click();
  await expect(page.getByRole("status")).toContainText("Selected batch finished: 1 routed", { timeout: 60_000 });
  await expect(page.getByText(/output\/(accepted|needs-review|rejected)\//).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Open PDF" })).toHaveAttribute("href", /\/api\/documents\/.+\/file/);
  await expect(page.getByRole("button", { name: "Download report" })).toBeEnabled();
});

test("rejects a non-PDF before it reaches input", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Add PDF to input folder").setInputFiles({
    name: "fake.pdf", mimeType: "application/pdf", buffer: Buffer.from("this is not a pdf"),
  });
  await expect(page.locator(".notice[role='alert']")).toContainText("Only valid PDF files");
});

test("selects a previously uploaded input file for routing", async ({ page }) => {
  await page.goto("/");
  const fixture = path.resolve("tests", "fixtures", "sample.pdf");
  await page.getByLabel("Add PDF to input folder").setInputFiles(fixture);
  await expect(page.getByRole("status")).toContainText("added to input");
  await page.reload();
  const firstQueued = page.getByLabel("Input folder files").getByRole("button").first();
  await expect(firstQueued).toBeVisible();
  await firstQueued.click();
  await expect(page.getByText("To process this PDF alone")).toBeVisible();
  await expect(page.getByText(/input\/|documents\//).first()).toBeVisible();
});

test("creates a backup and protects workspace reset behind typed confirmation", async ({ page, request }) => {
  await page.goto("/");
  await page.getByText("Workspace tools", { exact: true }).click();
  await page.getByRole("button", { name: "Create backup" }).click();
  await expect(page.getByRole("status")).toContainText("Backup created at backups/", { timeout: 60_000 });

  await page.getByRole("button", { name: "Reset workspace" }).click();
  const resetButton = page.getByRole("button", { name: "Back up and reset run" });
  await expect(resetButton).toBeDisabled();
  await page.getByLabel("Type RESET to confirm").fill("RESE");
  await expect(resetButton).toBeDisabled();
  await page.getByRole("button", { name: "Cancel" }).click();

  const refused = await request.post("/api/reset", { data: { confirmation: "not-reset" } });
  expect(refused.status()).toBe(400);
});

test("Inspect opens a routed file, reveals its report, and exposes working file actions", async ({ page, request }) => {
  await page.goto("/");
  await page.locator(".output-tabs").getByRole("button", { name: /Rejected/ }).click();
  const firstRow = page.locator("tbody tr").first();
  await expect(firstRow).toBeVisible();
  const fileName = await firstRow.locator(".file-link").innerText();

  await firstRow.getByRole("button", { name: `Inspect ${fileName}` }).click();
  const inspector = page.locator(".inspector-panel");
  await expect(inspector).toBeInViewport();
  await expect(inspector.getByRole("heading", { name: fileName })).toBeFocused();
  await inspector.getByText("Show extraction report").click();
  await expect(inspector.locator(".report-preview pre")).toContainText("Routing decision");

  const pdfHref = await inspector.getByRole("link", { name: "Open PDF" }).getAttribute("href");
  expect(pdfHref).toBeTruthy();
  const pdfResponse = await request.get(pdfHref!);
  expect(pdfResponse.ok()).toBeTruthy();
  expect(pdfResponse.headers()["content-type"]).toContain("application/pdf");

  const download = await Promise.all([
    page.waitForEvent("download"),
    inspector.getByRole("button", { name: "Download report" }).click(),
  ]);
  expect(download[0].suggestedFilename()).toMatch(/-routing-report\.md$/);
});

test("shows the actual configured service mode", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "System details" }).click();
  await expect(page.getByText("Files: Cloudflare R2", { exact: true })).toBeVisible();
  await expect(page.getByText("Metadata: Supabase Postgres · Prisma", { exact: true })).toBeVisible();
  await expect(page.getByText("AI receives extracted text only.")).toBeVisible();
});

test("scans only the files selected for a batch", async ({ page, request }) => {
  await page.goto("/");
  let before = await (await request.get("/api/documents")).json();
  let pendingBefore = before.documents.filter((document: { classification: string }) => document.classification === "pending").length;
  const fixture = path.resolve("tests", "fixtures", "sample.pdf");
  for (let index = pendingBefore; index < 2; index += 1) {
    await page.getByLabel("Add PDF to input folder").setInputFiles(fixture);
    await expect(page.getByRole("status")).toContainText("added to input");
  }
  before = await (await request.get("/api/documents")).json();
  pendingBefore = before.documents.filter((document: { classification: string }) => document.classification === "pending").length;

  const checkboxes = page.getByLabel("Input folder files").getByRole("checkbox");
  await page.getByRole("button", { name: "Select all" }).click();
  await expect(checkboxes).toHaveCount(pendingBefore);
  for (let index = 0; index < pendingBefore; index += 1) await expect(checkboxes.nth(index)).toBeChecked();
  await page.getByRole("button", { name: "Clear" }).click();
  await checkboxes.nth(0).check();
  await checkboxes.nth(1).check();
  await expect(page.getByText("2 selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Run complete flow" }).click();
  await expect(page.getByRole("status")).toContainText("Selected batch finished: 2 routed", { timeout: 60_000 });

  const after = await (await request.get("/api/documents")).json();
  const pendingAfter = after.documents.filter((document: { classification: string }) => document.classification === "pending").length;
  expect(pendingAfter).toBe(pendingBefore - 2);
});

test("reset backs up the run, empties output, and returns every PDF to input", async ({ page, request }) => {
  await page.goto("/");
  const before = await (await request.get("/api/documents")).json();
  expect(before.documents.length).toBeGreaterThan(0);

  await page.getByText("Workspace tools", { exact: true }).click();
  await page.getByRole("button", { name: "Reset workspace" }).click();
  await page.getByLabel("Type RESET to confirm").fill("RESET");
  await page.getByRole("button", { name: "Back up and reset run" }).click();
  await expect(page.getByRole("status")).toContainText("files are back in input/", { timeout: 60_000 });

  const after = await (await request.get("/api/documents")).json();
  expect(after.documents).toHaveLength(before.documents.length);
  for (const document of after.documents) {
    expect(document.storageKey).toBe(`input/${document.id}.pdf`);
    expect(document.classification).toBe("pending");
    expect(document.status).toBe("uploaded");
    expect(document.destinationFolder).toBeNull();
    expect(document.result).toBeNull();
  }

  await expect(page.locator(".output-tabs").getByRole("button", { name: /Accepted 0/ })).toBeVisible();
  await expect(page.locator(".output-tabs").getByRole("button", { name: /Needs review 0/ })).toBeVisible();
  await expect(page.locator(".output-tabs").getByRole("button", { name: /Rejected 0/ })).toBeVisible();
  await expect(page.locator(".output-tabs").getByRole("button", { name: /Failed 0/ })).toBeVisible();
  await expect(page.getByLabel("Input folder files").getByRole("button")).toHaveCount(before.documents.length);
});

test("debug mode exposes and runs each pipeline stage separately", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Input folder files").getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "Debug step-by-step" }).click();
  await expect(page.getByText("Control and inspect every stage")).toBeVisible();
  await page.getByRole("button", { name: "Start debug flow" }).click();
  await expect(page.getByRole("status")).toContainText("PDF read complete", { timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Run next: Get text" })).toBeVisible();
  await page.getByRole("button", { name: "Run next: Get text" }).click();
  await expect(page.getByRole("status")).toContainText("Local text extraction complete", { timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Run next: Validate fields" })).toBeVisible();
  await expect(page.locator(".debug-log")).toContainText("PDF read complete");
});
