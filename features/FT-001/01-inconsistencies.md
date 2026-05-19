# 01 — Inconsistencies / Gaps / Ambiguities: FT-001

Tài liệu này liệt kê **tất cả các điểm mâu thuẫn (Contradictions), thiếu sót (Gaps), và điểm chưa rõ (Ambiguities)** phát hiện được trong quá trình phân tích spec `PAY.OUT.MANUAL.CRUD_spec_function.md`.

Mỗi mục được phân loại và đề xuất hướng xử lý. Các mục có nhãn `[NEEDS CLARIFICATION]` cần đợi xác nhận từ Product Owner / chuyên gia nghiệp vụ KBNN trước khi đóng.

**Mã tính năng:** FT-001
**Ngày tạo:** 2026-05-19
**Người soạn:** BA Agent

---

## 1. Mâu thuẫn (Contradictions)

### INC-C-01. Loại tệp đính kèm — `docx` vs `xlsx`

| Mục             | Nội dung                                                                                                                                                                      |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | §A4 bước 3 ("pdf/jpg/png/docx"), VAL-09 ("pdf/jpg/png/docx"), BIZ-005 ("pdf/jpg/png/docx") **vs.** §B1.5 ("pdf/jpg/png/docx/xlsx"), §B3.3 FILE_BLOB ("pdf/jpg/png/docx/xlsx") |
| **Vấn đề**      | Hai chỗ liệt kê khác nhau: có chỗ có `xlsx`, có chỗ không.                                                                                                                    |
| **Đề xuất**     | Thống nhất theo §B3.3 (chi tiết hơn): chấp nhận `pdf/jpg/png/docx/xlsx`. Cập nhật VAL-09 và BIZ-005.                                                                          |

### INC-C-02. Sự kiện submit — `PAY.OUT.MANUAL.NEW.SUBMIT` áp dụng cho cả EDIT?

| Mục             | Nội dung                                                                                                                                                                           |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | §A11 mục 5 — Maker Submit dùng event `PAY.OUT.MANUAL.NEW.SUBMIT` cho cả khi sửa từ DRAFT/RETURNED_TO_MAKER. §C1 button "Gửi kiểm soát" cũng dùng `PAY.OUT.MANUAL.NEW.SUBMIT`.      |
| **Vấn đề**      | Event ID tên là `.NEW.SUBMIT` nhưng spec dùng cho cả EDIT flow → tên gây hiểu nhầm.                                                                                                |
| **Đề xuất**     | Đổi thành `PAY.OUT.MANUAL.SUBMIT` (bỏ phần `.NEW`) để phản ánh đúng cả flow tạo mới và chỉnh sửa. Hoặc bổ sung event `PAY.OUT.MANUAL.EDIT.SUBMIT` riêng. **[NEEDS CLARIFICATION]** |

### INC-C-03. `LOV.06.Payment_Type_Code` — mã code vs. giá trị nghiệp vụ

| Mục             | Nội dung                                                                                                                                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | Field `LNH_TRANSACTION_TYPE` (§B1.1) liệt kê giá trị `"Lệnh chuyển Có GT thấp/cao", "Lệnh chuyển Nợ GT thấp/cao"` (4 giá trị). **Phụ lục LOV.06** liệt kê: `LTT01 Lệnh chuyển Nợ GT thấp / LTT02 GT cao / LTT03 Lệnh chuyển Có GT thấp / LTT04 GT cao`. |
| **Vấn đề**      | Thứ tự / tên code không đồng bộ với mô tả nghiệp vụ ở field (mô tả ghi "Có" trước "Nợ" nhưng code LTT01 lại là "Nợ").                                                                                                                                   |
| **Đề xuất**     | Thống nhất theo bảng LOV.06 (LTT01..LTT04). UI hiển thị tên đầy đủ, lưu DB là code.                                                                                                                                                                     |

### INC-C-04. Format date — `dd/MM/yyyy` vs. `dd/mm/yyyy`

| Mục             | Nội dung                                                                                                                                                    |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | VAL-02 ghi `dd/MM/yyyy [HH:mm:ss]` (chuẩn Java). §B1.1 CREATED_DATE ghi `dd/mm/yyyy hh:MM:ss`. §B2.2 ghi `dd/mm/yyyy hh:MM`. §B4 ghi `dd/mm/yyyy hh:MM:ss`. |
| **Vấn đề**      | Trong chuẩn format: `MM` = tháng, `mm` = phút; `hh` = giờ 12h, `HH` = giờ 24h. Spec dùng lẫn lộn `mm`/`MM` cho tháng và `hh`/`HH` cho giờ.                  |
| **Đề xuất**     | Chuẩn hoá theo Java DateTimeFormatter: `dd/MM/yyyy HH:mm:ss` cho datetime (24h), `dd/MM/yyyy` cho date. Cập nhật toàn bộ spec.                              |

