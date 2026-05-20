# QA Plan — FT-001: PAY.OUT.MANUAL (Lệnh Thanh Toán Đi Thủ Công)

| Thuộc tính   | Giá trị                                             |
| ------------ | --------------------------------------------------- |
| Mã tính năng | FT-001                                              |
| Tên đầy đủ   | PAY.OUT.MANUAL — CRUD Lệnh Thanh Toán Đi Thủ Công   |
| Giai đoạn    | Stage 4 (Quality Assurance — QA)                    |
| Ngày tạo     | 2026-05-21                                          |
| Người soạn   | QA Agent                                            |
| Trạng thái   | **CHỜ HUMAN DUYỆT**                                 |

---

## 1. Mục tiêu & Phạm vi Kiểm thử QA (Stage 4)

Đảm bảo chất lượng toàn diện của tính năng `FT-001 — PAY.OUT.MANUAL` bằng cách thực hiện các kịch bản E2E Automation Test sử dụng **Playwright** chạy trên trình duyệt chromium không đầu (headless chrome) kết nối trực tiếp frontend (`ltt-ui` chạy trên cổng 3002) với backend (`ltt-core` chạy trên cổng 8081).

**Phạm vi kiểm thử bao gồm:**
- **BDD Use Cases**: 100% kịch bản BDD tại `bdd-01` đến `bdd-07`.
- **Phân tích Tác động Nghiệp vụ**: Các vùng tác động nghiệp vụ từ `04-impact-analysis.md`.
- **Ràng buộc Bảo mật & Kỹ thuật**: Separation of Duties (SoD), Optimistic Locking, Idempotency, Attachment validation, PII Masking.
- **Tính tiện dụng & UI**: Phím tắt, lookup, in chứng từ, xuất báo cáo.

---

## 2. Danh sách Kịch bản Kiểm thử E2E (E2E Test Cases Suite)

Dưới đây là danh sách chi tiết các kịch bản test tự động bằng Playwright, được liên kết trực tiếp với các kịch bản BDD và mã nghiệp vụ BIZ:

### Nhóm 1: Khởi tạo & Lưu nháp (Create & Draft - BDD-01)
- **TC-E2E-01 [BIZ-002, VAL-07]**: Maker tạo mới và lưu nháp thành công lệnh thanh toán hợp lệ.
  - *Verify*: Tự sinh F-ID, F-VER=1, F-STATUS="DRAFT", tự tổng AMOUNT từ lines, hiển thị MSG-OK-SAVE.
- **TC-E2E-02 [VAL-01, VAL-02]**: Lưu nháp thành công ngay cả khi thiếu trường bắt buộc (bỏ qua validate validation đầy đủ).
  - *Verify*: Chỉ validate format, lưu DRAFT thành công.
- **TC-E2E-03 [BIZ-004]**: Maker huỷ form sau khi nhập dữ liệu, có popup xác nhận huỷ và không lưu DB.
- **TC-E2E-04 [VAL-03]**: Validate logic trường dữ liệu sai định dạng (ví dụ: ngày sai, số tiền âm) khi lưu nháp.
  - *Verify*: Hiển thị lỗi đỏ dưới input, chặn lưu.

### Nhóm 2: Chỉnh sửa & Xóa (Edit & Delete - BDD-02, BDD-05)
- **TC-E2E-05 [BIZ-002]**: Maker gốc sửa thành công lệnh ở trạng thái DRAFT / RETURNED_TO_MAKER.
- **TC-E2E-06 [BIZ-003]**: Maker xóa lệnh DRAFT (Soft-delete).
  - *Verify*: Bắt buộc nhập lý do xoá ≥ 10 ký tự, tick checkbox xác nhận; F-STATUS đổi thành "DELETED", không hiển thị trong danh sách mặc định nhưng có audit log đầy đủ.
- **TC-E2E-07 [BIZ-003]**: Chặn xoá lệnh không phải trạng thái DRAFT (ví dụ: READY_FOR_APPROVAL).

### Nhóm 3: Gửi & Duyệt Lệnh (Workflow Submit & Approve - BDD-03, BDD-04)
- **TC-E2E-08 [VAL-01..VAL-19]**: Maker gửi kiểm soát lệnh DRAFT thành công.
  - *Verify*: Validate đầy đủ 19 quy tắc; F-STATUS chuyển từ "DRAFT" → "READY_FOR_APPROVAL"; in-app notification gửi tới Checker.
- **TC-E2E-09 [BIZ-001]**: Checker kiểm duyệt lệnh (READY_FOR_APPROVAL → PENDING_APPROVER).
  - *Verify*: Nút "Kiểm duyệt" hiển thị đúng cho Checker; popup xác nhận; F-STATUS chuyển trạng thái thành công.
