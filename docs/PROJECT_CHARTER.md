# Project Charter: Hệ thống KBNN - Hiện đại hóa Lệnh Thanh Toán

## 1. Tầm nhìn
Xây dựng hệ thống quản lý Lệnh Thanh Toán (LTT) tập trung, an toàn và hiệu quả, thay thế các quy trình thủ công rời rạc.

## 2. Định hướng Công nghệ (Tech Stack)
Để đảm bảo tính nhất quán, mọi Agent phải tuân thủ khung công nghệ sau:
- **Backend:** Java 21, Spring Boot 3.3.x, Spring Data JPA, Hibernate Envers (Audit).
- **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, shadcn/ui.
- **Database:** Oracle 19c.
- **API Standard:** RESTful API, OpenAPI 3.0, Idempotency Support.

## 3. Nguyên tắc Thiết kế
- **Security First:** Maker-Checker-Approver, Audit Log đầy đủ.
- **Resilience:** Optimistic Locking, Soft Delete, Idempotency.
- **Traceability:** Mọi đoạn code phải ánh xạ về BIZ-ID trong đặc tả nghiệp vụ.