### INC-C-05. `RECEIVER` — TextBox hay Lookup?

| Mục             | Nội dung                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------- | -------- | ---------------------------------------------------------------------- | -------- | ----------------------------------------------- |
| **Vị trí spec** | §B1.1: "NH/KB nhận                                                                                 | RECEIVER | TextBox" và mô tả tự hiển thị/cho sửa với LNH/TTSP. §B2.1: "NH/KB nhận | RECEIVER | TextBox + Lookup `PAY.OUT.MANUAL.LOOKUP.BANK`". |
| **Vấn đề**      | Form Detail (NEW/VIEW/EDIT) gọi là TextBox nhưng filter trên LIST có Lookup.                       |
| **Đề xuất**     | Form Detail nên cũng là `TextBox + Lookup` khi cho phép sửa (lệnh TTSP). Đồng bộ hành vi với LIST. |

### INC-C-06. State Machine — Trạng thái sau khi Checker phê duyệt

| Mục             | Nội dung                                                                                                                                                                                                                                                                                                                             |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Vị trí spec** | §A5 mục A5: "Checker bấm Phê duyệt → chuyển Approver. Cập nhật trạng thái PENDING_APPROVER". §A11 mục 7 cũng vậy. **NHƯNG** §B2.2 cột "Trạng thái" liệt kê các badge màu chỉ bao gồm: APPROVED / PENDING_APPROVER / READY_FOR_APPROVAL / DRAFT / REJECTED / RETURNED_TO_MAKER. **Không có** badge cho `TRANSFERRED_TO_GL`, `POSTED`. |
| **Vấn đề**      | LIST không hiển thị màu cho 2 trạng thái downstream → có thể là thiếu sót, hoặc 2 trạng thái này bị ẩn khỏi LIST.                                                                                                                                                                                                                    |
| **Đề xuất**     | Vì MVP out-of-scope tích hợp GL nên bỏ qua. Document rõ trong scope là `TRANSFERRED_TO_GL`/`POSTED` không xuất hiện ở MVP.                                                                                                                                                                                                           |

### INC-C-07. `DELETE_REASON` — Tối thiểu/tối đa ký tự

| Mục             | Nội dung                                                                                                                                       |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | §A4 bước 9 ("Lý do ≥ 10 ký tự"). VAL-16 ("≥ 10 ký tự"). BIZ-006 ("≥ 10 ký tự và ≤ 500 ký tự"). §B3.1 ("Tối thiểu 10 ký tự, tối đa 500 ký tự"). |
| **Vấn đề**      | A4/VAL-16 không nhắc giới hạn trên. Mâu thuẫn nhẹ về độ chi tiết.                                                                              |
| **Đề xuất**     | Thống nhất theo BIZ-006 + B3.1: **min 10, max 500 ký tự**. Cập nhật VAL-16.                                                                    |

### INC-C-08. Tab Đính kèm — Inline hay Popup?

| Mục             | Nội dung                                                                                                                                                                                           |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | §A12 mục 3: VIEW gồm "[Tab] Đính kèm". §B1.5: "Khi click vào Tab này sẽ liên kết đến `PAY.OUT.MANUAL.ATTACH`". §A12 mục 7: "`PAY.OUT.MANUAL.ATTACH` — Popup quản lý đính kèm".                     |
| **Vấn đề**      | Tab hay popup? "Click tab → mở popup" là pattern lạ.                                                                                                                                               |
| **Đề xuất**     | Làm rõ: Tab Đính kèm sẽ hiển thị **inline danh sách file**, các thao tác "Upload/Xoá/Tải xuống" mở popup chi tiết. Hoặc giữ nguyên popup nhưng đổi từ "Tab" thành "Nút". **[NEEDS CLARIFICATION]** |

---

## 2. Thiếu sót (Gaps)

### INC-G-01. Trường `F-ID`, `F-VER`, `F-STATUS`, `F-AUDIT` — chưa định nghĩa cụ thể

| Mục         | Nội dung                                                                                                                                                                                                                                                                                                                                                |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | Spec dùng các tên `F-ID`, `F-VER`, `F-STATUS`, `F-AUDIT` ở §A4, §A11 nhưng **chưa định nghĩa rõ cấu trúc**: kiểu dữ liệu, độ dài, format. `F-ID` là số tự tăng hay UUID hay chuỗi có ý nghĩa nghiệp vụ? `F-AUDIT` chứa gì cụ thể (object hay reference)?                                                                                                |
| **Đề xuất** | SA cần định nghĩa cụ thể trong design schema. Đề xuất BA: `F-ID = BIGINT auto-increment` hoặc `VARCHAR(20)` theo pattern (vd `POM-YYYYMMDD-XXXXX`); `F-VER = INT default 1`; `F-STATUS = VARCHAR(30) ENUM`; `F-AUDIT` = các cột rời `CREATED_BY/CREATED_DATE/LAST_UPDATED_BY/LAST_UPDATED_DATE/CREATED_IP/UPDATED_IP`. **[NEEDS CLARIFICATION với SA]** |

