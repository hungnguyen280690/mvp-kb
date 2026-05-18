# Bảng đặc tả chức năng

> Chức năng **Phê duyệt / Uỷ quyền / Từ chối** cho từng giao dịch điển hình — workflow Maker → Checker → Approver (đa cấp), kèm uỷ quyền (delegation), thu hồi (recall), phê duyệt hàng loạt, ký số. BA dùng làm tham chiếu — thay `<…>` theo nghiệp vụ thực tế.

## 1. Thông tin chung

| Trường | Giá trị |
|---|---|
| Mã chức năng | `<MOD>.APV.<TxnType>` |
| Tên chức năng | Phê duyệt / Uỷ quyền / Từ chối giao dịch `<Tên loại giao dịch>` |
| Người sử dụng | Người lập (Maker), Người kiểm soát (Checker), Người phê duyệt cấp 1..N (Approver L1..LN), Người uỷ quyền (Delegator), Người được uỷ quyền (Delegatee), Quản trị (Admin) |
| Mô tả | Cho phép NSD có thẩm quyền duyệt một hoặc nhiều giao dịch đang chờ; từ chối kèm lý do; uỷ quyền (toàn phần/một phần, có/không giới hạn thời gian) cho người khác duyệt thay; thu hồi giao dịch trước khi cấp cao hơn duyệt; thực hiện theo **ma trận thẩm quyền** (giá trị, loại GD, kênh, đơn vị, sản phẩm) và workflow đa cấp; ký số bắt buộc với GD trọng yếu |
| Độ ưu tiên | Cao |
| URD reference | `<URD-APV-XXX>` |

## 2. Tiền điều kiện

| STT | Điều kiện |
|---|---|
| 1 | NSD đã đăng nhập hệ thống và đã xác thực 2FA (nếu cấu hình) |
| 2 | NSD có vai trò + thẩm quyền duyệt phù hợp theo ma trận (đơn vị, loại GD, hạn mức, sản phẩm) |
| 3 | Giao dịch đang ở trạng thái phù hợp để duyệt (`PENDING_CHECK`, `PENDING_APPROVE_L1..LN`) |
| 4 | NSD không phải là người lập/kiểm soát của chính giao dịch (Separation of Duties) |
| 5 | Có chứng thư số / token / OTP còn hiệu lực (nếu cấu hình ký số) |
| 6 | (Uỷ quyền) Quyết định uỷ quyền đã được duyệt và còn hiệu lực; hạn mức uỷ quyền ≥ giá trị giao dịch |
| 7 | Ma trận thẩm quyền cho `<TxnType>` đã được publish phiên bản `vN` |
| 8 | Hệ thống đang trong giờ giao dịch hoặc trong cấu hình cho phép duyệt ngoài giờ |

## 3. Hậu điều kiện

| STT | Điều kiện |
|---|---|
| 1 | Giao dịch chuyển sang trạng thái kế tiếp đúng workflow: `APPROVED` (cuối) hoặc `PENDING_APPROVE_L<k+1>` (giữa) hoặc `REJECTED` hoặc `RETURNED` (trả lại Maker) |
| 2 | Lịch sử workflow ghi nhận đầy đủ: actor, vai trò, hành động, thời điểm, IP, lý do, chữ ký số (nếu có), comment |
| 3 | Notification được gửi cho các bên liên quan (Maker, Approver cấp tiếp, người liên quan) |
| 4 | Audit log lưu hash payload trước/sau, không cho phép sửa hậu kiểm |
| 5 | (APPROVED cuối) Trigger downstream: hạch toán, gửi lệnh ra hệ đích, cập nhật số dư, sinh chứng từ |
| 6 | (REJECTED/RETURNED) Khoá GD không cho duyệt lại; Maker có thể xem & tạo lại GD mới tham chiếu |
| 7 | Quota duyệt trong ngày của user được cập nhật; cảnh báo khi sắp chạm ngưỡng |

## 4. Luồng chính