- **TC-E2E-10 [BIZ-001]**: Approver phê duyệt lệnh cuối (PENDING_APPROVER → APPROVED).
  - *Verify*: F-STATUS chuyển thành "APPROVED"; in-app notification gửi tới Maker gốc.

### Nhóm 4: Trả lại & Từ chối (Workflow Return & Reject - BDD-03)
- **TC-E2E-11 [BIZ-005]**: Checker / Approver trả lại lệnh cho Maker gốc (→ RETURNED_TO_MAKER).
  - *Verify*: Bắt buộc nhập lý do ≥ 10 ký tự; F-STATUS chuyển đổi đúng; Maker gốc nhận notification và sửa được lệnh.
- **TC-E2E-12 [BIZ-006]**: Checker / Approver từ chối lệnh (→ REJECTED).
  - *Verify*: Bắt buộc nhập lý do ≥ 10 ký tự; F-STATUS chuyển thành "REJECTED" (trạng thái cuối, không được sửa/submit lại).

### Nhóm 5: Kiểm soát Nghiệp vụ & Ràng buộc Kỹ thuật (Safety & Security Constraints)
- **TC-E2E-13 [BIZ-001]**: Separation of Duties (SoD) Enforcement.
  - *Test 13a*: Maker gửi kiểm soát, tự đăng nhập bằng Checker → Chặn không cho tự duyệt (Trả về HTTP 403 / Disabled nút).
  - *Test 13b*: Checker duyệt lên PENDING_APPROVER, tự đăng nhập bằng Approver → Chặn không cho tự duyệt cuối.
- **TC-E2E-14 [VAL-15]**: Optimistic Lock (Lost-Update Prevention).
  - *Verify*: Maker A và Maker B cùng mở 1 lệnh DRAFT. Maker A bấm Lưu trước (F-VER lên 2). Maker B bấm Lưu sau → Báo lỗi MSG-ERR-LOCK, yêu cầu tải lại trang.
- **TC-E2E-15 [ADR-0005]**: Idempotency Check.
  - *Verify*: Gửi trùng API request với cùng `X-Idempotency-Key` → Backend trả về kết quả đã xử lý trước đó, ngăn double-create/double-approve.
- **TC-E2E-16 [VAL-19]**: CCID Cross-Validation Rules.
  - *Verify*: Thử nhập tổ hợp segment COA không hợp lệ → Client hiển thị cảnh báo, Server-side validate chặn submit.
- **TC-E2E-17 [VAL-12]**: Cấu hình Hạn mức (Limit check).
  - *Verify*: Nhập lệnh chi vượt hạn mức của Maker → Hiện warning vàng cảnh báo, nhưng cho phép Maker submit. Cấp phê duyệt cần có role Supervisor hoặc Approver cấp cao hơn để duyệt.

### Nhóm 6: Tiện ích & Giao diện (Utilities - BDD-06, BDD-07, Shortcuts)
- **TC-E2E-18 [BIZ-010]**: Xem danh sách lệnh, tìm kiếm nâng cao, phân trang và sắp xếp.
- **TC-E2E-19 [BIZ-007, BIZ-008]**: Rà soát Audit Log chi tiết (oldValue → newValue) và Tab Trạng thái phê duyệt (stepper highlight chính xác).
- **TC-E2E-20**: Xuất dữ liệu (Export) ra Excel/PDF/CSV (chọn trường, watermark, cap 50k).
- **TC-E2E-21**: In chứng từ (Print PDF preview: Bản nháp / Bản chính / Bản sao).
- **TC-E2E-22**: Upload đính kèm (Attachments).
  - *Verify*: Chấp nhận file hợp lệ (≤10MB, pdf/jpg/png/docx/xlsx). Chặn file sai định dạng hoặc vượt dung lượng (>10MB).
- **TC-E2E-23**: Sao chép lệnh (Copy).
  - *Verify*: Nhân bản đúng data, sinh ID mới, reset status về DRAFT.
- **TC-E2E-24**: Phím tắt (Keyboard Shortcuts).
  - *Verify*: Kiểm thử các phím tắt cốt lõi: `Ctrl+N` (Tạo mới), `Ctrl+S` (Lưu nháp), `F9` (Gửi duyệt), `Esc` (Huỷ).

---

## 3. Phạm vi Kiểm thử Hồi quy (Regression Test Scope)

