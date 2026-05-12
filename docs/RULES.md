# Quy tắc Chung của Dự án (Global Rules)

Tài liệu này chứa các quy tắc bắt buộc áp dụng cho mọi Agent và con người khi tham gia dự án.

## 1. Quy tắc Vận hành (Operational Rules)

- **Rule 1.1: Plan-First.** Mọi thay đổi cấu trúc (API, Code logic) đều phải có file Plan trong `gates/` và được duyệt trước khi thực thi.
- **Rule 1.2: TDD Bias Prevention.** Agent không được tự ý sinh test sau khi viết code. Test phải được viết trước, duyệt trước.
- **Rule 1.3: Traceability.** Mọi function, API endpoint, hoặc test case đều phải có comment chứa ID nghiệp vụ tương ứng (VD: `// BR-LTT-01`).

## 2. Quy tắc Thiết kế & API (SA Rules)

- **Rule 2.1: Database Respect.** Tuyệt đối không sinh lệnh `ALTER/CREATE TABLE` trừ khi có yêu cầu đặc biệt. Phải sử dụng Schema có sẵn trong `docs/ARCHITECTURE.md`.
- **Rule 2.2: Security by Design.** Mọi API phải định nghĩa Security Schema (JWT/OAuth2) và trả về đúng mã lỗi HTTP (401, 403, 400).
- **Rule 2.3: Idempotency.** Các API giao dịch tiền tệ (LTT) phải có `X-Request-ID` để chống lặp lệnh.

## 3. Quy tắc Lập trình (Dev Rules)

- **Rule 3.1: Tech Stack Compliance.** BE sử dụng Java Spring Boot. FE sử dụng React + Vanilla CSS. Không dùng thư viện lạ ngoài danh sách cho phép.
- **Rule 3.2: Maker-Checker logic.** Mọi luồng phê duyệt phải đảm bảo `maker_id != checker_id`. Kiểm tra rule này ở cả tầng Service và Database constraint.
- **Rule 3.3: Audit Trail.** Các thao tác tác động dữ liệu phải ghi log vào bảng Audit với cơ chế Hash Chain (PrevHash + Payload -> CurrentHash).
- **Rule 3.4: Fail Fast & Negative Tests.** Các hàm logic phải bắt đầu bằng khối kiểm tra điều kiện (Guard Clauses). Phải có ít nhất một Negative Test Case cho mỗi quy tắc nghiệp vụ để chứng minh mã nguồn ném lỗi (Exception) đúng chỗ.
- **Rule 3.5: Ready to Change (Low Coupling).** Mã nguồn phải module hóa, hàm nhỏ (dưới 20 dòng), không lặp lại (DRY). Phải sử dụng Interface cho tầng Service. Tuyệt đối không hardcode logic nghiệp vụ vào code.

## 4. Quy tắc Kiểm thử (Test Rules)

- **Rule 4.1: Coverage Target.** Độ bao phủ Unit Test (Code Coverage) phải đạt mức tối thiểu **90%** logic nghiệp vụ. Không cố ép 100% để tránh rác (junk tests).
- **Rule 4.2: Frozen Test.** Kịch bản Test sau khi được duyệt tại Gate sẽ bị "đóng băng". Tuyệt đối không được sửa Test để lấp liếm lỗi code. Muốn sửa Test phải quay lại bước lập Plan.
- **Rule 4.3: Isolation.** Unit Test không được kết nối database thật. Sử dụng Mocking/H2 Database.

## 5. Quy tắc Bảo mật (Security Rules)

- **Rule 5.1: No Secrets.** Tuyệt đối không commit API Key, Password vào mã nguồn. Sử dụng `.env` hoặc Secret Manager.
- **Rule 5.2: Data Masking.** Các thông tin nhạy cảm (Số tài khoản, Số CMT) phải được che (masking) khi hiển thị trên UI hoặc ghi log.
