# Business & Validation Rules — TT.OUT.MANUAL

> Nguồn: `workspaces/ba/domain/business-rules.yaml` + `workspaces/ba/domain/validation-rules.yaml`

## Tổng quan

- **29 Business Rules** (BIZ): quy tắc nghiệp vụ, xử lý logic
- **36 Validation Rules** (VAL): quy tắc kiểm tra dữ liệu đầu vào

---

## Business Rules (29)

| ID | Tên | Mô tả ngắn |
|----|-----|------------|
| BIZ-001 | Tìm kiếm | Chỉ tìm khi tham số hợp lệ, trống = không lọc |
| BIZ-002 | Phân trang | page size=20 mặc định, sort theo Ngày GD giảm dần |
| BIZ-003 | Tự sinh số YCTT | Pattern theo kênh: LNH `ddMMyyyy+6seq`, SP `<maNH>YYYYMMDD<seq>`, LKB `<maKB>YYYY<seq>` |
| BIZ-004 | Autofill từ DMHT09 | Tự điền tên NH, TK NH, địa chỉ khi chọn mã NH |
| BIZ-005 | Chỉ sửa LTT mình lập | Maker chỉ sửa LTT do chính mình tạo (DRAFT/RETURNED_TO_MAKER) |
| BIZ-006 | Xoá nháp | Chỉ xoá LTT ở trạng thái DRAFT do mình lập |
| BIZ-007 | Soft delete | Xoá = set is_deleted=true, số YCTT không tái sử dụng |
| BIZ-008 | Bất biến sau Submit | Các trường chính không sửa sau khi Submit |
| BIZ-009 | Edit audit diff | Lưu diff oldValue→newValue khi sửa |
| BIZ-010 | Maker-Checker-Approver | Quy trình 3 cấp bắt buộc |
| BIZ-011 | Separation of Duties | maker_id ≠ checker_id ≠ approver_id |
| BIZ-012 | Reserve fund | Hold số dư TK nguồn = số tiền LTT khi Submit |
| BIZ-013 | Release hold | Giải phóng hold khi Reject/Cancel |
| BIZ-014 | Duplicate check | Cảnh báo N phút gần nhất: cùng ĐV, NH nhận, số tiền, số CT gốc |
| BIZ-015 | Optimistic lock | (id, version, updatedAt) cho mọi update |
| BIZ-016 | Ràng buộc COA chéo | Tổ hợp segment COA phải hợp lệ theo DMHT.COA-MATRIX |
| BIZ-017 | COT check | Sau giờ cut-off kênh → chuyển sang T+1 |
| BIZ-018 | Hạn mức | So tiền LTT ≤ hạn mức theo Kênh × Loại lệnh × Vai trò × ĐV |
| BIZ-019 | Phân tuyến kênh | Định tuyến kênh dựa trên NH nhận + COA |
| BIZ-020 | Retry gateway | 3 lần, backoff 5/15/45 giây |
| BIZ-021 | Ký số TAD-COMM | Chứng thư hợp lệ, chưa hết hạn, đúng cá nhân |
| BIZ-022 | Publish event | Publish event lên MQ sau mỗi chuyển trạng thái |
| BIZ-023 | Notification | Gửi thông báo cho user kế tiếp trong workflow |
| BIZ-024 | Audit log | Ghi mọi thao tác: user, timestamp, IP, oldValue→newValue |
| BIZ-025 | Lý do từ chối | Reject bắt buộc có lý do |
| BIZ-026 | Tính phí | Tự động theo Kênh × Loại lệnh × Số tiền |
| BIZ-027 | Tỷ giá ngoại tệ | Lấy từ NHNN hàng ngày, cảnh báo nếu lệch ±2% |
| BIZ-028 | Liên kết hợp đồng | Kiểm tra số dư hợp đồng ≥ số tiền LTT |
| BIZ-029 | NDND rule | NDND phải thuộc cùng cấp ngân sách với các segment khác |

## Validation Rules (36)

### Generic field validation (VAL-001 .. VAL-005)

