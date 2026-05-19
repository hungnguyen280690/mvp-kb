# Quy trình Phát triển (Workflow & Stage-Gate)

Dự án áp dụng luồng làm việc **Tối Giản (Minimalist)**. Chúng ta loại bỏ hoàn toàn các loại tài liệu rườm rà (YAML, ma trận phức tạp) để tập trung vào mã nguồn và một số ít tài liệu cốt lõi có giá trị thực tiễn cao.

Mọi tính năng mới (Feature) đều phải đi qua 4 giai đoạn tuần tự. Đầu ra của giai đoạn này là đầu vào của giai đoạn sau. Giữa các giai đoạn là Cổng kiểm duyệt (Gate Sign-off).

## Bản đồ Đầu ra (Artifacts Mapping) theo Tính năng

Khi phát triển một tính năng (VD: `features/FT-001/`), các Agent sinh ra các file sau. **Sign-off chỉ được ký khi các file này đã tồn tại và đạt chất lượng.**

```text
features/FT-001/
├── (Đầu vào từ BA-Human — giữ nguyên, BA không sửa)
│   ├── *.html, *.css, *.png    — HTML mẫu, CSS, ảnh UI
│   ├── *_spec_*.md             — Đặc tả do BA-Human cung cấp
│
├── (Đầu ra BA — BDD & Phân tích)
│   ├── 00-scope.md             — Xác định phạm vi MVP (In-scope/Out-of-scope)
│   ├── 01-inconsistencies.md   — Danh sách các điểm mâu thuẫn/thiếu trong Spec
│   ├── 04-impact-analysis.md   — Phân tích tác động nghiệp vụ (Business Impact)
│   └── */bdd.md                — BDD scenarios cho mỗi sub-flow
│
├── (Đầu ra SA)
│   ├── 02-design.md            — Thiết kế kỹ thuật
│   ├── 03-schema.sql           — Schema CSDL
│   ├── 04-impact-analysis.md   — (Cập nhật) Phân tích tác động hệ thống & dữ liệu
│   └── contracts/openapi.yaml  — API Contract
│
└── (Đầu ra Dev)
    ├── 04-impact-analysis.md   — (Cập nhật) Phân tích tác động mã nguồn (Affected Files)
    ├── ../../backend/          — Java Spring Boot
    └── ../../frontend/         — React
```

---

## GIAI ĐOẠN 1 — BA (Phân tích Nghiệp vụ)

- **Đầu vào (từ BA Con người)**: Toàn bộ file trong `features/FT-XXX/` do BA-Human cung cấp. BA làm việc với những gì có — không yêu cầu bắt buộc loại file cụ thể.
- **Trách nhiệm của BA Agent**:
  1. Đọc và tra soát đặc tả BA-Human — xác nhận các luồng nghiệp vụ chính rõ ràng.
  2. Sinh **BDD Use Cases** (Given-When-Then) cho từng luồng nghiệp vụ chính. Ghi vào thư mục tương ứng trong `features/FT-XXX/` (mỗi sub-flow một file `bdd.md`).
  3. **Xác định Scope**: Tạo file `00-scope.md` để chốt những gì làm và không làm trong feature.
  4. **Phân tích Tác động (Business Impact)**: Khởi tạo file `04-impact-analysis.md`. Xác định các quy trình, vai trò hoặc báo cáo hiện có bị ảnh hưởng.
  5. **Truy tìm Inconsistencies**: Tạo file `01-inconsistencies.md` ghi lại các điểm BA-Human bị hổng, mâu thuẫn hoặc thiếu logic.
  6. Cập nhật thuật ngữ mới vào `docs/domain/glossary.md` (Context Sync).
- **Cổng G1 (BA Sign-off)**: Con người kiểm tra BDD use cases, Scope, Impact và Inconsistencies. Nếu OK -> Sinh file `gates/FT-XXX-G1-ba-signoff.md`.

## GIAI ĐOẠN 2 — Thiết kế Kỹ thuật (Design)

