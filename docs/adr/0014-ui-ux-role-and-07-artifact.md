# ADR-0014: Thêm vai trò UI/UX + sản phẩm bàn giao `07-ui-spec.md`

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 08-05-2026
- **Người quyết định:** SA (chủ trì), Trưởng kỹ thuật UI/UX, tham vấn tất cả vai trò
- **Thẻ:** vai trò, sản phẩm bàn giao, ui, frontend
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

ADR-0010 ghi nhận UX là "tùy chọn, tùy thuộc vào phạm vi UI." TT.OUT.MANUAL có UI tự phục vụ khách hàng + UI quản trị; coi công việc UI là mối quan tâm Dev bị chôn vùi sẽ làm nhầm lẫn phán đoán thiết kế với thực thi mã và mất đi soát xét chuyên trách. `web/index.html` hiện tại của MVP là placeholder vanilla-JS — đủ để thay thế curl, không đủ cho sản phẩm thực tế.

Ba lựa chọn để nâng tầm UI:

- **Hấp thụ vào Dev** — một trong 3 Dev là "trưởng frontend." Mất sản phẩm bàn giao chuyên trách + RACI.
- **Cặp (Designer + Frontend Dev)** — phân loại 10 vai trò, quá nặng cho TT.OUT.MANUAL.
- **Vai trò UI/UX duy nhất** với cả thiết kế + giám sát triển khai — trách nhiệm rõ ràng mà không bùng nổ vai trò.

## Quyết định

Thêm **UI/UX làm vai trò thứ 9** (cùng với PO, BA, SA, DBA, Dev, QA, DevOps, Bảo mật) và **`07-ui-spec.md` làm sản phẩm bàn giao thứ 8 trong vòng đời**.

### Định nghĩa vai trò

| Khía cạnh                     | Giá trị                                                                                                                                                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tỷ lệ mục tiêu (theo ADR-0010) | **60/40** con người/agent                                                                                                                                                                                                   |
| RACI trên `07-ui-spec.md`     | **R/A**: UI/UX; **C**: Dev (tính khả thi), BA (phù hợp yêu cầu), QA (tính kiểm thử được), Bảo mật (bề mặt XSS/CSRF), SA (phù hợp kiến trúc)                                                                                |
| Trạng thái quy trình          | Awaiting → ReviewingRequirements → Drafting07 → InReview07 → Approved07 → ConsultingDev → Operating                                                                                                                         |
| Agent được ủy quyền           | `@claude-opus-reviewer` (phân tích thiết kế component), `@claude-sonnet-test-automator` (scaffold component), `@glm-4-air-doc-drafter` (form boilerplate), `@claude-architect-reviewer` (tính nhất quán UI liên tính năng) |
| Vòng xoay tác giả             | >= 1 `07-ui-spec.md` có nội dung thực chất mỗi quý không có sự hỗ trợ của agent                                                                                                                                             |

### Các mục bắt buộc trong `07-ui-spec.md` (theo cập nhật `manifest.yml`)

- Chân dung người dùng (lấy từ `00-idea`/`01-requirements`)
- Luồng người dùng (sơ đồ trình tự Mermaid cho mỗi luồng chính)
- Kiến trúc thông tin (sơ đồ route, phân cấp điều hướng)
- Đặc tả component (cây thành phần, máy trạng thái, trạng thái loading/error/empty)
- Design tokens (màu sắc, kiểu chữ, khoảng cách, chuyển động)
- **Yêu cầu khả năng tiếp cận (mục tiêu WCAG 2.1 AA)**
- Hợp đồng dữ liệu (endpoint API theo trang, cấu trúc request/response)
- Ngoài phạm vi

Bắt buộc khi tính năng có phạm vi UI; trạng thái `Not Applicable` được chấp nhận cho tính năng chỉ có backend.

### Cơ sở ngăn xếp công nghệ

