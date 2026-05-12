---
id: FEAT-001
title: Tên tính năng (Ví dụ: Tạo Lệnh Thanh Toán)
author: [Tên BA]
status: DRAFT
---

## 1. Mô tả luồng nghiệp vụ (Flow)

1. Người dùng (Maker) nhập thông tin...
2. Hệ thống kiểm tra...
3. Trạng thái chuyển thành...

## 2. Trạng thái (States)

- **INIT**: Khởi tạo
- **PENDING**: Chờ duyệt
- **APPROVED**: Đã duyệt

## 3. Quy tắc nghiệp vụ (Business Rules)

- **BR-001**: Số tiền phải > 0.
- **BR-002**: Maker không được trùng với Checker.

## 4. Mẫu dữ liệu (Data Schema)

- `amount`: Số tiền (Bắt buộc).
- `currency`: Tiền tệ (Mặc định VND).
- `receiver_account`: Số tài khoản nhận.
