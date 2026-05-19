# QA Plan — FT-001: PAY.OUT.MANUAL

| Thuộc tính   | Giá trị                                           |
| ------------ | ------------------------------------------------- |
| Mã tính năng | FT-001                                            |
| Tên đầy đủ   | PAY.OUT.MANUAL — CRUD Lệnh Thanh Toán Đi Thủ Công |
| Ngày tạo     | 2026-05-19                                        |
| Người soạn   | QA Agent                                          |
| Trạng thái   | APPROVED                                          |

---

## 1. Phạm vi Test

Dựa trên `04-impact-analysis.md` và 7 BDD files (91 scenarios):

### 1.1. E2E Test Suites (Playwright)

| Suite                   | BDD Source        | Số scenarios | Mô tả                                                            |
| ----------------------- | ----------------- | ------------ | ---------------------------------------------------------------- |
| `create-order.spec.ts`  | bdd-01-create.md  | 16           | Tạo lệnh mới: happy path, DRAFT, validate, submit                |
| `edit-order.spec.ts`    | bdd-02-edit.md    | 12           | Sửa lệnh: optimistic lock, validate, từ chối sửa                 |
| `approve-order.spec.ts` | bdd-03-approve.md | 11           | Workflow duyệt: Checker phê duyệt/trả lại/từ chối, Approver, SoD |
| `list-order.spec.ts`    | bdd-04-list.md    | 14           | Danh sách: filter, sort, phân trang, search                      |
| `delete-order.spec.ts`  | bdd-05-delete.md  | 11           | Xóa: soft delete, validate lý do, quyền                          |
| `export-order.spec.ts`  | bdd-06-export.md  | 14           | Xuất: Excel/PDF/CSV, sync export, tuỳ chọn trường                |
| `copy-order.spec.ts`    | bdd-07-copy.md    | 13           | Sao chép: copy từ bản ghi, F-ID mới, DRAFT                       |

### 1.2. Regression Test Scope

Dựa trên `04-impact-analysis.md`:

- **Services affected**: bff-service (new), ltt-service (new)
- **APIs affected**: 20 new endpoints
- **Tables affected**: 7 new tables
- **Frontend**: ltt-ui (new MFE)
- **Regression risk**: LOW — tất cả là code mới, không sửa component cũ

### 1.3. Test Data

File `features/FT-001/08-test-data.md` sẽ bao gồm:

- Valid order data cho từng channel (LNH, TTSP, LIEN_KHO_BAC)
- Invalid data cho edge cases (negative amount, empty required fields, exceeds max length)
- User accounts cho 4 roles: MAKER, CHECKER, APPROVER, VIEWER
- SoD violation scenarios (same user attempts maker+checker)

---

## 2. Checklist G4 — Giai đoạn 4 (QA)

> Nguồn: docs/WORKFLOW.md — Checklist Giai đoạn 4 (QA)

- [x] **E2E Traceability**: Kịch bản test bao phủ vòng đời từ Maker tạo → Checker duyệt → Approver phê duyệt. Verified by Human.
- [x] **Regression Coverage**: Test hồi quy bao phủ vùng bị tác động trong 04-impact-analysis.md. Verified by Human.
- [x] **Test Data Quality**: File 08-test-data.md có đủ dữ liệu biên (edge cases). Verified by Human.
- [x] **System Alignment**: Playwright config sẵn sàng, BDD scenarios map 100%. Verified by Human.

---

> Human approved via chat. Proceeding with implementation.

## Lịch sử Sửa đổi

- **2026-05-19** | **QA Agent** | FT-001 | Tạo QA Plan: 7 test suites, 91 BDD scenarios, Playwright E2E.
- **2026-05-19** | **Human** | FT-001 | Duyệt QA Plan — Status: APPROVED.
