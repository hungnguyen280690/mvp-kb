# Quy ước Lập trình (Coding Conventions)

## 1. Thư mục (Folder Structure)

- **Backend**: Theo chuẩn Spring Boot (controller, service, repository, entity, dto).
- **Frontend**: Component-based. CSS đi kèm với Component file.

## 2. Đặt tên (Naming)

- **Java**: CamelCase (VD: `PaymentService`).
- **Database**: UPPER_CASE với dấu gạch dưới (VD: `USER_ID`).
- **React**: PascalCase cho Component (VD: `PaymentForm.tsx`), camelCase cho function.

## 3. API Contract

- URL dùng kebab-case: `/api/v1/payment-orders`.
- Request/Response body dùng camelCase.

## 4. Kiểm thử (Testing)

- Backend: Sử dụng JUnit 5, Mockito.
- Frontend: Sử dụng Jest, React Testing Library.
- Bắt buộc mapping ID nghiệp vụ vào tên Test: `test_BR_LTT_01_Success()`.