- **React 18 + TypeScript + Tailwind + TypeScript 5 + Vite + Tailwind 3 + shadcn/ui**
- **TanStack Query** (trạng thái server) + **Zustand** (trạng thái client)
- **React Router v6** (file-based routing tùy chọn ở v2)
- **WCAG 2.1 AA** mục tiêu

Cơ sở đã khóa; sai lệch yêu cầu ADR cục bộ theo tính năng.

### Vị trí trong repo

- **MVP**: thư mục con `frontend/` trong cùng repo mã nguồn (đơn giản của single-repo)
- **Production**: repo riêng theo mô hình multi-repo hybrid ADR-0003 (khi nhóm mở rộng)

## Hệ quả

### Tích cực

- Sản phẩm bàn giao chuyên trách + RACI cho công việc UI; không còn nhầm lẫn.
- Pattern copy-paste-source của shadcn/ui nghĩa là không có phụ thuộc runtime + tùy biến đầy đủ.
- Ngăn xếp công nghệ phù hợp với `02-design.md` ("React + TypeScript") và được đào tạo tốt trong kho ngữ liệu agent.
- Mục tiêu WCAG 2.1 AA có thể kiểm thử (axe-core; xem ADR-0016).

### Tiêu cực / Chi phí

- Vai trò thứ 9 mở rộng danh sách + role-cards + quy trình làm việc; thêm khoảng 1-2 tuần cập nhật nền tảng một lần.
- Pipeline build frontend thêm phụ thuộc Node+Vite trên máy trạm lập trình viên (chi phí thấp; chỉ cần `pnpm install` một lần).
- Copy-paste shadcn nghĩa là cập nhật thủ công khi shadcn tiến hóa; đánh đổi được chấp nhận cho lợi ích không phụ thuộc runtime.

### Trung tính

- `07-ui-spec.md` có điều kiện: tính năng không có UI đánh dấu `Not Applicable`; không phải tính năng nào cũng cần.
- Phân chia TanStack Query + Zustand là tiêu chuẩn ngành nhưng không phổ quát; có thể điều chỉnh theo dự án.

## Các phương án thay thế đã xem xét

### A. Hấp thụ UI vào Dev — Bị loại bỏ

Mất bề mặt soát xét chuyên trách; làm nhầm lẫn các lĩnh vực.

### B. Cặp Designer + Frontend Dev (10 vai trò) — Bị loại bỏ

Quá nặng; dành cho tổ chức trên 30 kỹ sư.

### C. Chỉ có mục con UI trong `02-design.md` — Bị loại bỏ

SA soát xét thiết kế UI; nhầm lẫn với kiến trúc; không ép buộc "phải có mục UI."

### D. Giữ nguyên vanilla JS / HTMX — Bị loại bỏ

Độ bao phủ đào tạo agent yếu hơn; đi ngược lại lựa chọn trong tài liệu thiết kế đã khóa.

## Liên quan

- ADR-0001 — Thư mục theo tính năng + file theo sản phẩm bàn giao (`07-ui-spec.md` là sản phẩm bàn giao thứ 8)
- ADR-0003 — Multi-repo hybrid (chia frontend production)
- ADR-0006 — A-là-chỉ-con-người (vai trò A của UI/UX là con người; agent chỉ R/C)
- ADR-0010 — Thiết kế vai trò con người (UI/UX ở tỷ lệ 60/40)
- ADR-0016 — Chiến lược kiểm thử UI (ADR bổ sung; kiểm thử sản phẩm bàn giao mà ADR này tạo ra)

## Ghi chú cho lần rà soát tới

- **Lựa chọn thư viện component** (shadcn vs Material vs Mantine) — shadcn được chọn vì không phụ thuộc runtime + thân thiện với agent; xem xét lại nếu phát sinh vấn đề khả năng tiếp cận.
- **Phân chia quản lý trạng thái** (TanStack Query + Zustand) — hoạt động ở quy mô MVP; nếu trạng thái toàn cục tăng, cân nhắc Redux Toolkit.
- **Cập nhật shadcn** — thủ công; theo dõi qua comment phiên bản component trong các file nguồn đã sao chép; làm mới định kỳ.
