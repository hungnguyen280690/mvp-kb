# BA Plan — FT-001

## 1. Tính năng
FT-001: Luồng nghiệp vụ Lệnh Thanh Toán đi thủ công (TT.OUT.MANUAL) — 7 sub-flow.

## 2. Đầu vào đã có
PO đã cung cấp đầy đủ:
- CRUD: spec_field + spec_button + spec_function + 11 HTML mockups + CSS
- Approval/E-Sign/Outbound/Inbound: spec_function
- Report/Role: spec_field + spec_button + spec_function + HTML mockups
- General: BangDacTaChucNang (Inquiry + TichHopRa)
- Spec_Role.md (phân quyền)

## 3. Kế hoạch
BA chỉ cần **tra soát** đặc tả PO và sinh **BDD use cases** cho 7 sub-flow:
1. CRUD — BDD (luồng chính: tạo/sửa/xoá/submit + state machine)
2. Approval — BDD (maker-checker-approver + delegation + batch)
3. E-Sign — BDD (ký số + verify + batch)
4. Outbound — BDD (gửi đi + retry + DLQ)
5. Inbound — BDD (nhận + validate + map)
6. Report — BDD (tra cứu + xuất + in)
7. Role — BDD (CRUD role + phân quyền)

## 4. Glossary update
Kiểm tra và bổ sung `docs/domain/glossary.md` nếu thiếu thuật ngữ.

---
- **Trạng thái**: ĐỢI DUYỆT