### INC-G-02. `REF_NO` — Hệ thống sinh tự động hay user nhập?

| Mục         | Nội dung                                                                                                                                                                                                                                                                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | §B1.1: `REF_NO` = "Bắt buộc nhập". **Nhưng** §A4 bước 1 nói "Sinh ID của giao dịch", và VAL-11 nói "mã giao dịch / số chứng từ duy nhất". Chưa rõ là user nhập tự do hay hệ thống sinh?                                                                                     |
| **Đề xuất** | Đề xuất 2 phương án — **[NEEDS CLARIFICATION]**:<br>(a) `REF_NO` do user nhập, bắt buộc unique trong phạm vi (đơn vị + kỳ + loại); hoặc<br>(b) Hệ thống sinh theo pattern (vd: `<MaKBNN>-YYYYMM-<seq>`), user không nhập.<br>Khuyến nghị **(b)** để tránh sai sót thủ công. |

### INC-G-03. Trường lý do trả lại / từ chối — không có field code

| Mục         | Nội dung                                                                                                                                                                                  |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | Spec đề cập Checker/Approver phải nhập "Lý do ≥ 10 ký tự" khi Return/Reject (§A11, BIZ-006). Nhưng **không có field nào** trong B1.x định nghĩa trường `RETURN_REASON` / `REJECT_REASON`. |
| **Đề xuất** | Bổ sung 2 trường tại form Approval popup: `RETURN_REASON` và `REJECT_REASON`, kiểu TextArea, min 10 max 500, bắt buộc khi tương ứng action được thực hiện.                                |

### INC-G-04. Số lượng file đính kèm tối đa per record (`N`)

| Mục         | Nội dung                                                                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | BIZ-005 nói "tối đa N file/bản ghi" — nhưng N chưa định nghĩa. §B3.3 footer ghi "Tổng dung lượng: X MB (giới hạn tổng ≤ 50MB/bản ghi)" — chỉ giới hạn tổng. |
| **Đề xuất** | Đề xuất giới hạn **N = 10 file/bản ghi**, tổng ≤ 50MB. Cập nhật BIZ-005. **[NEEDS CLARIFICATION]**                                                          |

### INC-G-05. Hạn mức (Limit) — định nghĩa cấu hình ở đâu?

| Mục         | Nội dung                                                                                                                                                                                                                  |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | VAL-12, BIZ-010 đề cập "hạn mức theo user/đơn vị/sản phẩm" nhưng spec không định nghĩa cấu hình hạn mức ở đâu, ai cấu hình, granularity thế nào (theo loại lệnh? theo channel? theo currency?).                           |
| **Đề xuất** | Cần module cấu hình riêng — out of scope MVP nếu xem là feature độc lập, hoặc cần SA tạo simple table `PAY_OUT_LIMIT` (user_id, dept_id, limit_amount, currency, effective_from, effective_to). **[NEEDS CLARIFICATION]** |

### INC-G-06. Phân quyền chi tiết — chưa định nghĩa permission code

| Mục         | Nội dung                                                                                                                                                                                                                                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | Spec nói "vai trò Maker/Checker/Approver/Viewer" và đề cập quyền `VIEW_PII`, `EXPORT_PII` (§B4 mục 8, §B3.7 mục 522). Nhưng chưa định nghĩa **danh sách đầy đủ permission code**.                                                                                                                                   |
| **Đề xuất** | BA + SA định nghĩa permission code list cho FT-001 (đề xuất tối thiểu):<br>- `PAY.OUT.MANUAL.CREATE`, `.READ`, `.UPDATE`, `.DELETE`<br>- `PAY.OUT.MANUAL.SUBMIT`<br>- `PAY.OUT.MANUAL.CHECK`, `.APPROVE`, `.RETURN`, `.REJECT`<br>- `PAY.OUT.MANUAL.EXPORT`, `.PRINT`<br>- `PAY.OUT.MANUAL.VIEW_PII`, `.EXPORT_PII` |

### INC-G-07. Notification — kênh chi tiết, template, retry policy