| ID | Trường | Điều kiện | Mã lỗi |
|----|--------|-----------|--------|
| VAL-001 | Danh mục | Giá trị không tồn tại trong DM cấu hình | E-VAL-001 |
| VAL-002 | String | Vượt quá giới hạn ký tự | E-VAL-002 |
| VAL-003 | Date | Sai định dạng ngày | E-VAL-003 |
| VAL-004 | Number | Không phải số hợp lệ | E-VAL-004 |
| VAL-005 | Required | Trường bắt buộc bị bỏ trống | E-VAL-005 |

### Kênh & Loại lệnh (VAL-006 .. VAL-009)

| ID | Điều kiện | Mã lỗi |
|----|-----------|--------|
| VAL-006 | Kênh không hợp lệ (chỉ LNH/SP/LKB) | E-VAL-006 |
| VAL-007 | Loại lệnh không thuộc kênh đã chọn | E-VAL-007 |
| VAL-008 | Kênh không hỗ trợ cho NH nhận | E-VAL-008 |
| VAL-009 | Kênh tạm đóng theo cấu hình DMHT | E-VAL-009 |

### Số YCTT & Tài liệu tham chiếu (VAL-010 .. VAL-011)

| ID | Điều kiện | Mã lỗi |
|----|-----------|--------|
| VAL-010 | Số YCTT trùng trong cùng ĐV + năm | E-VAL-010 |
| VAL-011 | Số CT gốc không tồn tại khi kiểm tra | E-VAL-011 |

### Số tiền & Ngày (VAL-012 .. VAL-016)

| ID | Điều kiện | Mã lỗi |
|----|-----------|--------|
| VAL-012 | Số tiền ≤ 0 | E-VAL-012 |
| VAL-013 | Số tiền vượt quá precision (15,2) | E-VAL-013 |
| VAL-014 | Ngày GD ngoài phạm vi cho phép | E-VAL-014 |
| VAL-015 | Ngày hiệu lực < ngày hiện tại | E-VAL-015 |
| VAL-016 | Loại tiền không hợp lệ (ISO-4217) | E-VAL-016 |

### Ngân hàng nhận (VAL-017 .. VAL-018)

| ID | Điều kiện | Mã lỗi |
|----|-----------|--------|
| VAL-017 | Mã NH nhận không tồn tại trong DM-BANK | E-VAL-017 |
| VAL-018 | Tài khoản NH nhận sai format | E-VAL-018 |

### COA & Tài khoản (VAL-019 .. VAL-024)

| ID | Điều kiện | Mã lỗi |
|----|-----------|--------|
| VAL-019 | Tổ hợp COA không hợp lệ | E-VAL-019 |
| VAL-020 | Chương không thuộc ĐV | E-VAL-020 |
| VAL-021 | NDKT không thuộc Ngành KT | E-VAL-021 |
| VAL-022 | TK NH nguồn không tồn tại hoặc đã đóng | E-VAL-022 |
| VAL-023 | Số TK KHÔNG đúng mask (length/checksum) | E-VAL-023 |
| VAL-024 | NDND không thuộc cấp NS đúng | E-VAL-024 |

### Khác (VAL-025 .. VAL-036)

| ID | Điều kiện | Mã lỗi |
|----|-----------|--------|
| VAL-025 | NDKT không thuộc DM-NDKT | E-VAL-025 |
| VAL-026 | Mã DVQHNS không hợp lệ | E-VAL-026 |
| VAL-027 | Nội dung thanh toán quá dài | E-VAL-027 |
| VAL-028 | Số tiền > hạn mức cấu hình | E-VAL-028 |
| VAL-029 | File đính kèm: sai loại/size/quá số lượng | E-VAL-029 |
| VAL-030 | State guard: thao tác không hợp lệ ở trạng thái này | E-VAL-030 |
| VAL-031 | Ownership: không phải người lập | E-VAL-031 |
| VAL-032 | Edit immutable field sau Submit | E-VAL-032 |
| VAL-033 | Delete non-DRAFT | E-VAL-033 |
| VAL-034 | Reject without reason | E-VAL-034 |
| VAL-035 | Sign with invalid/expired certificate | E-VAL-035 |
| VAL-036 | Optimistic lock: version mismatch | E-VAL-036 |

> Chi tiết đầy đủ: `workspaces/ba/domain/business-rules.yaml` + `workspaces/ba/domain/validation-rules.yaml`
