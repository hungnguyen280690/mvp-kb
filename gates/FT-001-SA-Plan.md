# SA Plan — FT-001: PAY.OUT.MANUAL (Lệnh Thanh Toán Đi Thủ Công)

| Thuộc tính   | Giá trị                                           |
| ------------ | ------------------------------------------------- |
| Mã tính năng | FT-001                                            |
| Tên đầy đủ   | PAY.OUT.MANUAL — CRUD Lệnh Thanh Toán Đi Thủ Công |
| Ngày tạo     | 2026-05-19                                        |
| Người soạn   | SA Agent                                          |
| Trạng thái   | CHỜ HUMAN DUYỆT                                   |

---

## 1. Quyết định Thiết kế về 2 Điểm CRITICAL từ BA

### 1.1. INC-G-02 — `REF_NO`: Hệ thống tự sinh (Auto-generate)

**Quyết định**: SA chọn phương án **(b)** — hệ thống tự sinh theo pattern:

```
<MaKBNN>-YYYYMM-<seq6>
```

Ví dụ: `HN001-202605-000123`

**Lý do**:

1. **Tránh sai sót thủ công**: Trong môi trường nghiệp vụ KBNN, lỗi nhập nhầm `REF_NO` có thể gây trùng mã chứng từ, ảnh hưởng trực tiếp đến đối chiếu GL downstream. Auto-generate loại bỏ rủi ro này hoàn toàn.
2. **Đảm bảo tính duy nhất (Uniqueness)**: Kết hợp `MaKBNN + kỳ YYYYMM + sequence 6 số` đảm bảo unique trong phạm vi đơn vị và tháng mà không cần thêm constraint phức tạp.
3. **Audit & Traceability**: Pattern có ý nghĩa nghiệp vụ (đơn vị + kỳ) giúp tra soát nhanh không cần JOIN bảng.
4. **Nhất quán với tiêu chuẩn KBNN**: Tài liệu spec §A4 bước 1 ("Sinh ID của giao dịch") và VAL-11 ("mã giao dịch / số chứng từ duy nhất") ngụ ý hệ thống sinh — pattern có prefix đơn vị phù hợp với thực tế vận hành đa đơn vị KBNN.

**Cơ chế kỹ thuật dự kiến**: Oracle Sequence + trigger hoặc ứng dụng generate khi Maker bấm "Tạo mới" (trạng thái DRAFT), gán vào record ngay lập tức và không thay đổi suốt vòng đời record.

---

### 1.2. INC-G-13 — `PAYMENT_DATE`: Cho phép sửa, validate trong kỳ kế toán OPEN

**Quyết định**: SA chọn phương án **(a)** — PAYMENT_DATE là trường **EDITABLE**, giá trị mặc định là ngày làm việc hiện tại, nhưng Maker được phép sửa. Validation: ngày được chọn phải nằm trong kỳ kế toán có trạng thái `OPEN`.

**Lý do**:

1. **Giữ nguyên Testcase TC.1.05**: TC.1.05 đã định nghĩa scenario "Nhập PAYMENT_DATE = 01/01/2024" — nếu không cho sửa thì testcase này vô nghĩa và mất đi khả năng kiểm thử edge case kỳ kế toán sai.
2. **Nhu cầu nghiệp vụ thực tế**: Trong vận hành KBNN, Maker thường cần lập lệnh cho một ngày trong kỳ hiện tại nhưng không nhất thiết là hôm nay (ví dụ: lập lệnh ngày hôm qua do giao dịch thực phát sinh T-1). Cho sửa trong kỳ OPEN đáp ứng đúng nghiệp vụ backdating hợp lệ.
3. **Kiểm soát bằng Validation thay vì Lock**: Ràng buộc ngày phải nằm trong kỳ OPEN là đủ chặt chẽ để ngăn nhập sai (quá khứ xa / tương lai) mà không làm mất tính linh hoạt. Cơ chế này nhất quán với hệ thống GL Oracle EBS (period open/close control).
4. **Mâu thuẫn spec được giải quyết rõ ràng**: Spec §B1.1 ("không cho phép sửa") xung đột với TC.1.05. SA quyết định ưu tiên TC.1.05 và nhu cầu nghiệp vụ; sẽ cập nhật §B1.1 trong `02-design.md`.

**Validation rule dự kiến**: `PAYMENT_DATE >= period.start_date AND PAYMENT_DATE <= period.end_date WHERE period.status = 'OPEN'`.

---

## 2. Phạm vi Thiết kế — Artifacts SA sẽ tạo ra

| #   | Artifact                                           | Mô tả                                                                                                                                           |
| --- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `features/FT-001/02-design.md`                     | Tài liệu Thiết kế Kỹ thuật: giải pháp kiến trúc, State Machine chi tiết, ràng buộc SoD, optimistic lock, idempotency, RBAC                      |
| 2   | `features/FT-001/contracts/openapi.yaml`           | API Contract (OpenAPI 3.1): toàn bộ endpoints bao phủ 100% BDD use cases từ G1 (7 BDD files: create, edit, approve, list, delete, export, copy) |
| 3   | `features/FT-001/03-schema.sql`                    | DB Schema Oracle 19c: DDL cho tất cả bảng chính + audit, sequences, indexes, constraints (FK, UK, CHECK), optimistic lock column                |
| 4   | `features/FT-001/04-impact-analysis.md` (cập nhật) | Bổ sung System Impact: Service bị tác động, API mới/thay đổi, Table mới/thay đổi, Security impact                                               |

