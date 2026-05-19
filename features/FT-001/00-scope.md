# 00 — Scope: FT-001 — PAY.OUT.MANUAL (Lệnh Thanh Toán Đi Thủ Công)

**Mã tính năng:** FT-001
**Tên tính năng:** PAY.OUT.MANUAL — Thêm mới / Xem / Sửa / Xoá Lệnh thanh toán đi thủ công
**Phiên bản:** 1.0 (MVP)
**Ngày tạo:** 2026-05-19
**Người soạn:** BA Agent
**Trạng thái:** Đang chờ duyệt G1

---

## 1. Mục tiêu Nghiệp vụ (Business Goal)

Cho phép nghiệp vụ viên Kho Bạc Nhà Nước (KBNN) **lập, kiểm soát, phê duyệt và quản lý** Lệnh thanh toán đi thủ công (Payment Order — Manual) trên nền tảng VDBAS, đảm bảo:

- Tuân thủ quy trình kiểm soát **Maker — Checker — Approver** (BIZ-001).
- Toàn bộ thao tác có **audit log** đầy đủ (BIZ-007, BIZ-008).
- Số liệu lệnh thanh toán làm cơ sở chuyển sang phân hệ **GL (Oracle EBS)** ở giai đoạn sau.

---

## 2. IN SCOPE — Phạm vi MVP

### 2.1. CRUD cơ bản

| #   | Chức năng           | Mã chức năng              | Mô tả                                                                                                                                                                      |
| --- | ------------------- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Tạo mới (Create)    | `PAY.OUT.MANUAL.NEW`      | Maker mở form Thêm mới → nhập đủ trường ở 4 tab (Thông tin chung, Khoản mục, Người chuyển, Người nhận) → **Lưu nháp** (DRAFT) hoặc **Gửi kiểm soát** (READY_FOR_APPROVAL). |
| 2   | Xem chi tiết (Read) | `PAY.OUT.MANUAL.VIEW`     | Mở form read-only; bao gồm Tab Đính kèm, Tab Lịch sử, Tab Trạng thái phê duyệt.                                                                                            |
| 3   | Sửa (Update)        | `PAY.OUT.MANUAL.EDIT`     | Chỉ Maker gốc, chỉ trên bản ghi DRAFT/RETURNED_TO_MAKER, có **optimistic lock** (F-VER).                                                                                   |
| 4   | Xoá (Delete)        | `PAY.OUT.MANUAL.DELETE`   | **Soft-delete**, nhập lý do ≥ 10 ký tự + tick checkbox xác nhận.                                                                                                           |
| 5   | Sao chép (Copy)     | `PAY.OUT.MANUAL.NEW.COPY` | Tạo lệnh mới từ lệnh có sẵn; F-ID mới, F-STATUS=DRAFT.                                                                                                                     |
| 6   | Danh sách (List)    | `PAY.OUT.MANUAL.LIST`     | Tra cứu theo nhiều tiêu chí, phân trang, sort, hiển thị tổng.                                                                                                              |

### 2.2. Workflow Maker — Checker — Approver

- **Maker**: Tạo / Lưu / Sửa / Xoá / Submit (DRAFT → READY_FOR_APPROVAL).
- **Checker**: Phê duyệt (READY_FOR_APPROVAL → PENDING_APPROVER), Trả lại (→ RETURNED_TO_MAKER), Từ chối (→ REJECTED).
- **Approver**: Phê duyệt cuối (PENDING_APPROVER → APPROVED), Trả lại, Từ chối.
- **Notification** in-app + email cho user kế tiếp ở mỗi lần chuyển trạng thái (BIZ-009).

### 2.3. State Machine (Trạng thái) áp dụng cho MVP

`Start` → `DRAFT` → `READY_FOR_APPROVAL` → `PENDING_APPROVER` → `APPROVED` → `End`

Cộng với các nhánh: `RETURNED_TO_MAKER`, `REJECTED`, `DELETED` (soft-delete).

> **Ghi chú**: Trạng thái `TRANSFERRED_TO_GL` và `POSTED` thuộc downstream (hạch toán GL) **sẽ chỉ được mock-hiển thị** trong MVP để kiểm tra UI nhưng KHÔNG implement integration thực sự với Oracle EBS (xem mục 4 — Out of Scope).

### 2.4. Validation & Quy tắc nghiệp vụ

