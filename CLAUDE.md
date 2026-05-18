# Phân quyền Orchestration: Multi-Agent Role-Based (MARBO)

Tài liệu này là "Bản Hiến Pháp" (Master Instruction) hướng dẫn cách hệ thống quản lý AI được tổ chức trong dự án **MVP Kho Bạc**. File này ĐÓNG VAI TRÒ NHƯ NGUỒN SỰ THẬT DUY NHẤT cho cơ chế vận hành của AI.

## 1. Triết lý Thiết kế Hệ thống AI (Core Philosophy)

Hệ thống phát triển dựa trên việc chia nhỏ bài toán phức tạp cho nhiều Agent AI chuyên biệt theo mô hình **Multi-Agent Role-Based Orchestration (MARBO)**.
- **Role-Based Isolation**: Mỗi Agent làm việc trong một `workspace/` riêng biệt, được "nhập vai" bởi một file `CLAUDE.md` nội bộ nhằm đảm bảo CÔ LẬP tuyệt đối về mặt ngữ cảnh.
- **Stage-Gate Process**: Quá trình làm phần mềm đi qua nhiều bước tuần tự (BA → Design → Dev → Test). Giữa các bước luôn có "Cổng kiểm duyệt" (Quality Gate).
- **Document-as-Source-of-Truth**: Tránh giao tiếp miệng giữa các Agent. Bàn giao công việc qua tài liệu Markdown.

## 2. Luồng Công Việc 4 Giai Đoạn (Workflow)

Quá trình phát triển một tính năng đi qua 4 giai đoạn chính với 6 Agent chuyên biệt:
1. **Stage 1 (BA)**: **BA Agent** thẩm định yêu cầu, sinh đặc tả chi tiết và thuật ngữ.
2. **Stage 2 (Design)**: Chạy song song 3 Agents (**SA**, **Security**, **UI**).
3. **Stage 3 (Dev)**: **Fullstack Dev Agent** hiện thực hóa toàn bộ API và Giao diện.
4. **Stage 4 (Test)**: **QA Agent** sinh test script và tự động hóa kiểm thử.

## 3. Bản đồ Không gian làm việc (Workspaces Navigation)

Các Agent khi thực thi công việc BẮT BUỘC phải chui vào thư mục `workspaces/` tương ứng của mình để lấy ngữ cảnh. Mọi code/tài liệu sinh ra phải được bắn ra root folder (`../../frontend/`, `../../backend/`), tuyệt đối không lưu code trong workspace.
- Giai đoạn 1: `cd workspaces/ba/`
- Giai đoạn 2: `cd workspaces/sa/` | `cd workspaces/security/` | `cd workspaces/ui/`
- Giai đoạn 3: `cd workspaces/dev/`
- Giai đoạn 4: `cd workspaces/qa/`

## 4. Các Quy chuẩn Bắt buộc (Mandatory Conventions)

- **BẮT BUỘC TẠO PLAN**: Mọi Agent (BA, SA, Dev, QA) phải tạo file Plan trong `gates/` (`BA-Plan`, `SA-Plan`, `Dev-Plan`, `QA-Plan`) và **chờ con người duyệt** trước khi thực hiện bất kỳ hành động nào.
- **Kiến trúc phần mềm & Danh mục Services**: Tham chiếu tại `docs/ARCHITECTURE.md`.
- **Quy tắc đặt tên & Cấu trúc Folder**: Tham chiếu tại `docs/conventions/naming-rules.md`.
- **Từ điển Nền tảng (Hệ thống)**: Tham chiếu tại `docs/CONTEXT.md`.
- **Từ điển Nghiệp vụ (Do BA sinh ra)**: Tham chiếu tại `docs/domain/glossary.md`.
- **Luật Chất lượng & An toàn**: Tham chiếu tại `docs/RULES.md`.
- **Quy trình tổng thể**: Tham chiếu chi tiết tại `docs/WORKFLOW.md`.

## 5. Nguyên tắc Đồng bộ Ngữ cảnh (Context Sync) & Git Branching

Để đảm bảo ngữ cảnh toàn cục không bị thiếu hụt khi nhiều tính năng được làm song song, các Agent phải tuân thủ nghiêm ngặt **Cơ chế Đồng bộ Ngữ cảnh qua Git**:
- **Luôn làm việc trên nhánh (Feature Branch)**: TUYỆT ĐỐI KHÔNG làm việc trực tiếp trên nhánh `main`. Khi nhận tính năng mới (VD: FT-002), phải tạo nhánh `feature/FT-002`.
- **Được phép cập nhật Global Docs**: Các Agent ĐƯỢC PHÉP và BẮT BUỘC phải cập nhật các thay đổi có tính toàn cục thẳng vào thư mục `docs/`. 
  - *Ví dụ*: BA phát hiện thuật ngữ mới -> Cập nhật `docs/domain/glossary.md`. SA thiết kế thêm Service mới -> Cập nhật danh sách vào `docs/ARCHITECTURE.md`.
- **Giải quyết Xung đột qua PR**: Mọi sự xung đột tài liệu toàn cục giữa các tính năng sẽ được giải quyết bởi con người (hoặc AI Reviewer) thông qua Pull Request (PR) lúc merge vào `main`.
- **Nhật ký Sửa đổi (Audit Log)**: BẤT KỲ thay đổi nào trên các file Markdown quan trọng (`CLAUDE.md`, `ARCHITECTURE.md`, `RULES.md`...) đều **BẮT BUỘC phải được ghi lại (append)** vào mục `## Lịch sử Sửa đổi (Audit Log)` ở cuối file đó (Ghi rõ: Ngày, Người sửa/Agent, Tính năng, Nội dung sửa).

---
**BẮT BUỘC ĐỐI VỚI AI AGENTS:** Khi nhận một task mới, việc ĐẦU TIÊN bạn phải làm là xác định mình đang đóng vai trò nào (Role). 

*Làm sao để xác định vai trò?*
1. **Dựa vào chỉ định:** Người dùng yêu cầu đích danh (VD: "Đóng vai BA phân tích...").
5. **Dựa vào trạng thái Sign-off (Cổng kiểm soát):** Hãy dùng lệnh đọc thư mục `gates/` để xem tính năng hiện tại đã được ký duyệt tới đâu:
   - Chưa có file Sign-off nào -> Bạn là **BA Agent** (Stage 1).
   - Đã có `FT-XXX-G1-ba-signoff.md` -> Bạn là **SA / Security / UI** (Stage 2).
   - Đã có `FT-XXX-G2-sa-signoff.md` -> Bạn là **Fullstack Dev Agent** (Stage 3).
   - Đã có `FT-XXX-G3-dev-signoff.md` -> Bạn là **QA Agent** (Stage 4).

Sau khi xác định được vai trò, lập tức `cd` vào thư mục `workspaces/<role>/` tương ứng và **đọc thuộc lòng** file `CLAUDE.md` ở đó trước khi thực thi bất cứ lệnh nào khác. Không tạo ra các tài liệu quản lý Orchestration ở những nơi khác gây mâu thuẫn.

---
## Lịch sử Sửa đổi (Audit Log)
- **2026-05-17** | **System** | Rút gọn vai trò DBA vào SA, chuẩn hóa đặt tên sign-off theo chuẩn mã Feature (FT-XXX).
- **2026-05-17** | **System** | Gộp `Dev-BE` và `Dev-FE` thành `Fullstack Dev Agent`. Rút gọn thành 4 Stage và 6 Agents.