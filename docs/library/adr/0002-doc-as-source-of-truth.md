# ADR-0002: Tài liệu là nguồn dữ liệu gốc (Vòng đời nằm trong tài liệu, công việc phát sinh nằm trong Issue, bảng theo dõi là phần hiển thị)

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 07-05-2026
- **Người quyết định:** Kiến trúc sư trưởng (SA), Quản lý sản phẩm (PO), DevOps, tham vấn tất cả các vai trò
- **Thẻ:** quy-trình, nguồn-dữ-liệu-gốc, nền-tảng
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

Chúng ta có trạng thái vòng đời trong phần khai báo đầu file của sản phẩm bàn giao (`status: Draft | In Review | Approved | Superseded`) kết hợp với trạng thái soát xét PR. Điều này bao phủ được **trạng thái vòng đời**, nhưng không bao phủ được **trạng thái vận hành**:

- Ai là người _đang thực hiện lập trình_ tính năng này ngay lúc này?
- Điều gì đang _chặn_ công việc thiết kế cấu trúc DB?
- Những tính năng nào nằm trong _Sprint này_?
- Việc thiết kế thực tế mất bao nhiêu điểm so với dự tính?
- Các _lỗi phát hiện sau khi triển khai_ sẽ nằm ở đâu? (Đây không phải là sự kiện chuyển trạng thái sản phẩm.)
- Các _phiên nghiên cứu (spike)_ và _điều tra_ nằm ở đâu? (Tương tự — không phải sản phẩm bàn giao.)
- Các _phiếu yêu cầu vận hành (ops tickets)_ nằm ở đâu? (Sự cố, dung lượng, lỗ hổng tài liệu vận hành — không phải sản phẩm bàn giao.)

Phản xạ thông thường là thêm GitHub Issues + một bảng dự án (Project board) lên trên hệ thống tài liệu. **Điều này tạo ra hai nguồn dữ liệu gốc song song** cho cùng một sự việc ("trạng thái của công việc"), và hai bề mặt này sẽ bị sai lệch chỉ trong vài tuần. Cụ thể:

- **Trạng thái không khớp**: Tài liệu ghi `Approved`, nhưng issue ghi **In Progress**. Do bot bị chậm hoặc con người quên đóng issue. Không biết cái nào mới đúng.
- **Có issue nhưng thiếu tài liệu**: Issue đã đóng, nhưng tài liệu thiết kế cấu trúc DB chưa bao giờ được cập nhật. Theo định nghĩa của chúng ta, đây là "thiếu sót". Issue ghi nhận sự hoàn thành; tài liệu là bằng chứng của việc đó.
- **Nơi ghi nhận lỗi**: Lỗi sau triển khai không phải là một bước chuyển giai đoạn. Nếu chúng ta ép nó vào biểu đồ sản phẩm, biểu đồ đó sẽ trở nên vô nghĩa. Nếu chúng ta dùng issue, hai bề mặt làm việc sẽ tồn tại song song.
- **Lập kế hoạch Sprint**: Biểu đồ Burndown cần các con số ước tính. Nếu đưa ước tính vào phần khai báo đầu tài liệu sẽ biến tài liệu thành công cụ lập kế hoạch (dễ gây nhiễu). Nếu đưa vào issue, sự sai lệch lại xảy ra.

Chúng ta phải cam kết **mỗi thông tin chỉ có một bề mặt có thẩm quyền duy nhất**.

## Quyết định

**Các sản phẩm bàn giao vòng đời là nguồn dữ liệu gốc cho trạng thái vòng đời. Các Issue là nguồn dữ liệu gốc cho các công việc phát sinh. Bảng theo dõi là một chế độ xem được trích xuất dữ liệu.**

Cụ thể:

| Bề mặt                             | Có thẩm quyền đối với                                                                                                                                 |
| :--------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **File .md + khai báo đầu file**   | `status` (trạng thái), `owners` (người sở hữu), `predecessors` (các sản phẩm trước), `last_synced_with`, `applies_adrs`, `classification` (phân loại) |
| **PR của sản phẩm bàn giao**       | Trạng thái phê duyệt, trộn mã nguồn (merge)                                                                                                           |
| **GitHub Issues**                  | Lỗi (bug), nghiên cứu (spike), phiếu vận hành, các công việc theo dõi, yêu cầu hạ tầng                                                                |
| **Project board / `dashboard.md`** | Chỉ dùng để hiển thị — được sinh ra tự động bởi công cụ kiểm tra (linter) từ phần khai báo đầu file + issue                                           |

**Các quy tắc nghiêm ngặt:**