- Tất cả 19 quy tắc kiểm tra dữ liệu (VAL-01 → VAL-19) — bao gồm CCID Cross-Validation Rule cho COA.
- 10 quy tắc nghiệp vụ (BIZ-001 → BIZ-010).
- 29 message code (MSG-ERR-_, MSG-OK-_, MSG-WRN-_, MSG-CFM-_, MSG-INF-\*).

### 2.5. Đính kèm tài liệu (Attachments)

- Upload / Download / Xoá file đính kèm.
- Giới hạn: ≤ 10MB/file, định dạng `pdf/jpg/png/docx/xlsx`; tổng ≤ 50MB/bản ghi.
- Tính hash SHA-256, virus scan trước khi lưu.

### 2.6. Audit Log & Lịch sử

- Mọi thao tác ghi audit: user, timestamp, IP, action, oldValue→newValue (BIZ-007).
- Tab Lịch sử giao dịch hiển thị `CREATED_BY`, `CREATED_DATE`, `LAST_UPDATED_BY`, `LAST_UPDATED_DATE`.
- Tab Trạng thái phê duyệt hiển thị workflow Maker → Checker → Approver, highlight bước hiện tại.

### 2.7. Xuất dữ liệu (Export)

- Export Excel / PDF / CSV danh sách lệnh.
- Sync nếu < 50.000 bản ghi, async (kèm notification) nếu vượt.
- Tuỳ chọn: phạm vi, trường xuất, mã hoá file, watermark (PDF), tên file.

### 2.8. In phiếu (Print)

- Sinh PDF preview theo template; A4/A5/Letter; Portrait/Landscape.
- Loại bản: Nháp (watermark "DRAFT") / Bản chính / Bản sao.
- Tuỳ chọn kèm: đính kèm, lịch sử phê duyệt.

### 2.9. Tra cứu danh mục (Lookup popup)

- Lookup chung cho: BANK, USER, DVQHNS, COA, CURRENCY, EXPENSE.
- Hỗ trợ phím tắt `F4`, single/multi-select.

### 2.10. Phím tắt (Keyboard Shortcuts)

Đầy đủ các nhóm theo §C3:

- Soạn thảo (Maker): `Ctrl+N`, `Ctrl+S`, `Ctrl+Shift+S`, `Ctrl+Enter`/`F9`, `Esc`, `Ctrl+Shift+C`.
- Thao tác LIST: `F2`, `F3`, `Delete`, `F5`, `Ctrl+Shift+E`, `Ctrl+P`.
- Lookup: `F4`.
- Phê duyệt: `F8`, `F9`, `Alt+B`, `Alt+J`.
- Đính kèm: `Ctrl+U`, `Ctrl+J`, `Shift+Delete`.

### 2.11. Bảo mật & Phân quyền

- RBAC theo 4 vai trò: Maker, Checker, Approver, Viewer.
- Separation of Duties (SoD): Maker ≠ Checker ≠ Approver (BIZ-001).
- Masking trường nhạy cảm (CMND/CCCD, số TK) cho user không có quyền `VIEW_PII`.
- Chống XSS, SQL Injection.

---

## 3. Điều kiện Tiên quyết (Preconditions)

| STT | Điều kiện                                                                                                                                                                                    | Phụ thuộc                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| 1   | NSD đã đăng nhập VDBAS (SSO/MFA)                                                                                                                                                             | Nền tảng Quản trị dùng chung — Xác thực tập trung |
| 2   | NSD có vai trò được cấu hình (Maker/Checker/Approver/Viewer)                                                                                                                                 | Hệ thống phân quyền RBAC                          |
| 3   | Master Data đã cấu hình đầy đủ: `LOV.01` (Channel), `LOV.02` (Bank), `LOV.03` (Branch/KBNN), `LOV.04` (Currency), `LOV.05` (Expense), `LOV.06` (Payment Type), `LOV.07.1..12` (COA Segments) | Phân hệ Quản lý Danh mục                          |
| 4   | Cấu hình CCID (Cross-Validation Rules) cho tổ hợp COA Segment đã sẵn sàng                                                                                                                    | Phân hệ GL Setup                                  |
| 5   | Kỳ kế toán hiện tại đang **OPEN** (chấp nhận giao dịch mới)                                                                                                                                  | Phân hệ GL — Period Control                       |
| 6   | Cấu hình hạn mức (limit) theo user/đơn vị/sản phẩm có sẵn — phục vụ VAL-12                                                                                                                   | Phân hệ cấu hình hạn mức                          |
| 7   | (Trường hợp Sửa/Xoá) Bản ghi tồn tại và đang ở DRAFT hoặc RETURNED_TO_MAKER, và NSD là Maker gốc                                                                                             | Dữ liệu nội bộ tính năng                          |
| 8   | Hệ thống Notification (in-app + email) đang hoạt động                                                                                                                                        | Phân hệ Notification                              |

