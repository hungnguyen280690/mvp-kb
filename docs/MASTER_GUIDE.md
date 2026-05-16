# MASTER GUIDE: Điều phối Hệ thống Multi-Agent Kho Bạc

Chào mừng bạn (Human Orchestrator) đến với trung tâm điều phối của dự án **MVP Kho Bạc**. Tài liệu này hướng dẫn cách vận hành luồng công việc giữa các Agent AI theo mô hình **Context Isolation** (Cô lập ngữ cảnh).

## 1. Triết lý Vận hành
Chúng ta không bắt AI phải ghi nhớ hàng trăm trang tài liệu. Thay vào đó, chúng ta chia nhỏ dự án thành các **Workspaces** (Không gian làm việc) chuyên biệt. 
- Mỗi Agent chỉ được nạp các quy tắc (ADR) liên quan trực tiếp đến vai trò của nó.
- Con người đóng vai trò là "Nhịp trưởng", chuyển giao sản phẩm giữa các workspace thông qua thư mục `contracts/` và `features/`.

## 2. Bản đồ Workspace & Quy tắc (ADR)

| Workspace | Vai trò | Quy tắc cốt lõi (Xem trong `rules/`) |
| :--- | :--- | :--- |
| **`workspaces/ba`** | Phân tích nghiệp vụ | Cấu trúc tính năng (ADR-001), Tài liệu là nguồn sự thật (ADR-002), Truy vết (ADR-018) |
| **`workspaces/sa`** | Kiến trúc & Thiết kế | Quy tắc A-là-Người (ADR-006), Ma trận phê duyệt (ADR-008), Thiết kế API/DB |
| **`workspaces/dev-be`** | Phát triển Backend | Quy tắc an toàn AI (ADR-009), Tính hoàn thiện đầu ra (ADR-017), Java/Spring standards |
| **`workspaces/dev-fe`** | Phát triển Frontend | Đặc tả UI/UX (ADR-014), Chiến lược test UI (ADR-016), React/Tailwind standards |
| **`workspaces/qa`** | Kiểm thử | Dữ liệu test (ADR-015), Quy trình kiểm thử đa tầng |
| **`workspaces/devops`** | Triển khai | Quản lý chi phí AI (ADR-012), Vòng đời quy tắc (ADR-005) |

## 3. Luồng Chuyển giao (Handoff)
1. **PO** -> `docs/requirement.md`: Đưa ra yêu cầu High-level.
2. **BA** (`workspaces/ba`) -> `features/`: Rã yêu cầu thành đặc tả chi tiết.
3. **SA** (`workspaces/sa`) -> `contracts/` & `workspaces/dba`: Thiết kế OpenAPI và SQL Schema.
4. **Dev** (`workspaces/dev-be` & `dev-fe`) -> `backend/` & `frontend/`: Thực thi code dựa trên Contract.

## 4. Quy tắc "Tử huyệt" (Bắt buộc)
- **Agent tuyệt đối không đóng vai trò A (Accountable):** Mọi quyết định cuối cùng và ký duyệt Gate phải do con người thực hiện (ADR-006).
- **Contract-first:** Không được viết code trước khi có OpenAPI được duyệt.
- **Traceability:** Mọi đoạn code phải ánh xạ được về một yêu cầu nghiệp vụ trong `features/`.

---
*Tài liệu này là "Neo" cho con người. Khi điều phối Agent, hãy đảm bảo Agent đó đã đọc file `CLAUDE.md` trong workspace tương ứng.*
