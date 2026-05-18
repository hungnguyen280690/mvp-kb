# Quy trình Phát triển (Workflow & Stage-Gate)

Dự án áp dụng luồng làm việc **Siêu Tối Giản (Ultra-Minimalist)**. Chúng ta loại bỏ hoàn toàn các loại tài liệu rườm rà (YAML, ma trận phức tạp) để tập trung vào mã nguồn và một số ít tài liệu cốt lõi có giá trị thực tiễn cao.

Mọi tính năng mới (Feature) đều phải đi qua 4 giai đoạn tuần tự. Đầu ra của giai đoạn này là đầu vào của giai đoạn sau. Giữa các giai đoạn là Cổng kiểm duyệt (Gate Sign-off).

## Bản đồ Đầu ra (Artifacts Mapping) theo Tính năng

Khi phát triển một tính năng (VD: `features/FT-001/`), các Agent chỉ được phép sinh ra các file định chuẩn sau đây. **Sign-off chỉ được ký khi các file này đã tồn tại và đạt chất lượng.**

```text
features/FT-001/
├── 01_spec_field.md         (Do BA sinh ra — Đặc tả trường dữ liệu)
├── 01_spec_button.md        (Do BA sinh ra — Đặc tả nút bấm & hành động)
├── 01_spec_function.md      (Do BA sinh ra — Đặc tả luồng xử lý & quy tắc)
├── 01b-bdd-scenarios.md     (Do BA sinh ra — BDD Scenarios)
├── *.html                   (Đầu vào bắt buộc — HTML mẫu từ Figma)
├── *.css                    (Đầu vào bắt buộc — CSS mẫu)
├── *.png, *.jpg             (Đầu vào tùy chọn — Ảnh UI visual reference)
├── 02-design.md             (Do SA sinh ra)
├── 03-schema.sql            (Do SA sinh ra)
├── 06-threat-model.md       (Do Security sinh ra - Tùy chọn)
└── 07-ui-spec.md            (Do UI/UX sinh ra - Tùy chọn)
```

---

## GIAI ĐOẠN 1 — BA (Phân tích Nghiệp vụ)

- **Đầu vào bắt buộc (từ PO/Con người)**:
  1. **Tối thiểu 1 file HTML mẫu giao diện** (`.html`) — Export từ Figma, màn hình mẫu để BA phân tích layout, trường dữ liệu, nút bấm.
  2. **File CSS mẫu** (`.css`) — Quy tắc style liên quan đến giao diện mẫu.
  3. (Tùy chọn) **File ảnh UI** (`*.png`, `*.jpg`) — Screenshot cho Dev/QA visual reference.
  4. **File Use Case** (`.md`) — Mô tả use case nghiệp vụ.
- **Trách nhiệm của BA Agent**:
  - **Fast-Track (Audit-Only)**: Nếu đã có đủ 3 file spec + BDD scenarios, BA chỉ cần tra soát đối chiếu với HTML mẫu. Nếu OK → chuyển thẳng SA Readiness Check. Nếu phát hiện thiếu sót → quay về luồng đầy đủ.
  - **Luồng đầy đủ** (khi chưa có spec hoặc tra soát phát hiện thiếu sót):
    1. Phân tích file HTML mẫu để trích xuất trường dữ liệu, nút bấm, luồng xử lý.
    2. Sinh ra **3 file đặc tả riêng biệt**:
       - `features/FT-XXX/01_spec_field.md` — Đặc tả trường dữ liệu.
       - `features/FT-XXX/01_spec_button.md` — Đặc tả nút bấm & hành động.
       - `features/FT-XXX/01_spec_function.md` — Đặc tả luồng xử lý & quy tắc nghiệp vụ.
    3. Sinh file BDD Scenarios: `features/FT-XXX/01b-bdd-scenarios.md`.
    4. Bắt buộc cập nhật các thuật ngữ mới vào `docs/domain/glossary.md` (Context Sync).
- **BA Readiness Check (Cross-Review bởi SA)**: SA Agent đọc cả 3 file spec (`01_spec_field.md`, `01_spec_button.md`, `01_spec_function.md`) và đánh giá có đủ rõ để thiết kế không. SA sinh file `gates/FT-XXX-G1-ba-readiness.md` với status `APPROVED` hoặc `REJECTED`. Nếu REJECTED, BA sửa theo feedback rồi xin review lại.
- **Cổng G1 (BA Sign-off)**: Chỉ khi SA đã `APPROVED` readiness check, con người kiểm tra 3 file spec có dễ hiểu không, từ vựng đã được update chưa. Nếu OK -> Sinh file `gates/FT-XXX-G1-ba-signoff.md`.

## GIAI ĐOẠN 2 — Thiết kế Kỹ thuật (Design)

- **Đầu vào**: 3 file spec từ BA (`01_spec_field.md`, `01_spec_button.md`, `01_spec_function.md`) + file HTML/CSS mẫu.
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

1. **Plan-First BẮT BUỘC**: Mọi Agent phải tạo Plan file trong `gates/` (`BA-Plan`, `SA-Plan`, `Dev-Plan`, `QA-Plan`) và **chờ con người duyệt** trước khi hành động. Không có Plan duyệt = cấm làm.
2. **Không nhảy cóc**: Không có file `G1` thì cấm SA làm việc. Không có file `G2` thì cấm Dev viết code.
3. **Cam kết đủ File**: File `FT-XXX-G*-signoff.md` phải liệt kê rõ đường dẫn (path) của các file Artifact đã sinh ra. (Ví dụ Sign-off G2 phải ghi rõ: _Đã duyệt 02-design.md và 03-schema.sql_). Nếu thiếu file, không được ký.
4. **Verify trước Sign-off**: Dev phải chạy `scripts/smoke-test.sh` pass trước G3. QA phải chạy `scripts/smoke-api.sh` pass trước G4.
5. **Đóng băng**: File nào đã qua cổng Sign-off sẽ bị "đóng băng" (Frozen). Cấm các Agent tự ý lùi lại sửa file của Phase trước để lấp liếm lỗi. Muốn sửa, phải yêu cầu con người gỡ Sign-off.

---

## Lịch sử Sửa đổi (Audit Log)

- **2026-05-18** | **System** | Tách `01-business-spec.md` thành 3 file riêng (`01_spec_field.md`, `01_spec_button.md`, `01_spec_function.md`). Thêm yêu cầu đầu vào: HTML mẫu, CSS, use case MD.
- **2026-05-17** | **System** | Gộp Dev-BE và Dev-FE thành Fullstack Dev Agent, rút gọn quy trình còn 4 Stage.
