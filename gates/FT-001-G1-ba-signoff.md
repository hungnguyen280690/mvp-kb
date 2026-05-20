# G1 Sign-off: FT-001 — PAY.OUT.MANUAL

**Tính năng:** FT-001 — PAY.OUT.MANUAL (Lệnh thanh toán đi thủ công — Thêm mới / Xem / Sửa / Xóa)
**Ngày:** 2026-05-19
**BA Agent:** Claude AI
**Trạng thái:** CHỜ HUMAN DUYỆT

---

## 1. Danh sách Artifacts đã hoàn thành

| File                                    | Mô tả                                                                                                                                                                           | Trạng thái |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `features/FT-001/00-scope.md`           | Phạm vi MVP + Actors + Preconditions: 6 chức năng CRUD, 4 vai trò, 8 điều kiện tiên quyết, IN/OUT scope phân biệt rõ                                                            | ✅         |
| `features/FT-001/04-impact-analysis.md` | Phân tích tác động nghiệp vụ (Business Impact): 6 quy trình tác động, 6 nhóm người dùng, 6 tài liệu/báo cáo, 7 rủi ro nghiệp vụ (R-BA-01..07)                                   | ✅         |
| `features/FT-001/01-inconsistencies.md` | 44 vấn đề phân thành 3 nhóm: 8 mâu thuẫn (INC-C-01..08), 18 thiếu sót (INC-G-01..18), 18 điểm chưa rõ (INC-A-01..18); 11 mục `[NEEDS CLARIFICATION]` cần Product Owner xác nhận | ✅         |
| `features/FT-001/bdd-01-create.md`      | BDD: Tạo lệnh — luồng chính, lưu nháp, validate, submit (16 scenarios)                                                                                                          | ✅         |
| `features/FT-001/bdd-02-edit.md`        | BDD: Chỉnh sửa lệnh — optimistic lock, validate, các trường hợp từ chối sửa (12 scenarios)                                                                                      | ✅         |
| `features/FT-001/bdd-03-approve.md`     | BDD: Workflow duyệt — Checker phê duyệt/trả lại/từ chối, Approver phê duyệt/trả lại/từ chối, SoD (11 scenarios)                                                                 | ✅         |
| `features/FT-001/bdd-04-list.md`        | BDD: Danh sách + filter — tìm kiếm, sort, phân trang, lọc theo trạng thái/ngày/số tiền (14 scenarios)                                                                           | ✅         |
| `features/FT-001/bdd-05-delete.md`      | BDD: Xóa lệnh — soft delete, validate lý do, kiểm soát quyền, audit (11 scenarios)                                                                                              | ✅         |
| `features/FT-001/bdd-06-export.md`      | BDD: Xuất dữ liệu — Excel/PDF/CSV, sync export, tuỳ chọn trường, watermark (14 scenarios)                                                                                       | ✅         |
| `features/FT-001/bdd-07-copy.md`        | BDD: Sao chép lệnh — copy từ bản ghi hiện có, F-ID mới, DRAFT, kế thừa dữ liệu (13 scenarios)                                                                                   | ✅         |
| `docs/domain/glossary.md`               | Cập nhật 22 thuật ngữ nghiệp vụ mới từ FT-001                                                                                                                                   | ✅         |

**Tổng: 91 BDD scenarios / 7 luồng nghiệp vụ**

---

## 2. Tóm tắt phát hiện quan trọng

### 2.1. [QUAN TRỌNG] Mâu thuẫn cần quyết định trước khi chuyển SA

**INC-C-01 — Loại file đính kèm:** Spec ghi chép không nhất quán — một số chỗ chấp nhận `pdf/jpg/png/docx`, một số chỗ có thêm `xlsx`. BA đề xuất thống nhất chấp nhận `pdf/jpg/png/docx/xlsx` theo §B3.3. **Cần Product Owner xác nhận.**

**INC-C-02 — Event ID Submit:** `PAY.OUT.MANUAL.NEW.SUBMIT` được dùng cho cả flow tạo mới lẫn chỉnh sửa → tên gây hiểu nhầm cho Developer và QA. BA đề xuất đổi thành `PAY.OUT.MANUAL.SUBMIT` hoặc thêm `PAY.OUT.MANUAL.EDIT.SUBMIT`. **Cần Product Owner / SA quyết định.**

**INC-G-02 — REF_NO (Số YCTT):** Chưa rõ là user tự nhập hay hệ thống sinh tự động. BA khuyến nghị để hệ thống sinh theo pattern (`<MaKBNN>-YYYYMM-<seq>`) để tránh sai sót thủ công. **[CRITICAL — cần làm rõ trước khi SA thiết kế DB schema.]**