| Mục         | Nội dung                                                                                                                                                                                                                                                                   |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | BIZ-009 nói "in-app + email". Không có chi tiết: SMS? template nội dung? retry khi gửi thất bại?                                                                                                                                                                           |
| **Đề xuất** | MVP: chỉ làm **in-app** đầy đủ + **email stub** (log lại, không thực gửi nếu hạ tầng email chưa sẵn sàng). SMS out of scope. Template cứng cho 4 sự kiện: Submit / Approved-Checker / Approved-Approver / Returned / Rejected. **[NEEDS CLARIFICATION với Project Owner]** |

### INC-G-08. Tolerance cho mismatch tổng tiền

| Mục         | Nội dung                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | VAL-07 nói "chênh lệch > tolerance → chặn Submit". MSG-WRN-AMOUNT-MISMATCH nói "trong ngưỡng tolerance". Nhưng tolerance là bao nhiêu?              |
| **Đề xuất** | Vì là tiền — đề xuất **tolerance = 0** (so khớp tuyệt đối). Hoặc nếu cần cho phép sai số làm tròn → tolerance = 0.01 VND. **[NEEDS CLARIFICATION]** |

### INC-G-09. `EXCHANGE_RATE` — Lấy từ đâu khi loại tiền là ngoại tệ?

| Mục         | Nội dung                                                                                                                                                 |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | Field EXCHANGE_RATE bắt buộc khi Loại tiền ≠ VND. Nhưng spec không nói tỉ giá lấy từ đâu — user nhập tự do hay hệ thống lấy từ NHNN/internal rate table? |
| **Đề xuất** | MVP: cho user nhập tay (validate > 0). Phase 2: tích hợp tỉ giá NHNN tự động. **[NEEDS CLARIFICATION]**                                                  |

### INC-G-10. Hành vi khi field cha thay đổi — cascading

| Mục         | Nội dung                                                                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | VAL-06 nói "cascading: khi trường cha thay đổi → reset/refresh dropdown trường con". Nhưng chi tiết về reset (clear giá trị?) hay refresh (giữ nếu vẫn hợp lệ?) chưa rõ.        |
| **Đề xuất** | Quy tắc: nếu giá trị con vẫn nằm trong danh mục con (sau cascade) → giữ; nếu không → clear + warning "Giá trị `<Tên trường con>` đã được reset do thay đổi `<Tên trường cha>`". |

### INC-G-11. Trường `CHECKED_BY`, `APPROVED_BY` — chưa có trong B1.x

| Mục         | Nội dung                                                                                                                                          |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | §B2.1 / §B2.2 và D-Testcase đề cập `CHECKED_BY`, `APPROVED_BY` ở LIST/filter. Nhưng B1.x (form NEW/EDIT/VIEW) **không định nghĩa** các field này. |
| **Đề xuất** | Bổ sung vào schema (tự động set khi Checker/Approver thực hiện action), hiển thị ở Tab Trạng thái phê duyệt + Tab Lịch sử trong VIEW.             |

### INC-G-12. `F-VER` validation — chính sách lock khi mở Edit

| Mục            | Nội dung                                                                                                                                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**     | §A10 event 27 "LOCK.ACQUIRE — Lấy lock khi mở Sửa; release khi đóng/lưu" gợi ý có **pessimistic lock**. §A6 E11 "Concurrent edit (record đang bị lock)" cũng. **NHƯNG** VAL-15 lại nói optimistic lock theo F-VER.                                |
| **Vấn đề con** | MVP làm gì: optimistic (light, dễ implement) hay pessimistic (cần distributed lock)?                                                                                                                                                              |
| **Đề xuất**    | MVP làm **optimistic lock** (VAL-15, F-VER). Pessimistic lock + Event LOCK.ACQUIRE/CONFLICT là out of scope MVP. TC 3.05 (concurrent edit) sẽ test bằng cách 2 user cùng submit → user sau nhận MSG-ERR-LOCK (chứ không phải MSG-ERR-CONCURRENT). |

### INC-G-13. `PAYMENT_DATE` mặc định = ngày hiện tại, **không cho sửa**

| Mục         | Nội dung                                                                                                                                                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | §B1.1: "Tự hiển thị ngày hiện tại, không cho phép sửa". **NHƯNG** TC.1.05 lại có scenario "Nhập PAYMENT_DATE = 01/01/2024" → mâu thuẫn (nếu không cho sửa thì làm sao nhập sai?).                                                     |
| **Đề xuất** | Hoặc:<br>(a) Cho sửa, validate phải nằm trong kỳ kế toán OPEN (giữ TC.1.05).<br>(b) Không cho sửa → bỏ TC.1.05.<br>Đề xuất **(a)** vì TC đã định nghĩa và nhu cầu nghiệp vụ thường cần backdating trong kỳ. **[NEEDS CLARIFICATION]** |

### INC-G-14. Restore bản ghi DELETED — quy trình chi tiết