- **Đầu vào**: BDD use cases từ BA + toàn bộ file đặc tả do BA-Human cung cấp trong `features/FT-XXX/`.
- **Trách nhiệm của các Agent**:
  - **SA Agent**:
    - **Ràng buộc cứng**: BẮT BUỘC kiểm tra file `01-inconsistencies.md`. Nếu có mâu thuẫn, SA chỉ được phép bắt đầu thiết kế khi các mâu thuẫn này đã được **con người đại diện** đánh dấu là `[RESOLVED]`.
    - Thiết kế giải pháp tổng thể, sinh file `features/FT-XXX/02-design.md`, hợp đồng `contracts/openapi.yaml`, và thiết kế CSDL `features/FT-XXX/03-schema.sql`.
    - **Phân tích Tác động (System Impact)**: Cập nhật `04-impact-analysis.md` với các tác động đến Service, API, Table và Security hiện có (theo template tại `docs/library/templates/04-impact-analysis-template.md`).
    - Nếu có service mới, SA phải update vào `docs/ARCHITECTURE.md`.
  - **Security / UI Agents** (Tùy chọn cho MVP): Sinh file `06` and `07` nếu tính năng yêu cầu độ bảo mật/giao diện phức tạp.
- **Cổng G2 (Design Sign-off)**: Con người kiểm tra API Contract và Schema DB. Đảm bảo đủ file Artifact. Nếu OK -> Sinh file `gates/FT-XXX-G2-design-signoff.md`.

## GIAI ĐOẠN 3 — Lập trình (Dev)

- **Đầu vào**: OpenAPI Contract và Schema SQL đã chốt ở Gate 2.
- **Trách nhiệm của Fullstack Dev Agent**:
  1. **Plan-First & TDD**: Viết Test Case (cho cả BE và FE) vào kế hoạch (`gates/FT-XXX-Dev-Plan.md`) xin duyệt trước.
  2. **Phân tích Tác động (Code Impact)**: Cập nhật `04-impact-analysis.md` liệt kê danh sách các file code, component cũ bị ảnh hưởng cần chỉnh sửa/refactor.
  3. Khi được duyệt Test, bắt đầu sinh mã nguồn Java (backend) và React (frontend) đảm bảo đồng bộ hoàn toàn với API Contract.
- **Cổng G3 (Dev Sign-off)**: Test phải Pass 100% (local). Coverage đạt chuẩn. Nếu OK -> Sinh file `gates/FT-XXX-G3-dev-signoff.md`.

## GIAI ĐOẠN 4 — Kiểm thử (QA)

- Dành cho QA Agent để lo việc viết kịch bản test tự động (E2E). Giai đoạn này chỉ kích hoạt khi code ở Giai đoạn 3 đã hoàn thiện trơn tru.
- **Trách nhiệm của QA Agent**:
  1. Viết kịch bản test dựa trên BDD và Spec.
  2. **Phân tích Tác động (Regression Impact)**: Dựa vào `04-impact-analysis.md`, QA xác định phạm vi Regression Test để đảm bảo các vùng bị ảnh hưởng không phát sinh lỗi mới. Ghi chú phạm vi test hồi quy vào Plan.
  3. **Quản lý dữ liệu test**: QA Agent là chủ sở hữu chính của file `08-test-data.md`. QA chịu trách nhiệm thiết kế các bộ dữ liệu biên (edge cases) để đảm bảo độ bao phủ kiểm thử cao nhất.

---

## 7. Hệ thống Checklist Ký duyệt Tiêu chuẩn (Standardized Checklists)

Hệ thống checklist này được thiết kế theo mô hình **"Truy xuất ngược" (Back-tracing)**. Mỗi giai đoạn không chỉ kiểm tra việc hiện tại mà còn phải xác nhận tính kế thừa từ giai đoạn trước.

### Giai đoạn 1 — BA (Nghiệp vụ)

_Mục tiêu: Định nghĩa "Cái gì" (What) và xác nhận sự hiểu đúng yêu cầu._

- [ ] **Kế thừa Spec**: 100% yêu cầu trong file Spec của BA_Human đã được chuyển hóa thành BDD scenarios?
- [ ] **Scope & Impact**: Đã xác định rõ phạm vi MVP, các điểm mâu thuẫn và tác động nghiệp vụ (Business Impact) chưa?
- [ ] **BDD Granularity**: Các kịch bản BDD đã bao phủ đủ 3 tầng: Luồng chính (Happy path), Luồng rẽ nhánh (Alternative), và Luồng lỗi (Exceptions)?
- [ ] **Context Sync**: Mọi thuật ngữ nghiệp vụ mới đã được định nghĩa trong `docs/domain/glossary.md`?

### Giai đoạn 2 — SA (Thiết kế)

