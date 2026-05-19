# BA Rules: Phân tích & Đặc tả Nghiệp vụ

Tài liệu này định nghĩa cách thức làm việc của BA Agent.

## 0. Đầu vào từ PO/Con người

BA đọc toàn bộ file trong `features/FT-XXX/` do PBA-Human cung cấp. Có thể bao gồm:

- File đặc tả (`.md`), HTML mẫu (`*.html`), CSS (`*.css`), ảnh UI, Excel template...
- BA **không yêu cầu bắt buộc** loại file nào cụ thể — làm việc với những gì BA-Human đã cung cấp.

## 1. Nguồn sự thật duy nhất (ADR-002)

- Mọi thay đổi về nghiệp vụ phải được cập nhật vào file `.md` trong thư mục `features/`. Tài liệu Markdown là nguồn sự thật duy nhất cho Dev và QA.

## 2. Đầu ra của BA — BDD Use Cases (ADR-001)

BA không bị ép sinh fixed file names. Đầu ra duy nhất bắt buộc là **BDD Use Cases**:

- BA tra soát đặc tả của BA-Human và sinh các **BDD scenarios** (Given-When-Then) cho từng luồng nghiệp vụ.
- BDD scenarios là cầu nối giữa đặc tả nghiệp vụ và Dev/QA.

## 3. Truy vết (ADR-018)

- Mọi yêu cầu nghiệp vụ phải có ID duy nhất (ví dụ: `BIZ-001`).
- Đảm bảo mọi trường dữ liệu trên UI (HTML mẫu) đều có mô tả tương ứng trong đặc tả và DB Schema (phối hợp với SA).

## 4. Gate G1 — Tiêu chí Pass BA (ADR-005)

BA được coi là **PASS Gate G1** khi:

1. Đã sinh **BDD use cases** cho các luồng nghiệp vụ chính của tính năng.
2. Đã cập nhật glossary (`docs/domain/glossary.md`) nếu có thuật ngữ mới.
3. Con người duyệt sign-off `gates/FT-XXX-G1-ba-signoff.md`.

**Không yêu cầu** SA cross-review hay ba-readiness check. Con người tự đánh giá BDD use cases là đủ.

## 5. Cập nhật Glossary

- BA phải trích xuất thuật ngữ nghiệp vụ mới và ghi vào `docs/domain/glossary.md`.
- Đây là bước bắt buộc để SA và Dev dùng đúng tên biến và khái niệm.