> Artifact tuỳ chọn: `features/FT-001/06-threat-model.md` — sẽ tạo nếu phân tích Security phát sinh rủi ro cao (Threat Model đầy đủ).

---

## 3. Kế hoạch Thực hiện

### Bước 1 — Đọc và phân tích đầu vào

- Đọc toàn bộ 7 file BDD (`bdd-01` → `bdd-07`) để lập danh sách use case → endpoint.
- Đọc `docs/domain/glossary.md` để đồng bộ tên field API/DB với thuật ngữ nghiệp vụ.
- Đọc `docs/conventions/naming-rules.md` để áp dụng chuẩn đặt tên.

### Bước 2 — Thiết kế API Contract (`openapi.yaml`)

- Xác định danh sách endpoint: CRUD + workflow actions (submit, check, approve, return, reject) + export + print + lookup + attachment.
- Thiết kế request/response schema dùng đúng `UPPER_SNAKE_CASE` theo §B4.
- Định nghĩa security scheme (RBAC, permission codes) cho từng endpoint.
- Đảm bảo `X-Idempotency-Key` header cho POST/PUT/DELETE.

### Bước 3 — Thiết kế DB Schema (`03-schema.sql`)

- Xác định các bảng chính: `PAY_OUT_MANUAL` (header), `PAY_OUT_MANUAL_LINE` (dòng chi tiết), `PAY_OUT_MANUAL_ATTACH` (đính kèm), `PAY_OUT_MANUAL_AUDIT_LOG` (audit), `PAY_OUT_APPROVAL_HISTORY` (lịch sử phê duyệt).
- Chuẩn hoá theo INC-G-01: định nghĩa rõ F-ID, F-VER, F-STATUS, F-AUDIT fields.
- Thêm các trường từ Gaps đã xác định: `RETURN_REASON`, `REJECT_REASON`, `CHECKED_BY`, `CHECKED_DATE`, `APPROVED_BY`, `APPROVED_DATE`.
- Implement SoD constraint: CHECK `CREATED_BY <> CHECKED_BY`, `CREATED_BY <> APPROVED_BY`, `CHECKED_BY <> APPROVED_BY`.
- Thiết kế `REF_NO` auto-generate sequence.

### Bước 4 — Thiết kế Kỹ thuật (`02-design.md`)

- Mô tả giải pháp kiến trúc: service nào xử lý (ltt-service, bff-service, audit-service).
- State Machine chi tiết với events và transitions.
- Giải thích quyết định INC-G-02 (REF_NO) và INC-G-13 (PAYMENT_DATE).
- Ghi rõ các Gaps MVP còn lại được xử lý thế nào (optimistic lock, attachment limit, SoD rule).

### Bước 5 — Cập nhật Impact Analysis (`04-impact-analysis.md`)

- Bổ sung phần System Impact (SA scope): services bị ảnh hưởng, API endpoints mới, tables mới, security changes.

### Bước 6 — Review & Sign-off checklist

- Rà soát 100% BDD coverage trong `openapi.yaml`.
- Xác nhận tất cả tên dùng đúng glossary và naming conventions.
- Gửi Checklist G2 cho Human duyệt → ký `FT-001-G2-design-signoff.md`.

---

## 4. Checklist G2 — Giai đoạn 2 (SA / Thiết kế)

> Nguồn: `docs/WORKFLOW.md` — Checklist Giai đoạn 2 (SA)

- [ ] **BDD Coverage**: Hợp đồng openapi.yaml và các API endpoint đã bao phủ 100% Use Case từ G1?
- [ ] **Impact Assessment**: 04-impact-analysis.md đã bổ sung System Impact (Service, API, Table, Security)?
- [ ] **Naming Alignment**: Tất cả tên API, bảng DB, field đã dùng đúng thuật ngữ từ glossary.md?
- [ ] **Security Schema**: Các endpoint nhạy cảm đã có RBAC, audit, validation trong design?
- [ ] **Constraints**: Các ràng buộc kỹ thuật (optimistic lock, idempotency, SoD) đã được reflect trong schema?

---

## 5. Ghi chú

> ⏳ CHỜ HUMAN DUYỆT: Vui lòng xác nhận trước khi SA Agent tiến hành thiết kế.

**Lưu ý đặc biệt**: Tài liệu `features/FT-001/01-inconsistencies.md` còn **15 mục `[NEEDS CLARIFICATION]`** chưa được Product Owner / chuyên gia nghiệp vụ KBNN trả lời chính thức. SA đã đưa ra quyết định kỹ thuật cho 2 mục CRITICAL (INC-G-02, INC-G-13) ở mục 1 trên. Các mục còn lại sẽ được xử lý theo nguyên tắc: áp dụng giải pháp đề xuất của BA Agent hoặc giải pháp MVP thực tế nhất, và ghi rõ trong `02-design.md` để dễ điều chỉnh khi có feedback chính thức.

---

## Lịch sử Sửa đổi

- **2026-05-19** | **SA Agent** | FT-001 | Tạo file SA-Plan, ghi nhận quyết định thiết kế cho INC-G-02 (REF_NO auto-gen) và INC-G-13 (PAYMENT_DATE editable), xác định phạm vi artifacts và kế hoạch thực hiện.