_Mục tiêu: Định nghĩa "Thế nào" (How) và khớp nối với Nghiệp vụ._

- [ ] **BDD Coverage**: Hợp đồng `openapi.yaml` và các API endpoint đã bao phủ 100% các Use Case được định nghĩa tại Giai đoạn 1?
- [ ] **Impact Assessment**: Đã phân tích đầy đủ tác động hệ thống (System, API, DB) trong `04-impact-analysis.md` chưa?
- [ ] **Naming Alignment**: Tên bảng/cột trong `03-schema.sql` và thuộc tính JSON trong API đã khớp 100% với Glossary?
- [ ] **Security Schema**: Thiết kế đã xác định rõ vai trò (Role) và quyền (Permission) cho từng API (Maker/Checker/Approver)?
- [ ] **Constraint Definition**: Các ràng buộc nghiệp vụ (SoD, Hash Chain, Audit) đã được mô tả chi tiết trong `02-design.md`?

### Giai đoạn 3 — Dev (Lập trình)

_Mục tiêu: Hiện thực hóa (Implementation) và khớp nối với Thiết kế._

- [ ] **Design Compliance**: Code BE/FE đã thực thi đúng 100% logic và ràng buộc được SA mô tả trong `02-design.md`?
- [ ] **Code Impact Trace**: Đã liệt kê và rà soát đủ các file code bị ảnh hưởng trong `04-impact-analysis.md`?
- [ ] **Contract Fidelity**: Các Controller/DTO và Frontend API Client khớp 100% với `openapi.yaml` (không thừa, không thiếu trường)?
- [ ] **MFE Safety**: Đã triển khai `ErrorBoundary` và sử dụng `ui-shared` cho các thành phần UI dùng chung?
- [ ] **Traceability**: 100% các hàm nghiệp vụ quan trọng đều có comment ID của BDD scenario (Rule 1.3)?
- [ ] **Frontend Quality**: Đã chạy `pnpm lint`, `pnpm typecheck` và đạt 100% unit tests pass cho Frontend?
- [ ] **Validation Pass**: Đã chạy `smoke-test.sh` và `smoke-ui.sh` pass?

### Giai đoạn 4 — QA (Kiểm thử)

_Mục tiêu: Xác nhận (Verification) và khớp nối toàn hệ thống._

- [ ] **E2E Traceability**: Các kịch bản test tự động đã bao phủ được "vòng đời" của dữ liệu từ khi Maker tạo đến khi Approver duyệt?
- [ ] **Regression Coverage**: Đã thiết kế các Test Case hồi quy bao phủ toàn bộ các vùng/file bị tác động được liệt kê trong `04-impact-analysis.md`?
- [ ] **Test Data Quality**: File `08-test-data.md` đã có đủ dữ liệu biên (Edge cases) để "bẻ gãy" logic nếu code sai?
- [ ] **System Alignment**: Đã chạy `smoke-api.sh` và `smoke-ui.sh` pass? Toàn bộ module (BE-FE-Gateway) phản hồi đúng theo Contract?

---

## ⚠️ Tiêu chuẩn Ký duyệt (Sign-off Discipline)

...
Để chống tình trạng AI chạy lung tung hoặc tạo rác:

1. **Plan-First BẮT BUỘC**: Mọi Agent phải tạo Plan file trong `gates/` (`BA-Plan`, `SA-Plan`, `Dev-Plan`, `QA-Plan`) và **chờ con người duyệt** trước khi hành động. Không có Plan duyệt = cấm làm.
2. **Explicit Review Checklist**: Khi trình Plan hoặc trình Sign-off, Agent BẮT BUỘC phải trích dẫn các mục tương ứng từ **Hệ thống Checklist Tiêu chuẩn** (Mục 7) để người dùng xác nhận.
3. **Phê duyệt bằng lời nói & Marker**: Sau khi người dùng xác nhận qua chat, Agent phải cập nhật marker `[X] Verified by Human` vào file tương ứng.
   ...
4. **Không nhảy cóc**: Không có file `G1` thì cấm SA làm việc. Không có file `G2` thì cấm Dev viết code.
5. **BA Gate G1**: Chỉ cần BDD use cases đã sinh + glossary đã cập nhật. Con người duyệt sign-off.
6. **Verify trước Sign-off**: Dev phải chạy `scripts/smoke-test.sh` pass trước G3. QA phải chạy `scripts/smoke-api.sh` pass trước G4.
7. **Đóng băng**: File nào đã qua cổng Sign-off sẽ bị "đóng băng" (Frozen). Cấm các Agent tự ý lùi lại sửa file của Phase trước để lấp liếm lỗi. Muốn sửa, phải yêu cầu con người gỡ Sign-off.

