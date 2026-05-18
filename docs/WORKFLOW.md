# Quy trình Phát triển (Workflow & Stage-Gate)

Dự án áp dụng luồng làm việc **Siêu Tối Giản (Ultra-Minimalist)**. Chúng ta loại bỏ hoàn toàn các loại tài liệu rườm rà (YAML, ma trận phức tạp) để tập trung vào mã nguồn và một số ít tài liệu cốt lõi có giá trị thực tiễn cao.

Mọi tính năng mới (Feature) đều phải đi qua 4 giai đoạn tuần tự. Đầu ra của giai đoạn này là đầu vào của giai đoạn sau. Giữa các giai đoạn là Cổng kiểm duyệt (Gate Sign-off).

## Bản đồ Đầu ra (Artifacts Mapping) theo Tính năng

Khi phát triển một tính năng (VD: `features/FT-001/`), các Agent sinh ra các file sau. **Sign-off chỉ được ký khi các file này đã tồn tại và đạt chất lượng.**

```text
features/FT-001/
├── (Đầu vào từ PO — giữ nguyên, BA không sửa)
│   ├── *.html, *.css, *.png   — HTML mẫu, CSS, ảnh UI
│   ├── *_spec_*.md             — Đặc tả do PO cung cấp
│   └── *.xlsx                  — Template Excel
│
├── (Đầu ra BA — BDD Use Cases)
│   └── */bdd.md                — BDD scenarios cho mỗi sub-flow
│
├── (Đầu ra SA)
│   ├── 02-design.md            — Thiết kế kỹ thuật
│   ├── 03-schema.sql           — Schema CSDL
│   └── contracts/openapi.yaml  — API Contract
│
└── (Đầu ra Dev)
    ├── ../../backend/          — Java Spring Boot
    └── ../../frontend/         — React
```

---

## GIAI ĐOẠN 1 — BA (Phân tích Nghiệp vụ)

- **Đầu vào (từ PO/Con người)**: Toàn bộ file trong `features/FT-XXX/` do PO cung cấp. BA làm việc với những gì có — không yêu cầu bắt buộc loại file cụ thể.
- **Trách nhiệm của BA Agent**:
  1. Đọc và tra soát đặc tả PO — xác nhận các luồng nghiệp vụ chính rõ ràng.
  2. Sinh **BDD Use Cases** (Given-When-Then) cho từng luồng nghiệp vụ chính. Ghi vào thư mục tương ứng trong `features/FT-XXX/` (mỗi sub-flow một file `bdd.md`).
  3. Cập nhật thuật ngữ mới vào `docs/domain/glossary.md` (Context Sync).
- **Cổng G1 (BA Sign-off)**: Con người kiểm tra BDD use cases có đủ và đúng không. Nếu OK -> Sinh file `gates/FT-XXX-G1-ba-signoff.md`.

## GIAI ĐOẠN 2 — Thiết kế Kỹ thuật (Design)

- **Đầu vào**: BDD use cases từ BA + toàn bộ file đặc tả do PO cung cấp trong `features/FT-XXX/`.
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
3. **BA Gate G1**: Chỉ cần BDD use cases đã sinh + glossary đã cập nhật. Con người duyệt sign-off.
4. **Verify trước Sign-off**: Dev phải chạy `scripts/smoke-test.sh` pass trước G3. QA phải chạy `scripts/smoke-api.sh` pass trước G4.
5. **Đóng băng**: File nào đã qua cổng Sign-off sẽ bị "đóng băng" (Frozen). Cấm các Agent tự ý lùi lại sửa file của Phase trước để lấp liếm lỗi. Muốn sửa, phải yêu cầu con người gỡ Sign-off.

---

## Lịch sử Sửa đổi (Audit Log)

- **2026-05-18** | **System** | Tách `01-business-spec.md` thành 3 file riêng (`01_spec_field.md`, `01_spec_button.md`, `01_spec_function.md`). Thêm yêu cầu đầu vào: HTML mẫu, CSS, use case MD.
- **2026-05-17** | **System** | Gộp Dev-BE và Dev-FE thành Fullstack Dev Agent, rút gọn quy trình còn 4 Stage.
