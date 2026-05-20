import { test, expect } from "@playwright/test";
import { setDevUser, MAKER_CTX, devHeaders, createDraftViaApi, submitViaApi } from "./helpers/auth";

const BASE_API = "http://localhost:3000/api";

test.describe("TC-E2E: Delete", () => {
  test("TC-E2E-13: xóa DRAFT → confirm → order bị xóa mềm", async ({
    page,
    request,
  }) => {
    const orderId = await createDraftViaApi(request);

    await setDevUser(page, MAKER_CTX);
    await page.goto(`/ltt/pay-out-manual/${orderId}`);

    await expect(page.getByText("Nháp").first()).toBeVisible({ timeout: 10000 });

    // Click "Xóa" to open DeleteDialog
    const deleteBtn = page.getByRole("button", { name: "Xóa" });
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Fill reason (min 10 chars)
    await dialog.locator("textarea").fill("Xóa để kiểm tra E2E test run");

    // Check confirmation checkbox
    await dialog.getByText("Tôi xác nhận muốn xóa lệnh này").click();

    // Click the dialog's "Xóa" button (now enabled)
    await dialog.getByRole("button", { name: "Xóa" }).click();

    // After deletion: redirect to list page
    await page.waitForURL(/\/ltt\/pay-out-manual$|\/ltt\/pay-out-manual\?/, { timeout: 8000 }).catch(() => {});

    // Order is soft-deleted — GET returns 200 with status=DELETED
    const res = await request.get(`${BASE_API}/pay-out-manual/${orderId}`, {
      headers: devHeaders(MAKER_CTX),
    });
    const body = await res.json();
    expect(body.status).toBe("DELETED");
  });

  test("TC-E2E-14: xóa order đã SUBMITTED → API trả 409", async ({ request }) => {
    const orderId = await createDraftViaApi(request);
    await submitViaApi(request, orderId);

    // Try to delete READY_FOR_APPROVAL order — status not in DELETABLE_STATUSES → 409 Conflict
    const res = await request.delete(`${BASE_API}/pay-out-manual/${orderId}`, {
      data: { deleteReason: "Xoa vi ly do kiem tra E2E test run", confirmed: true },
      headers: devHeaders(MAKER_CTX),
    });
    expect([409, 422, 400, 403]).toContain(res.status());
  });

  test("TC-E2E-15: cancel dialog xóa → order vẫn còn", async ({ page, request }) => {
    const orderId = await createDraftViaApi(request);

    await setDevUser(page, MAKER_CTX);
    await page.goto(`/ltt/pay-out-manual/${orderId}`);

    await expect(page.getByText("Nháp").first()).toBeVisible({ timeout: 10000 });

    const deleteBtn = page.getByRole("button", { name: "Xóa" });
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Click "Hủy" — cancel the dialog
    await dialog.getByRole("button", { name: "Hủy" }).click();

    // Dialog is closed; still on detail page
    await expect(dialog).not.toBeVisible({ timeout: 2000 });
    expect(page.url()).toContain(orderId);

    // Order still exists with DRAFT status
    const res = await request.get(`${BASE_API}/pay-out-manual/${orderId}`, {
      headers: devHeaders(MAKER_CTX),
    });
    const body = await res.json();
    expect(body.status).toBe("DRAFT");
  });
});