---

## 🚀 Cơ chế Xử lý Lỗi & Làm lại (Failure & Rework Loops)

Trong quá trình phát triển, nếu bất kỳ bước nào thất bại, hệ thống áp dụng cơ chế "Fail Fast & Rework" như sau:

1. **Gate Rejection (Bị từ chối tại Cổng)**:
   - Nếu con người kiểm tra Artifacts/Plan và thấy không đạt, con người sẽ không cấp thẻ `[X] Verified by Human`.
   - Con người để lại comment vào file Plan/Gate giải thích lý do.
   - **Hành động**: Agent tương ứng phải sửa lại tài liệu/code và xin duyệt lại (Re-submit Plan).
2. **Dev Test Failure (Lỗi khi Build/Unit Test)**:
   - Nếu `smoke-test.sh` báo lỗi (BE test fail, FE lint/typecheck fail).
   - **Hành động**: Dev Agent không được phép xin Sign-off (G3). Bắt buộc phải tự phân tích log, sửa code cho đến khi lệnh test chạy xanh (Pass).
3. **QA Automation Failure (Lỗi do QA phát hiện)**:
   - Nếu kịch bản Automation Test (Playwright) của QA phát hiện lỗi (Bug).
   - **Hành động**: QA Agent tạo báo cáo lỗi (chỉ rõ `BIZ-xxx` nào bị fail, kèm log/ảnh chụp màn hình).
   - Trả lại cho Dev Agent. Dev Agent phải lập một Plan nhỏ để fix bug, sửa code, chạy lại G3. Sau đó QA chạy lại test G4.
4. **Frozen Artifacts Violation (Sửa lén tài liệu đã chốt)**:
   - Tuyệt đối cấm lùi lại sửa tài liệu của Giai đoạn trước (VD: Dev tự ý sửa BDD của BA).
   - Nếu phát hiện logic sai từ Giai đoạn trước, phải dùng Escalation Template (`conflict.md` hoặc `incomplete-input.md`) báo cho con người để xin phép mở khóa (Unfreeze) Gate trước đó và làm lại từ đầu.

---

## 🚀 Luồng Fast-Track (Hotfix)

Dành riêng cho các thay đổi nhỏ không làm thay đổi logic nghiệp vụ (VD: Sửa lỗi chính tả, điều chỉnh màu sắc CSS, cập nhật nội dung thông báo...).

1. **Điều kiện**: Agent phải chứng minh được thay đổi không tác động đến logic nghiệp vụ và DB Schema.
2. **Quy trình**:
   - Bỏ qua Giai đoạn 1 (BA) và Giai đoạn 2 (SA).
   - Agent lập `gates/FT-XXX-Hotfix-Plan.md` (Checklist rút gọn: Mô tả thay đổi + Giải trình tính an toàn).
   - Con người duyệt Plan.
   - Dev thực hiện sửa đổi và viết Unit Test bổ sung (nếu cần).
   - **QA Bắt buộc**: Chạy `smoke-test.sh` và `smoke-api.sh` để đảm bảo không gây lỗi hệ thống.
3. **Ký duyệt**: Chỉ cần một file `gates/FT-XXX-Hotfix-signoff.md` duy nhất.

---

## Lịch sử Sửa đổi (Audit Log)

- **2026-05-19** | **System** | Chuẩn hóa template 04-impact-analysis.md. Thêm ràng buộc giải quyết mâu thuẫn Spec trước Gate 2. Tích hợp QA vào Impact Analysis. Bổ sung luồng Fast-Track (Hotfix).
- **2026-05-19** | **System** | Bổ sung 00-scope.md và 01-inconsistencies.md vào đầu ra BA. Bổ sung cơ chế "Human-in-the-loop" — yêu cầu Checklist xác nhận trước khi Action/Sign-off.
- **2026-05-18** | **System** | Tách `01-business-spec.md` thành 3 file riêng.
- **2026-05-17** | **System** | Gộp Dev-BE và Dev-FE thành Fullstack Dev Agent.
