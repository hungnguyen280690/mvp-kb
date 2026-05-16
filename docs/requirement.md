# Yêu cầu Hệ thống (High-level Requirement) - Quản lý Lệnh Thanh Toán

## 1. Tổng quan
Hệ thống cần cung cấp chức năng quản lý các Lệnh Thanh Toán (LTT) phục vụ nghiệp vụ Kho bạc Nhà nước. Chức năng này cho phép người dùng lập, kiểm soát và phê duyệt các giao dịch thanh toán qua các kênh khác nhau.

## 2. Phạm vi Nghiệp vụ (Scope)
Hệ thống hỗ trợ các luồng nghiệp vụ chính sau:
- **Kênh Thanh toán:** Liên ngân hàng (LNH) và Thanh toán song phương (TTSP).
- **Loại giao dịch:** Chuyển tiền đi, chuyển tiền đến, lệnh chi tiền mặt, lệnh trái phiếu chính phủ.
- **Quy trình phê duyệt:** Áp dụng mô hình 3 lớp chặt chẽ: **Người lập (Maker) -> Người kiểm soát (Checker) -> Người phê duyệt (Approver)**.

## 3. Các tính năng chính (Key Features)
- **Quản lý Danh sách:** Tra cứu, lọc LTT theo nhiều tiêu chí (Kênh, Trạng thái, Số tiền, Thời gian).
- **Lập Lệnh (CRUD):** 
    - Tạo mới LTT với đầy đủ thông tin định danh người chuyển/nhận và thông tin hạch toán (COA/CCID).
    - Cho phép lưu nháp, sửa đổi và xóa (xóa mềm) các lệnh chưa phê duyệt.
- **Xử lý Chứng từ:** Đính kèm hồ sơ, in phiếu giao dịch (PDF).
- **Kiểm soát & Phê duyệt:** 
    - Checker soát xét và chuyển cấp phê duyệt.
    - Approver quyết định phê duyệt cuối cùng hoặc trả lại/từ chối giao dịch.
- **An toàn & Bảo mật:**
    - Ghi nhật ký thay đổi (Audit log) chi tiết từng bước.
    - Cơ chế khóa lạc quan (Optimistic locking) để tránh xung đột dữ liệu.

## 4. Ràng buộc Kỹ thuật (Technical Constraints)
- Hệ thống phải đảm bảo tính toàn vẹn dữ liệu (Atomic).
- Giao diện phải hỗ trợ phím tắt tối ưu cho người dùng nhập liệu cường độ cao.
- Có khả năng mở rộng để tích hợp với các hệ thống Core-Banking hoặc Kế toán hiện có.