| Mục         | Nội dung                                                                                                                                            |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | §A11 mục 20 đề cập "Khôi phục bản ghi đã xoá: DELETED → DRAFT; chỉ Quản trị". Nhưng không có UI/event/permission/audit detail nào cho thao tác này. |
| **Đề xuất** | Out of scope MVP (theo file 00-scope.md). Đánh dấu rõ để Phase 2 cover.                                                                             |

### INC-G-15. Audit log — schema / retention

| Mục         | Nội dung                                                                                                                                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | BIZ-007 yêu cầu "audit đầy đủ" nhưng không định nghĩa schema cụ thể, không nói retention (giữ bao lâu).                                                                                                                                |
| **Đề xuất** | SA định nghĩa bảng `audit_log` (id, action, entity, entity_id, user_id, ip, timestamp, old_value JSON, new_value JSON, trace_id). Retention: ≥ 7 năm (theo quy định kế toán/kiểm toán). **[NEEDS CLARIFICATION với tuân thủ pháp lý]** |

### INC-G-16. Phân loại lệnh "Liên kho bạc" — Order Type bị disable

| Mục            | Nội dung                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**     | LOV.01 ghi "Liên kho bạc                                                                    | –   | Không có loại kênh ⇒ Khi chọn Kênh = Liên kho bạc thì trường Loại lệnh sẽ mờ, không cho phép nhập/chọn". Nhưng **B1.1 ORDER_TYPE marked = Bắt buộc Y**. |
| **Vấn đề con** | Nếu Channel=Liên kho bạc thì ORDER_TYPE = null hợp lệ, vi phạm Y.                           |
| **Đề xuất**    | Đổi ORDER_TYPE thành `C` (conditional): Bắt buộc khi Channel ≠ Liên kho bạc. Cập nhật B1.1. |

### INC-G-17. SoD — Phạm vi áp dụng

| Mục         | Nội dung                                                                                                                                                                                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | BIZ-001 nói "Maker–Checker–Approver bắt buộc; mỗi cấp khác user và khác vai trò". Câu "khác vai trò" hơi mơ hồ — vai trò ở đây là gì? Một user có thể có nhiều role; nếu user A có role Maker + Checker → có được duyệt lệnh do chính mình lập không?                                                |
| **Đề xuất** | Quy tắc rõ: **Action-based**, cùng một record, user thực hiện hai action khác nhau trong workflow phải là 2 user khác nhau, bất kể role assignment. Ví dụ: user A (có cả Maker và Checker role) lập lệnh → KHÔNG được tự kiểm soát lệnh đó. Server kiểm tra `created_by ≠ checked_by ≠ approved_by`. |

### INC-G-18. Permission khi Submit — VAL-13/14 vs BIZ-001

| Mục         | Nội dung                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | VAL-13/14 nói chỉ Maker gốc Submit. **Nhưng** nếu Maker gốc đi vắng, ai có thể Submit thay? Spec không nói. |
| **Đề xuất** | MVP: nghiêm ngặt — chỉ Maker gốc. Phase 2: cơ chế delegation hoặc Supervisor có thể submit thay.            |

---

## 3. Điểm chưa rõ (Ambiguities)

### INC-A-01. "Ngày làm việc hiện tại" — định nghĩa

| Mục             | Nội dung                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | §B1.1 CREATED_DATE: "Tự động hiển thị thời gian ngày làm việc hiện tại theo định dạng `dd/mm/yyyy hh:MM:ss`".                                                    |
| **Vấn đề**      | "Ngày làm việc" = business day (T+0) hay "thời điểm hiện tại của hệ thống"? Ở KBNN, "ngày làm việc" có thể có ngữ nghĩa riêng (loại trừ T7/CN/lễ).               |
| **Đề xuất**     | Đề xuất: CREATED_DATE = `NOW()` của hệ thống (timezone Asia/Ho_Chi_Minh). Nếu cần "business day" thì hệ thống cần thêm calendar table. **[NEEDS CLARIFICATION]** |

### INC-A-02. Quyền "Phê duyệt cấp cao hơn" khi vượt hạn mức

| Mục             | Nội dung                                                                                                                                                                                                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | E9, MSG-WRN-LIMIT, BIZ-010: "Vượt hạn mức → cần phê duyệt cấp cao hơn".                                                                                                                                                                                                      |
| **Vấn đề**      | "Cấp cao hơn" là Approver cấp 2? Supervisor? Có cấu hình phân cấp riêng?                                                                                                                                                                                                     |
| **Đề xuất**     | Vai trò Supervisor (đã thêm trong 00-scope.md) sẽ đảm nhận. Cần SA thiết kế thêm trạng thái `PENDING_SUPERVISOR` nếu thực sự cần workflow 4-cấp. **[NEEDS CLARIFICATION]** Hoặc đơn giản: cảnh báo + Approver thường vẫn duyệt được, nhưng audit ghi nhận flag "OVER_LIMIT". |