Dựa vào `04-impact-analysis.md`, các vùng hệ thống chịu tác động trực tiếp và cần rà soát kỹ để tránh phát sinh lỗi hồi quy (Regression Bugs):
1. **Master Data Cache**: Phân hệ lookup LOV.01..07 dùng chung bị chậm hoặc mismatch.
2. **Kỳ Kế Toán (Period Control)**: Kiểm tra validation chặn các giao dịch có PAYMENT_DATE nằm ngoài kỳ OPEN (VAL-08).
3. **RBAC & Token**: Token JWT giả lập (dev context) không bị rò rỉ hoặc cấp sai vai trò.
4. **Optimistic Lock & Versioning**: Đảm bảo trường `F_VER` trong DB tự động tăng chính xác sau mỗi hành động PUT/workflow.
5. **Soft-delete flag**: Xác minh các query danh sách mặc định luôn lọc `F_STATUS <> 'DELETED'`.

---

## 4. Chiến lược Dữ liệu Kiểm thử (Test Data Strategy)

QA sẽ thiết lập file `features/FT-001/08-test-data.md` chứa các bộ dữ liệu test mẫu bao gồm cả các trường hợp biên (Edge Cases):

### 4.1. Danh sách Tài khoản Kiểm thử (RBAC Dev Users)
- **Maker**: `user-e2e-maker-01` (KBNN Hà Nội — HN001)
- **Checker**: `user-e2e-checker-01` (KBNN Hà Nội — HN001)
- **Approver**: `user-e2e-approver-01` (KBNN Hà Nội — HN001)
- **Supervisor**: `user-e2e-supervisor-01` (KBNN Hà Nội — HN001)
- **Viewer / Auditor**: `user-e2e-viewer-01` (KBNN Hà Nội — HN001)
- **Maker B**: `user-e2e-maker-02` (KBNN Hải Phòng — HP001 — dùng để test chặn truy cập chéo đơn vị)

### 4.2. Bộ Dữ liệu Biên (Edge Cases Test Data)
- **Dữ liệu biên số tiền (Amount)**:
  - Giá trị tối thiểu: 1 VND (TC.1.08)
  - Giá trị tối đa: 999,999,999,999 VND (kiểm tra tràn số giao diện và DB)
  - Giá trị lỗi: 0 VND hoặc âm (chặn validate VAL-07)
- **Độ dài CCID Segments**:
  - Biên đúng: `S1` (2 ký tự), `1111` (4 ký tự)...
  - Biên lỗi: CCID 12 segments rỗng hoặc vượt quá độ dài quy định.
- **Kích thước file đính kèm**:
  - File biên đúng: file 9.9 MB.
  - File biên lỗi: file 10.1 MB (chặn upload).
- **Ký tự đặc biệt (XSS/SQLi injection vectors)**:
  - Tên người nhận chứa: `<script>alert('XSS')</script>`, `' OR '1'='1`.

---

## 5. Checklist Ký duyệt Tiêu chuẩn G4 (Từ docs/WORKFLOW.md)

Trước khi ký duyệt G4, QA Agent phải tự kiểm tra và xác nhận đạt các tiêu chuẩn sau:

- [ ] **E2E Traceability**: Các kịch bản test tự động đã bao phủ được "vòng đời" của dữ liệu từ khi Maker tạo đến khi Approver duyệt?
- [ ] **Regression Coverage**: Đã thiết kế các Test Case hồi quy bao phủ toàn bộ các vùng/file bị tác động được liệt kê trong `04-impact-analysis.md`?
- [ ] **Test Data Quality**: File `08-test-data.md` đã có đủ dữ liệu biên (Edge cases) để "bẻ gãy" logic nếu code sai?
- [ ] **System Alignment**: Đã chạy `smoke-api.sh` và `smoke-ui.sh` pass? Toàn bộ module (BE-FE-Gateway) phản hồi đúng theo Contract?

---

## 6. Xác nhận từ Con người (Human Verification)

> [!IMPORTANT]
> **Quy định MARBO**: Chỉ bắt đầu thực hiện viết kịch bản test E2E và tạo dữ liệu kiểm thử khi người dùng duyệt kế hoạch này bằng lời nhắn và cập nhật marker bên dưới.

- **[ ] Verified by Human: <Tên Người Dùng> đã duyệt kế hoạch kiểm thử ngày 2026-05-21.**

---

## Lịch sử Sửa đổi (Audit Log)
- **2026-05-21** | **QA Agent** | FT-001 | Khởi tạo QA Plan chi tiết cho Stage 4, định nghĩa 24 kịch bản E2E Playwright, xác định phạm vi hồi quy và chiến lược dữ liệu kiểm thử.
