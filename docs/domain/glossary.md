# Tu dien Nghiep vu (Domain Glossary)

> Tai lieu nay chua cac thuat ngu nghiep vu dung trong he thong MVP Kho Bac.
> Moi Agent BAT BUOC tham chieu file nay truoc khi dat ten bien, API field, hay DB column (Rule 1.4).

<!-- BA Agent: Append thuat ngu moi khi phan tich tinh nang moi -->

---

<!-- FT-001 -->

## Thuật ngữ bổ sung từ FT-001 — PAY.OUT.MANUAL (2026-05-19)

---

### Approved / Đã phê duyệt (Trạng thái)

**Định nghĩa:** Trạng thái cuối của Lệnh thanh toán đi thủ công sau khi Approver thực hiện phê duyệt. Lệnh ở trạng thái này không thể sửa hoặc xóa; chờ chuyển sang hệ thống GL (trong MVP: mock-hiển thị trạng thái TRANSFERRED_TO_GL/POSTED, không integrate thực sự).
**Ví dụ:** Approver bấm "Phê duyệt" → F-STATUS chuyển từ PENDING_APPROVER sang APPROVED.
**Liên quan:** FT-001, PENDING_APPROVER, TRANSFERRED_TO_GL, POSTED, Approver

---

### Approver / Người phê duyệt

**Định nghĩa:** Vai trò người dùng trong quy trình Maker–Checker–Approver tại KBNN. Approver là cấp phê duyệt cuối cùng, chịu trách nhiệm pháp lý về Lệnh thanh toán đã được chấp thuận. Mã quyền: `PAY_OUT_APPROVER`. Ràng buộc SoD: Approver phải là user khác với Maker và Checker trong cùng một bản ghi.
**Ví dụ:** Lãnh đạo đơn vị KBNN đóng vai Approver, ký duyệt lệnh chuyển tiền liên ngân hàng.
**Liên quan:** FT-001, Maker, Checker, SoD, PENDING_APPROVER, APPROVED

---

### Audit Trail / Vết kiểm tra

**Định nghĩa:** Chuỗi bản ghi không thể xóa ghi lại toàn bộ hành động của người dùng và hệ thống đối với một bản ghi dữ liệu, bao gồm: user, timestamp, địa chỉ IP, hành động (action), giá trị trước (oldValue) và giá trị sau (newValue). Tuân thủ BIZ-007. Dữ liệu giữ tối thiểu 7 năm theo quy định kế toán/kiểm toán nhà nước.
**Ví dụ:** Maker chỉnh sửa AMOUNT từ 100.000.000 → 200.000.000 → audit ghi: `{user: "maker01", action: "UPDATE", field: "AMOUNT", old: 100000000, new: 200000000, ip: "10.0.0.1", ts: "2026-05-19 09:00:00"}`.
**Liên quan:** FT-001, BIZ-007, BIZ-008, Soft Delete, F-AUDIT

---

### BFF / Backend for Frontend

**Định nghĩa:** Mẫu kiến trúc (architectural pattern) trong đó một lớp API trung gian được tạo ra dành riêng cho một loại client cụ thể (ví dụ: web browser, mobile app). BFF tổng hợp, biến đổi dữ liệu từ nhiều microservice backend rồi trả về payload tối ưu cho frontend, giảm số lượng roundtrip và ẩn sự phức tạp phía sau.
**Ví dụ:** Frontend VDBAS gọi `GET /bff/pay-out-manual/{id}` — BFF tổng hợp dữ liệu từ Payment Service, Attachment Service, Audit Service rồi trả về một response duy nhất.
**Liên quan:** FT-001, ARCHITECTURE.md

---

### Checker / Người kiểm soát

**Định nghĩa:** Vai trò người dùng trong quy trình Maker–Checker–Approver tại KBNN. Checker kiểm soát tính hợp lệ nghiệp vụ của Lệnh thanh toán trước khi chuyển Approver. Mã quyền: `PAY_OUT_CHECKER`. Không được tạo, sửa, xóa lệnh. Ràng buộc SoD: Checker phải là user khác với Maker và Approver trong cùng một bản ghi.
**Ví dụ:** Kế toán viên kiểm soát đơn vị KBNN đóng vai Checker, xác nhận chứng từ hợp lệ trước khi trình Approver.
**Liên quan:** FT-001, Maker, Approver, SoD, READY_FOR_APPROVAL, PENDING_APPROVER

---

### COA / Chart of Accounts — Danh mục khoản mục kế toán