### INC-A-03. `LOV.07.4 Cấp NS` — không có giá trị mặc định, nhưng marked `C`

| Mục             | Nội dung                                                                                                  |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | §B1.2 GL_SEGMENT4: bắt buộc C, không có default. Các segment khác như 5,6,7,8,9,10,11,12 đều có default.  |
| **Vấn đề**      | Khi không bắt buộc, giá trị mặc định là gì? Spec không nói.                                               |
| **Đề xuất**     | Default `0` (1 ký tự, theo §LOV.07 ghi `1 ký tự`). Hoặc xác nhận với CCID rule. **[NEEDS CLARIFICATION]** |

### INC-A-04. `LOV.07.12 DP` — Varchar độ dài

| Mục             | Nội dung                           |
| --------------- | ---------------------------------- | ------------------------------------------------------------------------------------------- |
| **Vị trí spec** | §B1.2 GL_SEGMENT12: "00            | Varchar(3)" — default `00` (2 ký tự) nhưng kiểu Varchar(3). §LOV.07.12 ghi `001` (3 ký tự). |
| **Vấn đề**      | Default `00` không đủ 3 ký tự.     |
| **Đề xuất**     | Sửa default thành `000` (3 ký tự). |

### INC-A-05. Filter "Loại ngày lọc" — "Ngày kiểm soát", "Ngày phê duyệt"

| Mục             | Nội dung                                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | §B2.1 DATE_FIELD: "Ngày lập / Ngày thanh toán / Ngày kiểm soát / Ngày phê duyệt".                                   |
| **Vấn đề**      | "Ngày kiểm soát" và "Ngày phê duyệt" tương ứng field nào trong DB? Chưa được định nghĩa ở B1.x. Liên quan INC-G-11. |
| **Đề xuất**     | Bổ sung trường `CHECKED_DATE`, `APPROVED_DATE` (datetime) — auto-set khi action xảy ra.                             |

### INC-A-06. Multi-select Trạng thái — "ẩn DELETED trừ khi tick"

| Mục             | Nội dung                                                                                                                                                                         |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | §B2.1 F-STATUS: "Mặc định ẩn DELETED trừ khi tick chọn".                                                                                                                         |
| **Vấn đề**      | "Mặc định" = không hiển thị trong dropdown, hay hiển thị nhưng không chọn? UX cần rõ.                                                                                            |
| **Đề xuất**     | Hiển thị trong dropdown nhưng không tick mặc định. User chủ động tick để bao gồm bản ghi DELETED. Permission: chỉ user có role cao (Admin/Supervisor) mới thấy lựa chọn DELETED. |

### INC-A-07. UI khi "Số bản ghi vượt 50.000 → async"

| Mục             | Nội dung                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | §A5 A3, §B3.7 — async export nếu >50k.                                                                  |
| **Vấn đề**      | UX khi async: hiển thị progress bar? user phải đợi trên page hay được phép leave? notification qua đâu? |
| **Đề xuất**     | Out of scope MVP (đã chốt ở 00-scope.md). MVP cap data ở 50.000 dòng hoặc giới hạn ngày <= 90.          |

### INC-A-08. Phím tắt — xung đột trình duyệt

| Mục             | Nội dung                                                                                                                   |
| --------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | §C2 mục 11: "tránh xung đột với phím tắt trình duyệt (vd Ctrl+N → preventDefault khi focus trong form)".                   |
| **Vấn đề**      | `Ctrl+N` mặc định là "New Window" trong browser — preventDefault có thể không work trên một số browser/OS.                 |
| **Đề xuất**     | Document accept rằng `Ctrl+N` chỉ chặn được trong scope form đã focus. Có thể đưa thêm alternative shortcut (như `Alt+N`). |

### INC-A-09. Channel = "Liên kho bạc" — luồng nghiệp vụ chi tiết

| Mục             | Nội dung                                                                                                                                                                                                           |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Vị trí spec** | LOV.01: Liên kho bạc không có Order Type.                                                                                                                                                                          |
| **Vấn đề**      | Spec không mô tả chi tiết luồng nghiệp vụ Liên kho bạc khác Liên ngân hàng / TTSP thế nào (RECEIVER là KBNN khác? sender = KBNN hiện tại?).                                                                        |
| **Đề xuất**     | MVP có thể giới hạn implementation cho 2 channel chính (Liên ngân hàng, Thanh toán song phương). Liên kho bạc có thể chỉ làm UI cho phép chọn, validation dùng chung. **[NEEDS CLARIFICATION với nghiệp vụ KBNN]** |