| Bước | Người dùng | Hệ thống |
|---|---|---|
| 1 | NSD mở **Hộp chờ duyệt** (Inbox) | Truy vấn danh sách GD đang chờ duyệt thuộc thẩm quyền NSD (gồm cả GD được uỷ quyền); hiển thị: mã GD, loại, số tiền, đơn vị, người lập, thời gian, SLA còn lại, kênh, mức độ ưu tiên, badge "Uỷ quyền" |
| 2 | NSD lọc/sắp xếp/tìm kiếm | Hỗ trợ filter: loại GD, đơn vị, khoảng số tiền, kênh, người lập, trạng thái, SLA gần hết hạn, tag; sort theo SLA mặc định tăng dần |
| 3 | NSD bấm vào một GD để xem chi tiết | Render màn hình duyệt: thông tin GD (read-only), payload đầy đủ, lịch sử workflow, comment, file đính kèm, kết quả kiểm tra tự động (validate, blacklist, AML, hạn mức) |
| 4 | NSD đọc/đối chiếu thông tin; (tuỳ chọn) bấm **Trao đổi** | Mở luồng chat/comment gắn vào GD; có @mention; ghi log |
| 5 | NSD chọn hành động: **Duyệt** / **Từ chối** / **Trả lại** / **Thu hồi (Recall)** / **Uỷ quyền** | Hiển thị popup tương ứng |
| 6a | **Duyệt** → nhập comment (tuỳ chọn) → bấm Xác nhận | Validate: thẩm quyền + ma trận + SoD + uỷ quyền hiệu lực; yêu cầu OTP/ký số nếu cấu hình; chuyển trạng thái sang `APPROVED` (cuối cùng) hoặc `PENDING_APPROVE_L<k+1>`; gửi notification cấp tiếp; ghi audit |
| 6b | **Từ chối** → chọn lý do (dropdown) + bắt buộc nhập comment | Validate; chuyển `REJECTED`; gửi notification cho Maker và các cấp đã duyệt trước đó; ghi audit; khoá GD |
| 6c | **Trả lại** → chọn cấp trả về (Maker hoặc Checker) + lý do | Chuyển `RETURNED_TO_<role>`; cho phép Maker chỉnh sửa và trình lại; chuỗi duyệt reset từ đầu |
| 6d | **Thu hồi (Recall)** → cho phép Approver cấp dưới rút lại đề xuất duyệt trong khi cấp trên chưa thao tác | Validate: cấp trên chưa duyệt/từ chối; chuyển GD về `PENDING_APPROVE_L<k-1>` hoặc về Maker; ghi audit |
| 6e | **Uỷ quyền** → mở popup chọn người được uỷ quyền + phạm vi (loại GD, đơn vị, hạn mức) + thời hạn + lý do | Validate người nhận có vai trò tương đương/thấp hơn nhưng đủ thẩm quyền; ghi quyết định uỷ quyền vào hồ sơ; người nhận sẽ thấy GD trong Inbox với badge "Uỷ quyền" |
| 7 | NSD chọn **Phê duyệt hàng loạt** (multi-select) | Cho phép tick nhiều GD cùng loại, cùng đơn vị; áp dụng cùng một hành động; vẫn yêu cầu ký số/OTP một lần cho cả lô; mỗi GD vẫn được validate độc lập, GD nào fail vẫn ghi nhận và không chặn các GD còn lại |
| 8 | NSD xem **Lịch sử thao tác** | Tab lịch sử cho từng GD: timeline thời gian, actor, hành động, comment, chữ ký số, snapshot payload trước/sau |
| 9 | NSD đăng xuất / kết thúc phiên | Lưu trạng thái filter/sort theo user; xoá session theo policy |

## 5. Luồng thay thế

