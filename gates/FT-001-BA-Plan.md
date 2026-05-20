# BA-Plan: FT-001 — PAY.OUT.MANUAL (Lệnh Thanh Toán Đi Thủ Công)

**Tính năng:** FT-001 — PAY.OUT.MANUAL  
**Ngày:** 2026-05-19  
**Agent:** BA Agent  
**Trạng thái:** CHO HUMAN DUYET

---

## 1. Tính năng & Luồng Nghiệp Vụ

Tính năng FT-001 bao gồm 7 luồng nghiệp vụ chính đã nhận diện từ file spec `features/FT-001/PAY.OUT.MANUAL.CRUD_spec_function.md`:

| #   | Luồng                   | Mô tả ngắn                                                |
| --- | ----------------------- | --------------------------------------------------------- |
| 1   | **Tạo lệnh thanh toán** | Maker tạo draft → submit lệnh thanh toán đi thủ công      |
| 2   | **Chỉnh sửa lệnh**      | Maker edit lệnh ở trạng thái draft hoặc rejected          |
| 3   | **Duyệt lệnh**          | Checker review → Approver approve hoặc reject lệnh        |
| 4   | **Xem danh sách lệnh**  | PAY.OUT.MANUAL.LIST với filter/search theo nhiều tiêu chí |
| 5   | **Xóa lệnh**            | Soft delete, chỉ áp dụng cho lệnh ở trạng thái draft      |
| 6   | **Xuất dữ liệu**        | Export danh sách/chi tiết lệnh ra Excel/PDF               |
| 7   | **Sao chép lệnh**       | Copy lệnh cũ để tạo lệnh mới nhanh hơn                    |

---

## 2. Kế Hoạch Thực Hiện

Các bước BA Agent sẽ thực hiện sau khi được Human duyệt Plan này:

### Bước 1 — Xác định Scope MVP

- Rà soát toàn bộ 739 dòng spec để xác định các yêu cầu nằm trong phạm vi MVP và các yêu cầu ngoài scope (out-of-scope).
- Làm rõ điều kiện tiên quyết (preconditions) cho từng luồng.

### Bước 2 — Phân tích Tác động Nghiệp vụ (Business Impact)

- Xác định các đối tượng liên quan (stakeholders): Maker, Checker, Approver, Supervisor.
- Đánh giá tác động lên quy trình nghiệp vụ KBNN hiện tại.
- Xác định các ràng buộc nghiệp vụ (business constraints) đặc thù của Kho Bạc Nhà Nước.

### Bước 3 — Nhận diện Mâu thuẫn & Điểm chưa rõ

- Liệt kê mọi mâu thuẫn, thiếu sót, hoặc điểm chưa rõ trong spec.
- Đề xuất cách giải quyết hoặc đánh dấu cần làm rõ với Product Owner.

### Bước 4 — Viết BDD Scenarios

- Chuyển hóa 100% yêu cầu trong spec thành các kịch bản BDD (Gherkin).
- Đảm bảo bao phủ đủ 3 tầng cho mỗi luồng:
  - Happy path (Luồng chính)
  - Alternative path (Luồng rẽ nhánh)
  - Exception path (Luồng lỗi)

### Bước 5 — Cập nhật Từ điển Nghiệp vụ (Glossary)

- Nhận diện tất cả thuật ngữ nghiệp vụ mới phát sinh từ FT-001.
- Cập nhật/bổ sung vào `docs/domain/glossary.md`.

### Bước 6 — Tạo Sign-off G1

- Tạo file `gates/FT-001-G1-ba-signoff.md` tổng hợp toàn bộ output BA.
- Chờ Human ký duyệt G1 để chuyển sang Stage 2 (SA Agent).

---

## 3. Checklist G1 (Cổng Kiểm Soát Giai Đoạn 1 — BA)

- [ ] Kế thừa Spec: 100% yêu cầu trong file Spec của BA_Human đã được chuyển hóa thành BDD scenarios?
- [ ] Scope & Impact: Đã xác định rõ phạm vi MVP, các điểm mâu thuẫn và tác động nghiệp vụ (Business Impact) chưa?
- [ ] BDD Granularity: Các kịch bản BDD đã bao phủ đủ 3 tầng: Luồng chính (Happy path), Luồng rẽ nhánh (Alternative), và Luồng lỗi (Exceptions)?
- [ ] Context Sync: Mọi thuật ngữ nghiệp vụ mới đã được định nghĩa trong docs/domain/glossary.md?

---

## 4. Ghi Chú Chờ Duyệt

> CHO HUMAN DUYET: Vui lòng xác nhận từng mục checklist trước khi BA Agent tiến hành các bước tiếp theo.
