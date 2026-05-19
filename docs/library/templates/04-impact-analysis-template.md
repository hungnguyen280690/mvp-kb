# Báo cáo Phân tích Tác động (Impact Analysis) - {{FEATURE_ID}}

Tài liệu này dùng để ghi nhận các tác động của tính năng mới đến hệ thống hiện có, giúp đảm bảo tính ổn định và xác định phạm vi kiểm thử hồi quy.

---

## 1. Business Impact (BA Agent)

_Mục tiêu: Xác định tác động đến quy trình nghiệp vụ và người dùng._

- **Quy trình bị ảnh hưởng:** (VD: Quy trình Phê duyệt LTT, Quy trình Đối soát...)
- **Vai trò người dùng bị ảnh hưởng:** (VD: Kế toán viên, Kiểm soát viên...)
- **Báo cáo/Đầu ra bị ảnh hưởng:** (VD: Sổ cái, Bảng kê thanh toán...)
- **Thay đổi về mặt nghiệp vụ:** (Mô tả tóm tắt sự thay đổi so với hiện tại)

---

## 2. System Impact (SA Agent)

_Mục tiêu: Xác định tác động đến kiến trúc, API và CSDL._

- **Dịch vụ (Services) bị ảnh hưởng:** (VD: ltt-core, integration-gateway...)
- **API bị ảnh hưởng:** (Liệt kê các endpoint cũ cần sửa đổi hoặc logic bị thay đổi)
- **Cấu trúc dữ liệu (Database):** (Các bảng bị ALTER hoặc logic trigger/function bị tác động)
- **Bảo mật (Security):** (Ảnh hưởng đến phân quyền Role-based Access Control hiện có)

---

## 3. Code Impact (Dev Agent)

_Mục tiêu: Xác định các thành phần mã nguồn cụ thể cần can thiệp._

- **Backend (Java):** (Danh sách các Class, Service, Repository hiện có cần sửa đổi)
- **Frontend (React):** (Danh sách các Component, Page, Hook dùng chung bị tác động)
- **Shared Packages:** (Tác động đến `core-utils` hoặc `ui-shared`)
- **Unit/Integration Tests cũ:** (Danh sách các test case hiện có cần cập nhật theo logic mới)

---

## 4. Regression Test Scope (QA Agent)

_Mục tiêu: Xác định phạm vi kiểm thử hồi quy dựa trên các tác động trên._

- **Vùng kiểm thử tập trung:** (Dựa trên mục 1, 2, 3 để chốt các module cần test kỹ)
- **Kịch bản hồi quy (Regression Scenarios):** (Liệt kê các luồng cũ cần chạy lại để đảm bảo không lỗi)
- **Dữ liệu kiểm thử hồi quy:** (Sử dụng dữ liệu trong `08-test-data.md`)