| Mã | Mô tả | Hệ thống |
|---|---|---|
| A1 | **Uỷ quyền vắng mặt (Out-of-office)** | NSD tự khai báo lịch vắng mặt (từ–đến) + người thay; hệ thống tự forward GD trong khoảng đó; auto-cancel khi NSD quay lại |
| A2 | **Uỷ quyền cần phê duyệt** (vd uỷ quyền cấp cao hoặc vượt hạn mức cá nhân) | Tạo yêu cầu uỷ quyền → Admin/Quản lý cấp trên duyệt → mới active |
| A3 | **Thu hồi uỷ quyền** | Delegator có thể thu hồi bất cứ lúc nào; GD đã chuyển sang Delegatee mà chưa duyệt → quay về Delegator; đã duyệt → giữ nguyên |
| A4 | **Phê duyệt song song** (multi-approver cùng cấp) | Yêu cầu N người trong cùng cấp duyệt (M-of-N policy); đủ M người duyệt → chuyển cấp tiếp; có 1 người từ chối → reject ngay |
| A5 | **Phê duyệt có điều kiện (conditional)** | Approver có thể duyệt kèm điều kiện (vd "duyệt với điều kiện bổ sung chứng từ X"); Maker phải xác nhận điều kiện trước khi GD chuyển sang `EFFECTIVE` |
| A6 | **Escalation tự động** | GD chờ duyệt quá SLA cấu hình → tự eskalate lên cấp cao hơn / quản lý trực tiếp; gửi notification; cấp dưới vẫn có thể duyệt cho đến khi cấp cao thao tác |
| A7 | **Override khẩn cấp** | Lãnh đạo cấp cao nhất có quyền override (bỏ qua cấp dưới) cho GD khẩn; bắt buộc lý do + ký số + ghi audit nổi bật; có quota/tháng |
| A8 | **Phê duyệt offline (mobile)** | NSD duyệt qua app mobile; vẫn yêu cầu OTP/biometrics + ký số bằng eKey/Soft-token |
| A9 | **Yêu cầu bổ sung thông tin** | Approver bấm "Yêu cầu bổ sung" → chọn trường cần bổ sung → GD chuyển `PENDING_INFO` về Maker; Maker bổ sung và trình lại từ đầu (cấu hình: từ đầu / hoặc từ cấp đã yêu cầu) |
| A10 | **Đính kèm chứng từ khi duyệt** | Approver upload thêm file (biên bản, văn bản, ảnh) gắn vào GD; ghi audit |
| A11 | **Xem GD liên quan** | Hệ thống đề xuất các GD cùng đối tác/cùng ngày/cùng IP gần giống → giúp phát hiện chia nhỏ GD để né hạn mức |
| A12 | **Phê duyệt theo lô (queue lock)** | Khi mở GD ra duyệt → khoá tạm cho user khác (lease 5 phút) tránh duyệt trùng; auto-release khi hết lease |

## 6. Luồng ngoại lệ

| Mã | Điều kiện | Xử lý |
|---|---|---|
| E1 | NSD không đủ thẩm quyền theo ma trận (giá trị/loại/đơn vị) | Disable nút Duyệt; tooltip giải thích; cho phép Trả lại / Yêu cầu cấp cao hơn duyệt |
| E2 | NSD chính là người lập/kiểm soát GD (vi phạm SoD) | Ẩn GD khỏi Inbox; nếu mở qua link trực tiếp → chặn + cảnh báo bảo mật + audit |
| E3 | GD đã được người khác duyệt/từ chối/thu hồi trong khi đang xem | Refresh chi tiết; thông báo `GD đã được xử lý bởi <user> lúc <time>`; chặn thao tác |
| E4 | OTP/ký số không hợp lệ | Cho phép retry 3 lần; vượt → khoá phiên duyệt 15 phút; ghi audit bảo mật |
| E5 | Chứng thư số hết hạn / bị thu hồi | Chặn Duyệt; gợi ý đăng ký chứng thư mới; thông báo Admin |
| E6 | Uỷ quyền hết hiệu lực giữa chừng | Khi click Duyệt, hệ thống tái kiểm tra; nếu hết hiệu lực → chặn + thông báo + GD quay về owner ban đầu |
| E7 | Uỷ quyền vượt hạn mức của người được uỷ quyền | Chặn ngay tại popup; gợi ý người khác có thẩm quyền cao hơn |
| E8 | Trùng phiên duyệt (cùng user, 2 trình duyệt) | Phiên thứ 2 nhận trạng thái mới nhất; nếu hành động cũ đã thực hiện → reject lệnh cũ |
| E9 | GD bị thay đổi cấu trúc giữa các bước duyệt (hash mismatch) | Block; cảnh báo nghi vấn can thiệp; gửi alert bảo mật; bắt buộc Admin điều tra |
| E10 | Phê duyệt hàng loạt — một số GD fail validate | GD pass vẫn được xử lý; GD fail giữ nguyên trạng thái + lý do; trả về báo cáo lô (success/fail) |
| E11 | Quá SLA — không có cấp cao hơn để escalate | Cảnh báo Admin; ghi `SLA_BREACH`; vẫn cho cấp hiện tại duyệt |
| E12 | Mất kết nối khi đang ký số | Hiển thị "Đang chờ xác thực"; cho phép thử lại; không double-submit; idempotency key đảm bảo |
| E13 | Người được uỷ quyền có conflict (vd là chính người lập GD đó) | Chặn; thông báo SoD; gợi ý uỷ quyền cho người khác |
| E14 | Override khẩn cấp vượt quota tháng | Chặn; thông báo lãnh đạo cấp cao hơn duyệt thủ công; lưu vào sổ ngoại lệ |
| E15 | Comment chứa từ ngữ nhạy cảm / PII | Cảnh báo, đề nghị che mask; vẫn cho lưu kèm cờ flagged để hậu kiểm |
| E16 | GD ngoài giờ giao dịch trong khi cấu hình không cho phép duyệt ngoài giờ | Chặn duyệt; cho phép xem; thông báo khung giờ hợp lệ |