**Định nghĩa:** Hệ thống phân loại tài khoản kế toán dùng trong KBNN/VDBAS, được tổ chức dưới dạng 12 Segment (GL_SEGMENT1..12). Mỗi Segment đại diện cho một chiều phân tích ngân sách (mã quỹ, tài khoản tự nhiên, DVQHNS, chương, ngành KT, NDKT, địa bàn, chương trình mục tiêu, mã nguồn kinh phí, kho bạc, dự phòng). Tổ hợp các Segment phải thuộc CCID hợp lệ đã cấu hình.
**Ví dụ:** GL_SEGMENT1=01 (mã quỹ), GL_SEGMENT2=1111 (tài khoản tự nhiên), GL_SEGMENT3=1000001 (DVQHNS) tạo thành một CCID hợp lệ.
**Liên quan:** FT-001, CCID, GL, GL_SEGMENT1..12, VAL-19, LOV.07.x

---

### CCID / Combination Code ID — Mã tổ hợp tài khoản

**Định nghĩa:** Mã định danh cho một tổ hợp hợp lệ của các Segment trong COA theo Cross-Validation Rules (CVR) đã được cấu hình trong hệ thống GL (Oracle EBS). Chỉ các tổ hợp Segment đã được phê duyệt mới được phép giao dịch.
**Ví dụ:** Tổ hợp `{01, 1111, 1000001, 01, 000, 000, 0000, 00000, 00000, 00, 0000, 00}` phải tồn tại trong bảng CCID; nếu không → hệ thống chặn Submit với MSG-ERR-CCID.
**Liên quan:** FT-001, COA, GL, VAL-19, MSG-ERR-CCID

---

### DELETED / Đã xóa (Trạng thái)

**Định nghĩa:** Trạng thái của bản ghi Lệnh thanh toán sau khi Maker thực hiện xóa mềm (Soft Delete). Bản ghi không xuất hiện trong danh sách mặc định nhưng vẫn truy được qua Audit/History. Bản ghi ở trạng thái DELETED không thể sửa, xóa tiếp hay submit; chỉ Quản trị viên mới có thể khôi phục (out of scope MVP).
**Ví dụ:** Maker xác nhận xóa → F-STATUS = DELETED, ghi audit, release hold số dư (nếu có).
**Liên quan:** FT-001, Soft Delete, BIZ-003, VAL-13

---

### DRAFT / Bản nháp (Trạng thái)

**Định nghĩa:** Trạng thái ban đầu của Lệnh thanh toán đi thủ công sau khi Maker tạo mới hoặc lưu nháp. Ở trạng thái này, Maker gốc có thể sửa hoặc xóa bản ghi. Bản ghi chưa được gửi kiểm soát.
**Ví dụ:** Maker nhấn "Lưu nháp" → F-STATUS = DRAFT, F-VER = 1.
**Liên quan:** FT-001, Maker, READY_FOR_APPROVAL, Optimistic Lock, F-VER

---

### F-VER / Phiên bản bản ghi

**Định nghĩa:** Số nguyên (integer) tự tăng dùng để triển khai cơ chế Optimistic Locking. Mỗi lần bản ghi được cập nhật thành công, F-VER tăng thêm 1. Khi Maker lưu chỉnh sửa, hệ thống so sánh F-VER gửi lên với F-VER trong DB; nếu khác nhau → chặn, yêu cầu tải lại.
**Ví dụ:** User A mở form (F-VER=3), User B lưu trước (F-VER→4). User A bấm lưu → hệ thống phát hiện F-VER=3 ≠ 4 → MSG-ERR-LOCK.
**Liên quan:** FT-001, Optimistic Lock, VAL-15, MSG-ERR-LOCK

---

### GL / General Ledger — Sổ cái tổng hợp

**Định nghĩa:** Hệ thống kế toán tổng hợp (trong ngữ cảnh VDBAS là Oracle EBS GL) ghi nhận toàn bộ bút toán kế toán của đơn vị. Các Lệnh thanh toán đi sau khi được phê duyệt (APPROVED) sẽ được chuyển sang GL để hạch toán. Trong MVP, integration với GL chỉ được mock-hiển thị; không implement thực sự.
**Ví dụ:** Lệnh APPROVED → chờ trigger downstream sang GL → trạng thái TRANSFERRED_TO_GL → POSTED (Oracle EBS ghi bút toán).
**Liên quan:** FT-001, COA, CCID, TRANSFERRED_TO_GL, POSTED, Oracle EBS

---

### Lệnh Thanh Toán Đi / Outbound Payment Order

**Định nghĩa:** Chứng từ kế toán khởi tạo bởi đơn vị KBNN, yêu cầu chuyển tiền từ tài khoản của đơn vị (người chuyển) sang tài khoản của bên thụ hưởng (người nhận) thông qua một trong các kênh thanh toán: Liên ngân hàng (LNH), Thanh toán song phương (TTSP), Liên kho bạc. Phải trải qua quy trình Maker–Checker–Approver trước khi được thực hiện.
**Ví dụ:** KBNN Quận 1 lập lệnh chuyển 500 triệu VND cho Sở Tài chính qua kênh Liên kho bạc.
**Liên quan:** FT-001, PAY.OUT.MANUAL, Maker, Checker, Approver, DRAFT, APPROVED

