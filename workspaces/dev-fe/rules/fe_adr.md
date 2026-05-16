# Frontend Rules: Phát triển giao diện React/TypeScript

Tài liệu này định nghĩa các quy chuẩn kỹ thuật cho Dev-FE Agent.

## 1. Stack Công nghệ (ADR-014)
- **Framework:** React 18 + Vite + TypeScript.
- **Styling:** Tailwind CSS + shadcn/ui.
- **State Management:** TanStack Query (cho server state) + Zustand (cho client state).

## 2. Đặc tả UI/UX & Component
- **Component Pattern:** Sử dụng mô hình Atomic Design hoặc Container/Presenter. Ưu tiên sử dụng các component từ `shadcn/ui`.
- **Form Handling:** Sử dụng `react-hook-form` kết hợp với `zod` để validate.
- **API Client:** Tuyệt đối không viết fetch/axios thủ công. Phải sử dụng công cụ codegen để sinh API client từ `contracts/openapi.yaml`.

## 3. Quy tắc "Tử huyệt"
- **Maker-Checker UI flow:** Giao diện phải thay đổi dựa trên vai trò người dùng (ẩn/hiện nút bấm theo `spec_button.md`).
- **Optimistic Locking:** Khi gửi request cập nhật, phải lấy `F_VER` hiện tại và gửi lên qua Header `If-Match`.
- **Accessibility:** Đảm bảo đạt chuẩn WCAG 2.1 AA (sử dụng đúng thẻ HTML, có ARIA label).

## 4. Kiểm thử UI (ADR-016)
- Viết Unit test cho Component bằng Vitest + React Testing Library.
- Viết E2E test cho các luồng nghiệp vụ quan trọng (Lập lệnh -> Duyệt) bằng Playwright hoặc Cypress.