### INC-A-10. "Phụ thuộc cấu hình" tại §B1.1 cho `LNH_TRANSACTION_TYPE`

| Mục             | Nội dung                                                                                                                                                                                     |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | "Nếu AMOUNT ≥ 500 triệu → mặc định 'Lệnh chuyển Có GT cao', không cho chọn loại GT thấp".                                                                                                    |
| **Vấn đề**      | Ngưỡng 500 triệu là cứng hay cấu hình? Loại tiền là VND hay quy đổi sang VND nếu là ngoại tệ?                                                                                                |
| **Đề xuất**     | Đề xuất: cấu hình hoá ngưỡng (table `payment_threshold_config`); MVP có thể hard-code 500 triệu VND. Loại tiền: nếu ngoại tệ → tự sang lệnh "GT thấp" (theo spec). **[NEEDS CLARIFICATION]** |

### INC-A-11. "Idempotency key" — chi tiết implementation

| Mục             | Nội dung                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | §C2 mục 8: "Phòng chống double-submit: client disable nút ngay sau click + idempotency key phía server".          |
| **Vấn đề**      | Key sinh ở đâu (client gen UUID? request hash?), TTL bao lâu, áp dụng cho action nào?                             |
| **Đề xuất**     | Client gen UUID v4 trong header `X-Idempotency-Key`. Server cache 24h. Áp dụng cho POST/PUT/DELETE. Để SA detail. |

### INC-A-12. "Tab Trạng thái phê duyệt" — hiển thị workflow

| Mục             | Nội dung                                                                                                                                                              |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | TC.2.04 "Hiển thị workflow Maker→Checker→Approver; highlight bước Approver đang chờ". §C1 mục 19.                                                                     |
| **Vấn đề**      | UI cụ thể: stepper / timeline / table? Hiển thị tên người (CHECKED_BY/APPROVED_BY) + thời gian + comment?                                                             |
| **Đề xuất**     | Stepper horizontal với 3 bước Maker → Checker → Approver. Mỗi bước hiển thị: tên user, ngày giờ action, lý do (nếu Return/Reject), trạng thái (Done/Pending/Skipped). |

### INC-A-13. Phạm vi tìm kiếm "trong N phút" của VAL-18 (cảnh báo trùng)

| Mục             | Nội dung                                                                                                             |
| --------------- | -------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | VAL-18: "trong N phút có giao dịch cùng (Đơn vị + Số tiền + Số chứng từ gốc)".                                       |
| **Vấn đề**      | N = ? Đơn vị nghĩa là Sender hay đơn vị COA (DVQHNS)?                                                                |
| **Đề xuất**     | Out of scope MVP (00-scope.md đã ghi). Nếu phase 2: N = 30 phút, đơn vị = SENDER + DVQHNS. **[NEEDS CLARIFICATION]** |

### INC-A-14. Trường `LINE_DESCRIPTION` vs `DESCRIPTION` ở B1.2

| Mục             | Nội dung                                                                                                                                |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | §B1.2 dùng tên `DESCRIPTION` cho "Diễn giải dòng chi tiết". §B3.2 dùng `LINE_DESCRIPTION`.                                              |
| **Vấn đề**      | Cùng một concept (diễn giải dòng chi tiết) nhưng 2 tên field khác nhau, dễ nhầm với `DESCRIPTION` ở B1.1 (Nội dung thanh toán cấp cha). |
| **Đề xuất**     | Thống nhất `LINE_DESCRIPTION` ở mọi nơi cho dòng chi tiết; `DESCRIPTION` (header) ở B1.1. Cập nhật B1.2.                                |

### INC-A-15. UI khi error "MSG-ERR-CCID" — highlight dòng nào

| Mục             | Nội dung                                                                                                                                    |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | VAL-19 "highlight dòng lỗi, hiển thị MSG-ERR-CCID".                                                                                         |
| **Vấn đề**      | Highlight các segment cụ thể trong dòng hay cả dòng? Một bản ghi có nhiều dòng vi phạm → hiển thị 1 dòng hay tất cả?                        |
| **Đề xuất**     | Highlight đỏ toàn dòng + tooltip detail segment nào vi phạm; show message ở footer "Có N dòng vi phạm CCID, xem chi tiết tại dòng X, Y, Z". |

### INC-A-16. Trường `SENDER_NAME` — "Tự hiển thị theo mã COA và cho phép sửa"

| Mục             | Nội dung                                                                                                        |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | §B1.3 SENDER_NAME: "Tự hiển thị theo mã COA đã nhập và cho phép sửa".                                           |
| **Vấn đề**      | "Mã COA đã nhập" — COA nào trong dòng chi tiết? Lệnh có nhiều dòng → lấy dòng nào? Lấy theo DVQHNS (segment 3)? |
| **Đề xuất**     | Map theo `GL_SEGMENT3` (DVQHNS) của dòng đầu tiên (LINE_NO=1). User có thể edit. **[NEEDS CLARIFICATION]**      |

