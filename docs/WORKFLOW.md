# Quy trình Phát triển (Workflow & Stage-Gate)

Dự án áp dụng luồng làm việc **Siêu Tối Giản (Ultra-Minimalist)**. Chúng ta loại bỏ hoàn toàn các loại tài liệu rườm rà (YAML, ma trận phức tạp) để tập trung vào mã nguồn và một số ít tài liệu cốt lõi có giá trị thực tiễn cao.

Mọi tính năng mới (Feature) đều phải đi qua 4 giai đoạn tuần tự. Đầu ra của giai đoạn này là đầu vào của giai đoạn sau. Giữa các giai đoạn là Cổng kiểm duyệt (Gate Sign-off).

## Bản đồ Đầu ra (Artifacts Mapping) theo Tính năng
Khi phát triển một tính năng (VD: `features/FT-001/`), các Agent chỉ được phép sinh ra các file định chuẩn sau đây. **Sign-off chỉ được ký khi các file này đã tồn tại và đạt chất lượng.**

```text
features/FT-001/
├── 01-business-spec.md   (Do BA sinh ra)
├── 02-design.md          (Do SA sinh ra)
├── 03-schema.sql         (Do SA sinh ra)
├── 06-threat-model.md    (Do Security sinh ra - Tùy chọn)
└── 07-ui-spec.md         (Do UI/UX sinh ra - Tùy chọn)
```

---

## GIAI ĐOẠN 1 — BA (Phân tích Nghiệp vụ)

- **Đầu vào**: Yêu cầu thô từ Product Owner (PO).
- **Trách nhiệm của BA Agent**:
  1. Sinh ra **DUY NHẤT MỘT FILE** đặc tả: `features/FT-XXX/01-business-spec.md` (chứa trọn vẹn Use Case, Acceptance Criteria).
  2. Bắt buộc cập nhật các thuật ngữ mới vào `docs/domain/glossary.md` (Context Sync).
- **BA Readiness Check (Cross-Review bởi SA)**: SA Agent đọc `01-business-spec.md` và đánh giá có đủ rõ để thiết kế không. SA sinh file `gates/FT-XXX-G1-ba-readiness.md` với status `APPROVED` hoặc `REJECTED`. Nếu REJECTED, BA sửa theo feedback rồi xin review lại.
- **Cổng G1 (BA Sign-off)**: Chỉ khi SA đã `APPROVED` readiness check, con người kiểm tra file `01-business-spec.md` có dễ hiểu không, từ vựng đã được update chưa. Nếu OK -> Sinh file `gates/FT-XXX-G1-ba-signoff.md`.

## GIAI ĐOẠN 2 — Thiết kế Kỹ thuật (Design)

- **Đầu vào**: File `01-business-spec.md`.
- **Trách nhiệm của các Agent**:
  - **SA Agent**: Thiết kế giải pháp tổng thể, sinh file `features/FT-XXX/02-design.md`, hợp đồng `contracts/openapi.yaml`, và thiết kế CSDL `features/FT-XXX/03-schema.sql`. Nếu có service mới, SA phải update vào `docs/ARCHITECTURE.md`.
  - **Security / UI Agents** (Tùy chọn cho MVP): Sinh file `06` và `07` nếu tính năng yêu cầu độ bảo mật/giao diện phức tạp.
- **Cổng G2 (Design Sign-off)**: Con người kiểm tra API Contract và Schema DB. Đảm bảo đủ file Artifact. Nếu OK -> Sinh file `gates/FT-XXX-G2-design-signoff.md`.

## GIAI ĐOẠN 3 — Lập trình (Dev)

- **Đầu vào**: OpenAPI Contract và Schema SQL đã chốt ở Gate 2.
- **Trách nhiệm của Fullstack Dev Agent**:
  1. **Plan-First & TDD**: Viết Test Case (cho cả BE và FE) vào kế hoạch (`gates/FT-XXX-Dev-Plan.md`) xin duyệt trước.
  2. Khi được duyệt Test, bắt đầu sinh mã nguồn Java (backend) và React (frontend) đảm bảo đồng bộ hoàn toàn với API Contract.
- **Cổng G3 (Dev Sign-off)**: Test phải Pass 100% (local). Coverage đạt chuẩn. Nếu OK -> Sinh file `gates/FT-XXX-G3-dev-signoff.md`.

## GIAI ĐOẠN 4 — Kiểm thử (QA)

- Dành cho QA Agent để lo việc viết kịch bản test tự động (E2E). Giai đoạn này chỉ kích hoạt khi code ở Giai đoạn 3 đã hoàn thiện trơn tru.

---

## ⚠️ Tiêu chuẩn Ký duyệt (Sign-off Discipline)

Để chống tình trạng AI chạy lung tung hoặc tạo rác:
1. **Không nhảy cóc**: Không có file `G1` thì cấm SA làm việc. Không có file `G2` thì cấm Dev viết code.
2. **Cam kết đủ File**: File `FT-XXX-G*-signoff.md` phải liệt kê rõ đường dẫn (path) của các file Artifact đã sinh ra. (Ví dụ Sign-off G2 phải ghi rõ: *Đã duyệt 02-design.md và 03-schema.sql*). Nếu thiếu file, không được ký.
3. **Đóng băng**: File nào đã qua cổng Sign-off sẽ bị "đóng băng" (Frozen). Cấm các Agent tự ý lùi lại sửa file của Phase trước để lấp liếm lỗi. Muốn sửa, phải yêu cầu con người gỡ Sign-off.

---
## Lịch sử Sửa đổi (Audit Log)
- **2026-05-17** | **System** | Gộp Dev-BE và Dev-FE thành Fullstack Dev Agent, rút gọn quy trình còn 4 Stage.