**INC-G-13 — PAYMENT_DATE:** Spec B1.1 ghi "không cho sửa" nhưng Testcase TC.1.05 lại test scenario nhập ngày sai → mâu thuẫn. BA đề xuất cho sửa với validate nằm trong kỳ kế toán OPEN. **[CRITICAL — ảnh hưởng nghiệp vụ và testcase.]**

### 2.2. [QUAN TRỌNG] Rủi ro nghiệp vụ mức CAO

Đã xác định 4 rủi ro mức **Cao** (xem `04-impact-analysis.md` §1.4):

- **R-BA-01**: Lệnh APPROVED dù dữ liệu sai CCID → Yêu cầu enforce đủ 19 VAL-\* cả client và server.
- **R-BA-02**: Vi phạm SoD — Maker tự duyệt lệnh của mình → Bắt buộc server-side check `Maker ≠ Checker ≠ Approver`.
- **R-BA-03**: Mất bản ghi do xóa cứng nhầm → Bắt buộc soft-delete, không có endpoint hard-delete.
- **R-BA-07**: Audit log bị xóa/thao túng → Append-only, phân quyền chặt, backup định kỳ.

### 2.3. Phạm vi OUT OF SCOPE đã xác nhận (MVP)

13 hạng mục đã được đưa ra ngoài phạm vi MVP và ghi nhận rõ trong `00-scope.md §4`, gồm các điểm nổi bật:

- Tích hợp thực sự với Oracle EBS GL (chỉ mock TRANSFERRED_TO_GL / POSTED).
- Pessimistic Lock / Concurrent Edit Lock → MVP chỉ Optimistic Lock (F-VER).
- Ký số / OTP cho giao dịch trọng yếu.
- Async export >50.000 bản ghi; Export PII field; Song ngữ.

### 2.4. Điểm phụ thuộc kỹ thuật cần SA lưu ý

- **CCID Cross-Validation**: Cần SA xác định cơ chế gọi CCID — gọi Oracle EBS trực tiếp hay cache local?
- **Optimistic Lock (`F-VER`)**: Cần SA thiết kế `(F-ID, F-VER)` unique constraint ở DB.
- **Audit Log**: SA cần thiết kế bảng `audit_log` với retention ≥ 7 năm; đảm bảo append-only (no UPDATE/DELETE permission trên bảng này).
- **Idempotency Key**: Server cần hỗ trợ idempotency key để chống double-submit (§C2 mục 8).

---

## 3. Checklist G1

- [ ] **Kế thừa Spec**: 100% yêu cầu trong file Spec đã được chuyển hóa thành BDD scenarios? → 91 scenarios / 7 luồng (Create, Edit, Approve, List, Delete, Export, Copy)
- [ ] **Scope & Impact**: Đã xác định rõ phạm vi MVP (IN/OUT scope), các điểm mâu thuẫn (8 INC-C), thiếu sót (18 INC-G) và tác động nghiệp vụ (7 rủi ro R-BA-01..07)?
- [ ] **BDD Granularity**: Các kịch bản BDD đã bao phủ đủ 3 tầng (Happy path, Alternative, Exceptions) cho tất cả 7 luồng?
- [ ] **Context Sync**: Mọi thuật ngữ nghiệp vụ mới đã được định nghĩa trong `docs/domain/glossary.md`? (22 thuật ngữ mới đã thêm)
- [ ] **Critical Gaps Resolved**: Các vấn đề INC-G-02 (REF_NO) và INC-G-13 (PAYMENT_DATE) đã được Product Owner xác nhận hướng xử lý?

> ⏳ **CHỜ HUMAN DUYỆT**: Sau khi Human xác nhận các mục checklist trên, ghi marker `[X] Verified by Human` vào từng mục và lưu file này lại để chuyển sang Stage 2 (SA Agent).

---

## 4. Hướng dẫn cho SA Agent (Stage 2)

Khi nhận được sign-off đã duyệt, SA Agent cần ưu tiên làm rõ:

1. Quyết định về **REF_NO**: hệ thống sinh hay user nhập (INC-G-02).
2. Quyết định về **PAYMENT_DATE**: read-only hay editable (INC-G-13).
3. Cơ chế gọi **CCID**: online call Oracle EBS hay cache + sync?
4. Thiết kế bảng `audit_log` với retention policy.
5. Định nghĩa đầy đủ `F-ID` (format cụ thể), `F-VER` (int, default 1), `F-STATUS` (VARCHAR ENUM).
6. Bổ sung trường `RETURN_REASON` / `REJECT_REASON` vào Approval popup schema (INC-G-03).
