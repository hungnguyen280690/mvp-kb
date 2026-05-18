# Quy tắc Chung của Dự án (Global Rules)

Tài liệu này chứa các quy tắc bắt buộc áp dụng cho mọi Agent và con người khi tham gia dự án.

## 1. Quy tắc Vận hành (Operational Rules)

- **Rule 1.1: Plan-First.** Mọi thay đổi cấu trúc (API, Code logic) đều phải có file Plan trong `gates/` và được duyệt trước khi thực thi.
- **Rule 1.2: TDD Bias Prevention.** Agent không được tự ý sinh test sau khi viết code. Test phải được viết trước, duyệt trước.
- **Rule 1.3: Traceability.** Mọi function, API endpoint, hoặc test case đều phải có comment chứa ID nghiệp vụ tương ứng (VD: `// BR-LTT-01`).
- **Rule 1.4: Context Evolution (BẮT BUỘC).** Bất kỳ thuật ngữ nghiệp vụ nào mới nảy sinh khi phân tích tính năng phải được BA Agent cập nhật (append) ngay lập tức vào `docs/domain/glossary.md`. Các Agent giai đoạn sau (SA, Dev) BẮT BUỘC phải tham chiếu file này trước khi sinh code để đảm bảo Naming Convention (VD: "Đơn vị sử dụng ngân sách" phải map đúng tên biến là `dvsdns` ở mọi nơi).
- **Rule 1.5: Safe Execution (BẮT BUỘC).** Cấm tuyệt đối các hành vi phá hoại hệ thống mã nguồn. Cụ thể: Không sử dụng lệnh `rm -rf /` hoặc `rm` bừa bãi. Không dùng lệnh `git push --force` lên nhánh `main`. Không được tự ý sửa các file Gate Sign-off (`G*-signoff.md`) đã được con người ký duyệt.
- **Rule 1.6: Output Completeness / Anti-Hallucination.** Cấm AI sử dụng các từ ngữ lấp lửng (Hedge phrases) mang tính phỏng đoán hoặc thiếu chắc chắn như "TBD", "as needed", "tùy yêu cầu thực tế". Nếu thực sự thiếu thông tin đầu vào, AI BẮT BUỘC phải đặt marker `<<MISSING-INFO: lý do chi tiết>>` để con người có thể tìm và bổ sung. Tương tự, nếu có quyết định vượt thẩm quyền, phải dùng marker `<<PENDING-DECISION: câu hỏi>>`.

## 2. Quy tắc Thiết kế & API (SA Rules)

- **Rule 2.1: Database Schema Management.** Mọi thay đổi cấu trúc Database (CREATE/ALTER TABLE) BẮT BUỘC phải được định nghĩa rõ ràng trong file `03-schema.sql` của thư mục tính năng hiện tại (`features/FT...`) và phải được phê duyệt trước khi code. Không tự ý chỉnh sửa Database trực tiếp.
- **Rule 2.2: Security by Design.** Mọi API phải định nghĩa Security Schema (JWT/OAuth2) và trả về đúng mã lỗi HTTP (401, 403, 400).
- **Rule 2.3: Idempotency.** Các API giao dịch tiền tệ (LTT) phải có `X-Request-ID` để chống lặp lệnh.

## 3. Quy tắc Lập trình (Dev Rules)

- **Rule 3.1: Tech Stack Compliance.** BE sử dụng Java Spring Boot. FE sử dụng React + Tailwind CSS + shadcn/ui (như đã quy định tại ARCHITECTURE.md). Tuyệt đối không tự ý import thêm thư viện ngoài danh sách cho phép.
- **Rule 3.2: Maker-Checker logic.** Mọi luồng phê duyệt phải đảm bảo `maker_id != checker_id`. Kiểm tra rule này ở cả tầng Service và Database constraint.
- **Rule 3.3: Audit Trail.** Các thao tác tác động dữ liệu phải ghi log vào bảng Audit với cơ chế Hash Chain (PrevHash + Payload -> CurrentHash).
- **Rule 3.4: Fail Fast & Negative Tests.** Các hàm logic phải bắt đầu bằng khối kiểm tra điều kiện (Guard Clauses). Phải có ít nhất một Negative Test Case cho mỗi quy tắc nghiệp vụ để chứng minh mã nguồn ném lỗi (Exception) đúng chỗ.
- **Rule 3.5: Ready to Change (Low Coupling).** Mã nguồn phải module hóa, hàm nhỏ (dưới 20 dòng), không lặp lại (DRY). Phải sử dụng Interface cho tầng Service. Tuyệt đối không hardcode logic nghiệp vụ vào code.

## 4. Quy tắc Kiểm thử (Test Rules)

- **Rule 4.1: Coverage Target.** Độ bao phủ Unit Test (Code Coverage) phải đạt mức tối thiểu **90%** logic nghiệp vụ. Không cố ép 100% để tránh rác (junk tests).
- **Rule 4.2: Frozen Test.** Kịch bản Test sau khi được duyệt tại Gate sẽ bị "đóng băng". Tuyệt đối không được sửa Test để lấp liếm lỗi code. Muốn sửa Test phải quay lại bước lập Plan.
- **Rule 4.3: Isolation.** Unit Test không được kết nối database thật. Sử dụng Mocking/H2 Database.

## 5. Quy tắc Kiểm thử Cơ bản (Smoke Test Rules)

- **Rule 5.1: Smoke Test.** Mọi tính năng phải có `scripts/smoke-test.sh` pass (build + unit test) trước khi xin Dev Sign-off (Gate G3).
- **Rule 5.2: API Smoke Test.** Khi service đang chạy, mọi endpoint phải phản hồi HTTP 2xx. Kiểm tra bằng `scripts/smoke-api.sh`. Bắt buộc cho QA Sign-off (Gate G4).
- **Rule 5.3: Test Data.** Mọi tính năng phải có file `features/FT-XXX/08-test-data.md` chứa dữ liệu mẫu để chạy test (INSERT SQL hoặc JSON payload).
- **Rule 5.4: Plan-First for ALL Agents.** Mọi Agent (BA, SA, Dev, QA) BẮT BUỘC tạo Plan file trong `gates/` (`BA-Plan`, `SA-Plan`, `Dev-Plan`, `QA-Plan`) và chờ con người duyệt trước khi hành động.

## 6. Quy tắc Bảo mật (Security Rules)

- **Rule 6.1: No Secrets.** Tuyệt đối không commit API Key, Password vào mã nguồn. Sử dụng `.env` hoặc Secret Manager.
- **Rule 6.2: Data Masking.** Các thông tin nhạy cảm (Số tài khoản, Số CMT) phải được che (masking) khi hiển thị trên UI hoặc ghi log.

---
## Lịch sử Sửa đổi (Audit Log)
- **2026-05-18** | **System** | Thêm Section 5: Smoke Test Rules (5.1-5.4). Đổi Security Rules thành Section 6.
- **2026-05-17** | **System** | Cập nhật Rule 1.4 (Context Evolution), Rule 2.1 (Schema.sql), Rule 3.1 (Tailwind CSS).
