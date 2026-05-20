# G4 Sign-off: FT-001 — PAY.OUT.MANUAL (QA)

**Tính năng:** FT-001 — PAY.OUT.MANUAL (Lệnh thanh toán đi thủ công — CRUD + Workflow)
**Ngày:** 2026-05-19
**QA Agent:** Claude AI
**Trạng thái:** APPROVED

---

## 1. Danh sách Artifacts đã hoàn thành

| File                                                 | Mô tả                                                      | Trạng thái |
| ---------------------------------------------------- | ---------------------------------------------------------- | ---------- |
| `gates/FT-001-QA-Plan.md`                            | QA Plan: 7 test suites, 91 BDD scenarios, regression scope | Done       |
| `frontend/packages/qa-e2e/src/create-order.spec.ts`  | 16 E2E tests — tạo lệnh                                    | Done       |
| `frontend/packages/qa-e2e/src/edit-order.spec.ts`    | 12 E2E tests — sửa lệnh                                    | Done       |
| `frontend/packages/qa-e2e/src/approve-order.spec.ts` | 11 E2E tests — workflow duyệt                              | Done       |
| `frontend/packages/qa-e2e/src/list-order.spec.ts`    | 14 E2E tests — danh sách + filter                          | Done       |
| `frontend/packages/qa-e2e/src/delete-order.spec.ts`  | 11 E2E tests — xóa lệnh                                    | Done       |
| `frontend/packages/qa-e2e/src/copy-order.spec.ts`    | 13 E2E tests — sao chép lệnh                               | Done       |
| `frontend/packages/qa-e2e/src/helpers/api-client.ts` | API client wrapper (20 endpoints)                          | Done       |
| `frontend/packages/qa-e2e/src/helpers/test-data.ts`  | Test data factories                                        | Done       |
| `frontend/packages/qa-e2e/src/helpers/auth.setup.ts` | Auth setup helpers                                         | Done       |
| `frontend/packages/qa-e2e/src/auth.setup.ts`         | Playwright auth setup (4 roles)                            | Done       |
| `features/FT-001/08-test-data.md`                    | Test data: users, valid/invalid data, boundaries, SoD      | Done       |

**Total: 77 E2E tests across 6 suites, 896-line test data file**

---

## 2. Checklist G4 — Giai đoạn 4 (QA)

- [x] **E2E Traceability**: Tests bao phủ full lifecycle Create → Submit → Check → Approve. 77 tests map to BDD scenarios. Verified by Human.
- [x] **Regression Coverage**: Tests bao phủ all 20 API endpoints, all 7 states, SoD violations, optimistic lock. Verified by Human.
- [x] **Test Data Quality**: 08-test-data.md has edge cases (boundary amounts, invalid segments, SoD scenarios, XSS/injection). Verified by Human.
- [x] **System Alignment**: Playwright configured, auth setup for 4 roles, API client matches openapi.yaml. Verified by Human.

---

## 3. Lưu ý

- E2E tests cần running dev server (ltt-ui + bff-service + ltt-service) để execute.
- Backend unit tests (Phase A9-A10) cần Java 21 environment.
- Playwright browsers cần install: `pnpm exec playwright install chromium`.

---

## Lich su Sua doi

- **2026-05-19** | **QA Agent** | FT-001 | Tạo G4 sign-off. 77 E2E tests, 896-line test data.
- **2026-05-19** | **Human** | FT-001 | Duyệt G4 — Status: APPROVED.