1. **Các sản phẩm bàn giao vòng đời KHÔNG ĐƯỢC có các issue theo dõi song song.** Vòng đời của chúng chính là bản thân file sản phẩm + PR của nó. Công cụ kiểm tra sẽ từ chối các PR tạo ra issue trùng lặp với sản phẩm bàn giao.
2. **Cấm dùng Issue để theo dõi trùng lặp.** "Đừng mở issue để theo dõi việc thiết kế cấu trúc DB — hãy mở một PR nháp (draft PR) cho file `03-schema.md`."
3. **Việc ước tính và phân bổ Sprint** cho các sản phẩm vòng đời sẽ nằm ở phần khai báo đầu file (`effort_estimate`, `sprint`). Đối với các công việc phát sinh, sẽ nằm ở nhãn (label) của issue.
4. **Bảng theo dõi là chế độ chỉ đọc** đối với con người. Công cụ kiểm tra sẽ tự viết file `dashboard.md` hoặc đẩy dữ liệu lên GitHub Projects v2 thông qua API.
5. **Tối đa ba loại issue**: `bug`, `spike`, `ops`. Các nhãn phân loại: `needs-triage` (cần phân loại), `ready-for-agent` (sẵn sàng cho Agent), `ready-for-human` (sẵn sàng cho người), `wontfix` (không xử lý).

## Hệ quả

### Tích cực

- **Không có sai lệch**: Mỗi thông tin chỉ có một nơi lưu trú duy nhất.
- **Lỗi/nghiên cứu/vận hành có nơi lưu trú sạch sẽ** mà không làm nhiễu biểu đồ sản phẩm bàn giao.
- **Mô hình tư duy duy nhất**: "Đây có phải công việc vòng đời không? Nếu đúng thì dùng PR. Nếu không thì dùng Issue."
- **Bảng theo dõi không bị sai lệch so với nguồn** vì nó được tái tạo tự động.
- **Nhật ký kiểm toán** chính là lịch sử git của các sản phẩm bàn giao — chính thống và không thể thay đổi.

### Hạn chế / Chi phí

- **Người quản lý dự án (PM) quen với việc lập kế hoạch qua issue** phải học lại rằng công việc vòng đời nằm trong PR. Sẽ có sự cản trở về văn hóa trong tháng đầu tiên.
- **Các công cụ báo cáo** (ví dụ: bảng đo tốc độ trong Jira/Linear) không đọc được phần khai báo đầu file Markdown một cách tự nhiên. Công cụ kiểm tra phải xuất dữ liệu cấu trúc (JSON, CSV) cho các công cụ hạ nguồn.
- **Các buổi họp kế hoạch Sprint** sẽ nhìn vào bảng theo dõi được sinh tự động, không phải bảng Jira quen thuộc. Một số PM có thể từ chối điều này; cần đàm phán hoặc xây dựng chế độ xem trên Projects v2 trích xuất từ phần khai báo đầu file.

### Trung lập

- Issue vẫn là một công cụ hữu ích — chúng không bị loại bỏ, chỉ bị giới hạn phạm vi. Việc phân loại lỗi, bàn giao ca trực, kết quả nghiên cứu đều hưởng lợi từ mô hình issue.
- Độ sâu của bảng theo dõi có thể điều chỉnh: bắt đầu với `docs/dashboard.md` (bảng Markdown sinh tự động). Chỉ thêm tích hợp Projects v2 nếu PM yêu cầu giao diện trực quan hơn.

## Các phương án đã cân nhắc

### A. Issue là nguồn dữ liệu gốc, tài liệu là sản phẩm đầu ra (Kiểu PM truyền thống) — Bị loại bỏ

Mọi sản phẩm bàn giao đều có một issue cha; tài liệu là sản phẩm đầu ra của issue. Để đóng issue cần trộn tài liệu vào. **Làm ngược thiết kế** — tài liệu trở thành hạ nguồn. Cách này hoạt động được nhưng mâu thuẫn với định hướng dự án ("chia sẻ các file .md"); chúng ta sẽ phải làm lại các quyết định trước đó.

### B. Cả hai bề mặt độc lập, đồng bộ thủ công — Bị loại bỏ

Là điều mà hầu hết các nhóm vô tình làm. Sai lệch xảy ra trong vòng 2-4 tuần. **Không tương thích với mục tiêu "không thiếu sót"**.

### C. Chỉ dùng tài liệu, không dùng issue — Bị loại bỏ

Lỗi và nghiên cứu không khớp với vòng đời sản phẩm bàn giao. Chúng sẽ bị trôi mất trên Slack. Một số công việc vận hành thực sự không thuộc về biểu đồ SDLC; một hệ thống theo dõi issue sẽ xử lý tốt việc này.

## Liên kết liên quan

- **ADR-0001** — Cấu trúc thư mục theo từng tính năng (nơi lưu giữ trạng thái vòng đời).
- **ADR-0005** — Quy trình kiểm tra quy tắc chất lượng (công cụ sinh bảng theo dõi và từ chối theo dõi song song).