---

## 4. OUT OF SCOPE — Không làm trong MVP

Các hạng mục sau **được nhắc đến trong spec nhưng KHÔNG implement trong MVP**. Sẽ được lên kế hoạch ở các Sprint kế tiếp:

### 4.1. Tích hợp downstream

| #   | Hạng mục                                                                                                  | Lý do tạm hoãn                                                                          |
| --- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| 1   | Integration thực sự với **Oracle EBS GL** (chuyển trạng thái `APPROVED` → `TRANSFERRED_TO_GL` → `POSTED`) | Cần khảo sát API/IBM MQ trục tích hợp, vượt phạm vi MVP. MVP chỉ mock 2 trạng thái này. |
| 2   | Hold balance / Release hold trên **TK kế toán nguồn** (mentioned ở A3, A11)                               | Phụ thuộc module GL — Account Balance, chưa có trong MVP.                               |
| 3   | Trigger downstream business flow sau APPROVED (chuyển sang phân hệ Quản lý Chi/Hạch toán)                 | Phụ thuộc các phân hệ chưa có.                                                          |

### 4.2. Tính năng nâng cao

| #   | Hạng mục                                                                                            | Lý do tạm hoãn                                                                                       |
| --- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 4   | Khôi phục bản ghi DELETED (Restore) — chỉ Quản trị (§A11 mục 20)                                    | Tính năng Admin nâng cao, chưa thuộc role MVP.                                                       |
| 5   | Ký số (Digital Signature) / OTP cho giao dịch trọng yếu (§C2 mục 6)                                 | Phụ thuộc giải pháp PKI/MFA, sẽ làm sau khi có hạ tầng.                                              |
| 6   | **Concurrent edit lock** (pessimistic) — chặn user B mở form khi user A đang sửa (§A6 E11, TC 3.05) | MVP chỉ implement **optimistic lock** (F-VER). Pessimistic lock cần distributed lock infrastructure. |
| 7   | Quét virus file đính kèm (VAL-09)                                                                   | Phụ thuộc dịch vụ AV centralized, MVP chỉ validate kích thước + định dạng + magic byte.              |
| 8   | Lưu/áp dụng **bộ lọc cá nhân** (user-scope filter preset) trên LIST                                 | Tính năng tiện ích, có thể bổ sung sau.                                                              |
| 9   | Async export khi > 50.000 bản ghi (notification khi xong)                                           | MVP giới hạn dataset, chỉ làm sync export.                                                           |
| 10  | Export trường nhạy cảm với quyền `EXPORT_PII`                                                       | Phụ thuộc cấu hình quyền PII chi tiết, MVP mask mặc định.                                            |
| 11  | Hỗ trợ song ngữ (Tiếng Anh) cho UI/print/export                                                     | MVP chỉ Tiếng Việt; field `LANGUAGE` chỉ làm placeholder.                                            |
| 12  | Cảnh báo trùng giao dịch trong N phút (VAL-18)                                                      | Logic phức tạp, phụ thuộc dữ liệu lịch sử lớn, chuyển sang Phase 2.                                  |
| 13  | Cảnh báo ngoài giờ giao dịch (VAL-08 phần "ngoài giờ giao dịch → cảnh báo")                         | Phụ thuộc cấu hình giờ giao dịch, MVP chỉ check kỳ kế toán.                                          |

### 4.3. Báo cáo / Dashboard

| #   | Hạng mục                                               | Lý do tạm hoãn                                        |
| --- | ------------------------------------------------------ | ----------------------------------------------------- |
| 14  | Báo cáo tổng hợp lệnh thanh toán theo kỳ/đơn vị/kênh   | Thuộc Hệ thống báo cáo & kho dữ liệu (phân hệ riêng). |
| 15  | Dashboard real-time số lệnh PENDING/APPROVED theo ngày | Phase 2.                                              |

---

## 5. Actors — Các Vai trò Người dùng