### INC-A-17. `RECEIVER_NAME` vs `RECEIVER_ACCOUNT_NAME` — phân biệt

| Mục             | Nội dung                                                                                                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Vị trí spec** | §B1.4: `RECEIVER_NAME` (Tên người nhận) và `RECEIVER_ACCOUNT_NAME` (Tên tài khoản người nhận) đều bắt buộc Y.                            |
| **Vấn đề**      | Hai trường có thể giống nhau (cá nhân) hoặc khác nhau (DN có tài khoản đứng tên người đại diện). Spec không nói có cho phép giống không. |
| **Đề xuất**     | Cho phép giống, mặc định prepopulate `RECEIVER_ACCOUNT_NAME = RECEIVER_NAME` khi user nhập RECEIVER_NAME, cho phép sửa.                  |

### INC-A-18. Audit oldValue→newValue khi tạo mới

| Mục         | Nội dung                                                                                                         |
| ----------- | ---------------------------------------------------------------------------------------------------------------- |
| **Vấn đề**  | Khi tạo mới (CREATE), `oldValue` không tồn tại — log như thế nào? null hay {}?                                   |
| **Đề xuất** | `oldValue = null`, `newValue = full object snapshot`. Khi DELETE: `oldValue = last snapshot`, `newValue = null`. |

---

## 4. Tóm tắt & Lộ trình giải quyết

### 4.1. Thống kê

| Loại                       | Số lượng | Nghiêm trọng cần xử lý ngay                                |
| -------------------------- | -------- | ---------------------------------------------------------- |
| Mâu thuẫn (Contradictions) | 8        | INC-C-01, INC-C-04, INC-C-07                               |
| Thiếu sót (Gaps)           | 18       | INC-G-01, INC-G-02, INC-G-06, INC-G-12, INC-G-15, INC-G-17 |
| Điểm chưa rõ (Ambiguities) | 18       | INC-A-02, INC-A-05, INC-A-10                               |
| **Tổng**                   | **44**   | **12 mục cần ưu tiên**                                     |

### 4.2. `[NEEDS CLARIFICATION]` — cần Product Owner / Nghiệp vụ KBNN trả lời

Tổng cộng **15 mục** cần human-in-the-loop xác nhận trước hoặc trong khi triển khai:

- INC-C-02 (event SUBMIT cho cả EDIT?)
- INC-C-08 (Tab Đính kèm inline hay popup?)
- INC-G-01 (cấu trúc F-ID)
- INC-G-02 (REF_NO auto-gen hay user nhập?)
- INC-G-04 (số file tối đa N)
- INC-G-05 (cấu hình hạn mức ở đâu)
- INC-G-07 (notification channel/template/retry)
- INC-G-08 (tolerance)
- INC-G-09 (Exchange rate source)
- INC-G-13 (PAYMENT_DATE cho sửa?)
- INC-G-15 (audit retention)
- INC-A-01 (định nghĩa "ngày làm việc")
- INC-A-02 (vai trò phê duyệt cấp cao hơn)
- INC-A-03/04 (default value cho LOV.07.4 và LOV.07.12)
- INC-A-09 (Channel Liên kho bạc — luồng chi tiết)
- INC-A-10 (ngưỡng 500 triệu, currency)
- INC-A-13 (VAL-18 N phút, đơn vị)
- INC-A-16 (SENDER_NAME map COA nào)

### 4.3. Đề xuất hành động (Action Items)

| #   | Hành động                                                                              | Người chịu trách nhiệm | Khi nào            |
| --- | -------------------------------------------------------------------------------------- | ---------------------- | ------------------ |
| 1   | Gửi list `[NEEDS CLARIFICATION]` cho Product Owner / chuyên gia nghiệp vụ KBNN trả lời | BA Agent + Human       | Trước G1 sign-off  |
| 2   | Cập nhật scope/spec sau khi nhận trả lời                                               | BA Agent               | Trong cùng Stage 1 |
| 3   | Các Contradiction được xử lý ở mức spec (BA quyết)                                     | BA Agent               | Trước khi sinh BDD |
| 4   | Các Gap về kỹ thuật (schema F-\*, audit, lock) chuyển sang SA Stage 2                  | SA Agent               | Sau G1             |

---

## Lịch sử Sửa đổi

- **2026-05-19** | **BA Agent** | FT-001 | Khởi tạo file, hoàn thành rà soát 739 dòng spec, ghi nhận 8 contradictions + 18 gaps + 18 ambiguities, đề xuất hướng giải quyết và đánh dấu 15 mục cần clarification.