---

### Maker / Người lập

**Định nghĩa:** Vai trò người dùng trong quy trình Maker–Checker–Approver tại KBNN. Maker là người khởi tạo Lệnh thanh toán đi thủ công, chịu trách nhiệm về tính chính xác của dữ liệu đầu vào. Mã quyền: `PAY_OUT_MAKER`. Chỉ Maker gốc (người tạo bản ghi) mới được sửa hoặc xóa bản ghi ở trạng thái DRAFT hoặc RETURNED_TO_MAKER. Ràng buộc SoD: Maker phải là user khác với Checker và Approver.
**Ví dụ:** Nghiệp vụ viên KBNN đóng vai Maker, nhập thông tin lệnh thanh toán rồi bấm "Gửi kiểm soát".
**Liên quan:** FT-001, Checker, Approver, SoD, DRAFT, RETURNED_TO_MAKER, BIZ-001, BIZ-002

---

### Optimistic Lock / Khóa lạc quan

**Định nghĩa:** Cơ chế kiểm soát đồng thời (concurrency control) trong đó hệ thống không chặn trước khi đọc/ghi mà so sánh phiên bản (F-VER) tại thời điểm lưu. Nếu phiên bản không khớp (bản ghi đã bị người khác cập nhật), hệ thống từ chối và yêu cầu người dùng tải lại. Đây là cơ chế được chọn cho MVP (thay vì Pessimistic Lock cần distributed lock infrastructure).
**Ví dụ:** VAL-15: So sánh `(F-ID, F-VER)` khi lưu; mismatch → MSG-ERR-LOCK.
**Liên quan:** FT-001, F-VER, VAL-15, MSG-ERR-LOCK, Pessimistic Lock (out of scope MVP)

---

### PAY.OUT.MANUAL / Mã chức năng Lệnh thanh toán đi thủ công

**Định nghĩa:** Mã định danh chức năng trong hệ thống VDBAS cho nghiệp vụ Thêm mới / Xem / Sửa / Xóa Lệnh thanh toán đi thủ công (Payment Order — Manual Outbound). Được dùng làm prefix cho tất cả event ID, screen ID, permission code, và API endpoint liên quan đến chức năng này.
**Ví dụ:** `PAY.OUT.MANUAL.NEW` (tạo mới), `PAY.OUT.MANUAL.APPROVE.CHECKER` (Checker phê duyệt), `PAY.OUT.MANUAL.LIST` (màn hình danh sách).
**Liên quan:** FT-001, Lệnh Thanh Toán Đi, PAY.OUT.MANUAL.NEW, PAY.OUT.MANUAL.EDIT, PAY.OUT.MANUAL.DELETE

---

### PENDING_APPROVER / Chờ phê duyệt (Trạng thái)

**Định nghĩa:** Trạng thái của Lệnh thanh toán sau khi Checker thực hiện phê duyệt cấp 1. Lệnh đang chờ Approver xem xét và phê duyệt cuối. Ở trạng thái này, Maker không thể sửa hoặc xóa.
**Ví dụ:** Checker bấm "Phê duyệt" → F-STATUS chuyển từ READY_FOR_APPROVAL sang PENDING_APPROVER; hệ thống gửi notification cho Approver.
**Liên quan:** FT-001, Checker, Approver, READY_FOR_APPROVAL, APPROVED, RETURNED_TO_MAKER, REJECTED

---

### RBAC / Role-Based Access Control — Kiểm soát truy cập theo vai trò

**Định nghĩa:** Mô hình phân quyền trong đó quyền truy cập hệ thống được gán cho các vai trò (role) thay vì cho từng cá nhân. Người dùng được cấp một hoặc nhiều vai trò; quyền thực tế là tập hợp quyền của tất cả vai trò đó. Trong FT-001, có 4 vai trò chính: Maker (`PAY_OUT_MAKER`), Checker (`PAY_OUT_CHECKER`), Approver (`PAY_OUT_APPROVER`), Viewer (`PAY_OUT_VIEWER`).
**Ví dụ:** User X có role `PAY_OUT_MAKER` → có thể tạo/sửa/xóa lệnh; nhưng không thể phê duyệt (cần thêm `PAY_OUT_CHECKER`).
**Liên quan:** FT-001, SoD, Maker, Checker, Approver, Viewer, BIZ-001

---

### READY_FOR_APPROVAL / Đã gửi kiểm soát (Trạng thái)