| Vai trò                                  | Mã quyền             | Trách nhiệm chính                                                                                                           | Quyền thao tác                                                                                                                                |
| ---------------------------------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Maker** (Người lập)                    | `PAY_OUT_MAKER`      | Lập lệnh thanh toán theo nghiệp vụ phát sinh; chịu trách nhiệm về tính chính xác dữ liệu đầu vào.                           | Tạo mới / Sửa / Xoá (chỉ bản ghi của mình ở DRAFT/RETURNED_TO_MAKER) / Submit / Sao chép / Xem / Export / In. Upload/Download/Xoá attachment. |
| **Checker** (Người kiểm soát)            | `PAY_OUT_CHECKER`    | Kiểm soát tính hợp lệ về nghiệp vụ trước khi chuyển Approver.                                                               | Xem tất cả lệnh đơn vị mình phụ trách / Phê duyệt cấp 1 (READY_FOR_APPROVAL → PENDING_APPROVER) / Trả lại Maker / Từ chối. Không Sửa/Xoá/Tạo. |
| **Approver** (Người phê duyệt)           | `PAY_OUT_APPROVER`   | Phê duyệt cuối cùng, chịu trách nhiệm pháp lý về lệnh thanh toán đã được chấp thuận.                                        | Xem / Phê duyệt cuối (PENDING_APPROVER → APPROVED) / Trả lại Maker / Từ chối. Không Sửa/Xoá/Tạo.                                              |
| **Viewer** (Người tra cứu)               | `PAY_OUT_VIEWER`     | Tra cứu, theo dõi tình hình thanh toán (Lãnh đạo, kiểm toán nội bộ, kế toán trưởng…).                                       | Chỉ Xem / Export / In. Không thao tác trạng thái.                                                                                             |
| **Supervisor** (Giám sát — tuỳ chọn MVP) | `PAY_OUT_SUPERVISOR` | (Optional) Vai trò bao quát cấp đơn vị, có khả năng đảm nhận tạm thời vai trò Approver theo phân cấp / xem báo cáo hồi cứu. | Xem toàn bộ + Export. **Quyền phê duyệt cấp cao hơn khi vượt hạn mức (BIZ-010, VAL-12)** sẽ map vào vai trò này.                              |

> **Ràng buộc Separation of Duties (SoD) — BIZ-001**: Trong cùng một bản ghi, ba vai trò Maker / Checker / Approver **bắt buộc là 3 user khác nhau và 3 vai trò khác nhau**. Hệ thống chặn nếu vi phạm.

---

## 6. Ràng buộc Chung (Cross-cutting Constraints)

| STT | Ràng buộc                                                                                           | Tham chiếu |
| --- | --------------------------------------------------------------------------------------------------- | ---------- |
| 1   | Mọi field ENG dùng `UPPER_SNAKE_CASE` đồng bộ UI/DB/API.                                            | §B4        |
| 2   | Timezone hệ thống: `Asia/Ho_Chi_Minh`; định dạng date `dd/mm/yyyy`, datetime `dd/mm/yyyy HH:mm:ss`. | §B4        |
| 3   | Tiền tệ: hiển thị nhóm hàng nghìn `#,##0.00`, căn phải; tổng tách theo loại tiền.                   | §B4        |
| 4   | Mọi COA segment dùng popup Lookup chung và tuân thủ CCID.                                           | §B4        |
| 5   | Audit log bắt buộc cho mọi thao tác thành công.                                                     | BIZ-007    |
| 6   | Optimistic lock bằng `F-VER` (mỗi lần update → +1).                                                 | VAL-15     |
| 7   | Soft-delete: bản ghi DELETED vẫn truy được qua audit/history.                                       | BIZ-003    |
| 8   | Chống double-submit phía client (disable nút) + idempotency key phía server.                        | §C2 mục 8  |

---

## 7. Tiêu chí Hoàn thành MVP (Definition of Done)

- [ ] Toàn bộ 6 chức năng CRUD + Submit + Approve workflow vận hành end-to-end với 4 vai trò.
- [ ] 14 testcase nhóm 1 (Tạo mới), 5 testcase nhóm 2 (Xem), 7 testcase nhóm 3 (Cập nhật), 6 testcase nhóm 4 (Xoá) đều PASS theo §D.
- [ ] Audit log hoạt động đầy đủ; mỗi thao tác có entry.
- [ ] Notification in-app gửi đúng user kế tiếp ở mỗi chuyển trạng thái (email có thể stub trong MVP).
- [ ] UI tuân thủ `VDBAS_UIUX_Rule.md`; có đầy đủ phím tắt theo §C3.
- [ ] Export Excel/PDF/CSV sync hoạt động.
- [ ] In phiếu PDF preview hoạt động.

---

## Lịch sử Sửa đổi

- **2026-05-19** | **BA Agent** | FT-001 | Tạo file scope ban đầu, xác định IN/OUT scope MVP, preconditions, actors.