## 7. Quy tắc nghiệp vụ

| STT | Quy tắc |
|---|---|
| 1 | BIZ-APV-01 — **Ma trận thẩm quyền** quyết định số cấp duyệt và người duyệt dựa trên (Loại GD × Số tiền × Đơn vị × Kênh × Sản phẩm); ma trận có phiên bản, người duyệt phát hành, lịch sử thay đổi |
| 2 | BIZ-APV-02 — **Separation of Duties (SoD)**: Maker ≠ Checker ≠ Approver; người duyệt cấp `k` không được duyệt cấp `k-1` của cùng GD |
| 3 | BIZ-APV-03 — Mỗi cấp phải có ít nhất 1 người duyệt; cấp có nhiều người → áp dụng policy M-of-N hoặc "any-1" theo cấu hình |
| 4 | BIZ-APV-04 — GD trọng yếu (≥ ngưỡng cấu hình hoặc loại ưu tiên cao) **bắt buộc ký số** bằng chứng thư số cá nhân của Approver; chữ ký lưu kèm GD |
| 5 | BIZ-APV-05 — **Uỷ quyền** phải có: (a) văn bản quyết định / cấu hình được duyệt, (b) phạm vi (loại GD, đơn vị, hạn mức tối đa), (c) thời hạn (từ–đến), (d) lý do; Delegatee không bao giờ vượt thẩm quyền vốn có của Delegator |
| 6 | BIZ-APV-06 — Uỷ quyền không được tạo vòng (A→B, B→A); không lồng nhiều cấp (Delegatee không được uỷ quyền lại cho người khác) |
| 7 | BIZ-APV-07 — **Thu hồi (Recall)** chỉ thực hiện được khi cấp tiếp theo chưa có thao tác; sau khi cấp trên đã duyệt/từ chối → không recall được |
| 8 | BIZ-APV-08 — **Từ chối** bắt buộc lý do; lý do thuộc danh mục chuẩn (`F-APV-REASON`) + free-text mở rộng; không hoàn tác được |
| 9 | BIZ-APV-09 — **Trả lại Maker/Checker** không phải là từ chối; GD chuyển trạng thái `RETURNED`; Maker chỉnh sửa và trình lại → workflow chạy lại từ đầu |
| 10 | BIZ-APV-10 — **SLA** theo từng cấp duyệt (cấu hình theo loại GD); vượt SLA → escalation tự động; cảnh báo Maker và quản lý |
| 11 | BIZ-APV-11 — **Quota** duyệt theo user/ngày (số lượng + tổng giá trị); chạm 80% → cảnh báo; chạm 100% → chặn thêm |
| 12 | BIZ-APV-12 — Mọi hành động (duyệt/từ chối/trả lại/thu hồi/uỷ quyền) **không thể xoá**; chỉ có thể ghi bổ sung; audit log immutable (append-only) |
| 13 | BIZ-APV-13 — Hash payload GD được lưu tại mỗi bước duyệt; nếu hash giữa các bước khác nhau → block và alert |
| 14 | BIZ-APV-14 — **Phê duyệt hàng loạt** chỉ áp dụng cho GD cùng loại + cùng cấp duyệt + cùng đơn vị; tối đa N GD/lô (cấu hình); vẫn ký số 1 lần cho cả lô nhưng audit từng GD |
| 15 | BIZ-APV-15 — **Override khẩn cấp**: chỉ cấp cao nhất; bắt buộc lý do + ký số + thông báo HĐQT/Ban điều hành; quota tháng cứng |
| 16 | BIZ-APV-16 — **Trong/ngoài giờ**: cấu hình theo loại GD; ngoài giờ → cần thêm xác thực 2FA mạnh hơn (biometrics + OTP) |
| 17 | BIZ-APV-17 — Khi `APPROVED` cuối → trigger downstream **chỉ một lần**; idempotency key dựa trên `txnId + finalApprovalId` |
| 18 | BIZ-APV-18 — **Conflict-of-interest**: cấu hình cấm duyệt nếu Approver có quan hệ liên quan với khách hàng/đối tác trong GD (lấy từ danh mục liên kết); cảnh báo cứng |
| 19 | BIZ-APV-19 — **Comment & file đính kèm** khi duyệt/từ chối/trả lại lưu vĩnh viễn; có thể che mask PII; truy tìm theo full-text trong audit |
| 20 | BIZ-APV-20 — Báo cáo phê duyệt định kỳ (ngày/tuần/tháng): số GD đã duyệt/từ chối/quá SLA, top user, top đơn vị, thời gian duyệt trung bình; cảnh báo bất thường (vd user duyệt quá nhanh, duyệt ngoài giờ bất thường) |