**Định nghĩa:** Trạng thái của Lệnh thanh toán sau khi Maker thực hiện Submit (Gửi kiểm soát). Lệnh đang chờ Checker xem xét. Ở trạng thái này, Maker không thể sửa hoặc xóa; hệ thống gửi notification đến Checker.
**Ví dụ:** Maker bấm "Gửi kiểm soát" → validate đầy đủ → F-STATUS chuyển từ DRAFT sang READY_FOR_APPROVAL → notification gửi Checker.
**Liên quan:** FT-001, Maker, Checker, DRAFT, PENDING_APPROVER, RETURNED_TO_MAKER, REJECTED

---

### REF_NO / Số YCTT — Mã tham chiếu giao dịch

**Định nghĩa:** Mã định danh hoặc số tham chiếu của Yêu cầu thanh toán (YCTT) hoặc bút toán, dùng để tra cứu và phân biệt các lệnh thanh toán trong hệ thống. Với kênh Liên ngân hàng, REF_NO được gọi là "số bút toán". Phải duy nhất trong phạm vi (đơn vị + kỳ kế toán + loại lệnh). Chưa xác định rõ là user nhập hay hệ thống sinh (xem INC-G-02, cần làm rõ với Product Owner).
**Ví dụ:** REF_NO = "KBHN-202605-00123" (nếu hệ thống sinh theo pattern) hoặc do user nhập theo quy định nội bộ.
**Liên quan:** FT-001, VAL-11, INC-G-02, Lệnh Thanh Toán Đi

---

### REJECTED / Từ chối (Trạng thái)

**Định nghĩa:** Trạng thái cuối của Lệnh thanh toán khi Checker hoặc Approver thực hiện từ chối với lý do cụ thể (≥ 10 ký tự). Bản ghi bị khóa, không thể sửa, xóa hay submit lại; chỉ có thể xem. Maker được thông báo lý do từ chối.
**Ví dụ:** Approver thấy thông tin người nhận không hợp lệ → bấm "Từ chối" → F-STATUS = REJECTED; notification gửi Maker kèm lý do.
**Liên quan:** FT-001, Checker, Approver, READY_FOR_APPROVAL, PENDING_APPROVER, BIZ-006

---

### RETURNED_TO_MAKER / Trả lại Maker (Trạng thái)

**Định nghĩa:** Trạng thái của Lệnh thanh toán khi Checker hoặc Approver trả lại cho Maker để chỉnh sửa, kèm lý do (≥ 10 ký tự). Maker gốc có thể sửa và submit lại. Đây là bước rework trong quy trình phê duyệt.
**Ví dụ:** Checker phát hiện sai tài khoản người nhận → bấm "Trả lại" → F-STATUS = RETURNED_TO_MAKER; notification gửi Maker.
**Liên quan:** FT-001, Maker, Checker, Approver, READY_FOR_APPROVAL, PENDING_APPROVER, BIZ-006

---

### SoD / Segregation of Duties — Phân tách nhiệm vụ

**Định nghĩa:** Nguyên tắc kiểm soát nội bộ bắt buộc trong KBNN (BIZ-001): trong cùng một Lệnh thanh toán, ba vai trò Maker, Checker, Approver bắt buộc phải là 3 người dùng khác nhau và giữ 3 vai trò khác nhau. Hệ thống tự động chặn nếu vi phạm. Mục đích: ngăn chặn gian lận, đảm bảo tính toàn vẹn của giao dịch tài chính công.
**Ví dụ:** User A lập lệnh (Maker) → User A không thể là Checker hay Approver cho chính lệnh đó.
**Liên quan:** FT-001, Maker, Checker, Approver, BIZ-001, RBAC

---

### Soft Delete / Xóa mềm

**Định nghĩa:** Cơ chế xóa dữ liệu trong đó bản ghi không bị xóa vật lý khỏi cơ sở dữ liệu mà chỉ bị đánh dấu là đã xóa (F-STATUS = DELETED). Bản ghi ẩn khỏi danh sách thông thường nhưng vẫn truy cập được qua Audit Trail và History để đảm bảo tính toàn vẹn kiểm toán. Tuân thủ BIZ-003.
**Ví dụ:** Maker xác nhận xóa lệnh → backend set `F_STATUS = 'DELETED'`, `DELETED_BY`, `DELETED_DATE` → bản ghi vẫn tồn tại trong DB; `is_deleted = true`.
**Liên quan:** FT-001, DELETED, BIZ-003, Audit Trail, VAL-13

---

### Viewer / Người tra cứu

**Định nghĩa:** Vai trò người dùng trong VDBAS chỉ có quyền xem, xuất và in Lệnh thanh toán. Không thể tạo, sửa, xóa hay thay đổi trạng thái. Thường là lãnh đạo, kiểm toán nội bộ, kế toán trưởng cần theo dõi tình hình thanh toán. Mã quyền: `PAY_OUT_VIEWER`.
**Ví dụ:** Kế toán trưởng tra cứu danh sách lệnh APPROVED trong tháng để đối chiếu số liệu.
**Liên quan:** FT-001, RBAC, Maker, Checker, Approver