## 8. Giao diện liên quan

| STT | Màn hình / Component |
|---|---|
| 1 | `<MOD>.APV.INBOX` — Hộp chờ duyệt (cá nhân + được uỷ quyền), filter/sort/multi-select |
| 2 | `<MOD>.APV.DETAIL` — Chi tiết một GD chờ duyệt: payload, lịch sử, kết quả kiểm tra, comment, file |
| 3 | `<MOD>.APV.ACTION.APPROVE` — Popup xác nhận duyệt (comment, OTP, ký số) |
| 4 | `<MOD>.APV.ACTION.REJECT` — Popup từ chối (lý do, comment) |
| 5 | `<MOD>.APV.ACTION.RETURN` — Popup trả lại (chọn cấp trả về, lý do) |
| 6 | `<MOD>.APV.ACTION.RECALL` — Popup thu hồi (lý do) |
| 7 | `<MOD>.APV.ACTION.BULK` — Popup phê duyệt/từ chối hàng loạt + báo cáo lô |
| 8 | `<MOD>.APV.DELEGATE.NEW` — Tạo quyết định uỷ quyền (người nhận, phạm vi, hạn mức, thời hạn, lý do) |
| 9 | `<MOD>.APV.DELEGATE.LIST` — Danh sách uỷ quyền (đã cấp & nhận); thu hồi |
| 10 | `<MOD>.APV.OUT_OF_OFFICE` — Khai báo vắng mặt + người thay |
| 11 | `<MOD>.APV.MATRIX.ADMIN` — Quản trị ma trận thẩm quyền (versioning, publish, rollback) |
| 12 | `<MOD>.APV.HISTORY` — Lịch sử duyệt theo GD: timeline + chữ ký số + hash |
| 13 | `<MOD>.APV.AUDIT` — Tra cứu audit log (user, hành động, khoảng thời gian, IP) |
| 14 | `<MOD>.APV.NOTIFY` — Notification real-time + email khi có GD chờ, sắp hết SLA, được uỷ quyền |
| 15 | `<MOD>.APV.ESCALATION` — Cấu hình SLA + rule escalation theo loại GD |
| 16 | `<MOD>.APV.SIGN.SETUP` — Đăng ký/quản lý chứng thư số cá nhân; trạng thái còn hạn |
| 17 | `<MOD>.APV.REPORT` — Báo cáo phê duyệt (số lượng, thời gian duyệt, top user/đơn vị, SLA breach, override) |
| 18 | `<MOD>.APV.CONFLICT.CHECK` — Kiểm tra conflict-of-interest trước khi duyệt |
| 19 | `<MOD>.APV.OVERRIDE` — Console override khẩn cấp (quota, lý do, ký số, log nổi bật) |
| 20 | `<MOD>.APV.MOBILE` — App/PWA duyệt trên di động (biometrics + push notification) |
