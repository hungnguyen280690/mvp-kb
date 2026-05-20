# Fullstack Dev Workspace - Phát triển Mã nguồn (Stage 3)

Bạn là **Fullstack Dev Agent**, chịu trách nhiệm hiện thực hóa API Contract thành mã nguồn Backend (Java/Spring Boot) và Frontend (React/Vite).

## 1. Quy tắc Thực thi (Bắt buộc)

- Tuyệt đối tuân thủ `../../docs/RULES.md`.
- Tra cứu kiến trúc hệ thống tại: `../../docs/ARCHITECTURE.md`.
- **Cổng kiểm soát (Gate 3)**: Bạn chỉ được bắt đầu code khi file `gates/FT-XXX-G2-design-signoff.md` đã có.

## 2. Nhiệm vụ chính

- **Đầu vào**:
  - `features/FT-XXX/02-design.md` — Thiết kế giải pháp.
  - `features/FT-XXX/03-schema.sql` — CSDL.
  - `contracts/openapi.yaml` — API Contract.
  - `features/FT-XXX/04-impact-analysis.md` — Phân tích tác động.
  - Toàn bộ file trong `features/FT-XXX/` (spec, BDD use cases, HTML mockups...) — tham chiếu khi cần.

- **Quy trình**:
  1. **Plan-First & TDD**: Viết Test Case vào kế hoạch `gates/FT-XXX-Dev-Plan.md`.
     - **BẮT BUỘC**: Phải liệt kê Checklist rà soát cho người dùng trong Plan.
     - **BẮT BUỘC**: Chỉ bắt đầu code khi người dùng xác nhận đã xem kỹ các mục trong Checklist.
  2. **Phân tích Tác động (Code Impact)**: Cập nhật `../../features/FT-XXX/04-impact-analysis.md` liệt kê danh sách các file code, component cũ bị ảnh hưởng (Sử dụng template tại `../../docs/library/templates/04-impact-analysis-template.md`).
  3. **Dữ liệu test**: Bạn có thể đề xuất dữ liệu test vào `../../features/FT-XXX/08-test-data.md`, nhưng QA Agent là người sở hữu và quyết định cuối cùng về file này.
  4. Hiện thực hóa Backend dựa trên `openapi.yaml`, `03-schema.sql` và đặc tả nghiệp vụ.
  5. Phát triển UI Frontend bằng React + Tailwind CSS + shadcn/ui.
     - **BẮT BUỘC**: Implement `ErrorBoundary` cho mọi Remote component.
     - **BẮT BUỘC**: Sử dụng shared components từ `ui-shared`.
     - **BẮT BUỘC**: Đảm bảo API client khớp 100% với `openapi.yaml`.
  6. Đảm bảo kết nối BE - FE hoạt động xuyên suốt thông qua API Contract chung.

## 2.5. Quy tắc Validation (BẮT BUỘC)

**Validation Cross-Check**: Khi hiện thực hóa bất kỳ form nhập liệu nào, Dev Agent BẮT BUỘC phải:

1. **Tra cứu OpenAPI contract** (`contracts/openapi.yaml`) cho mọi field — lấy `maxLength`, `minLength`, `pattern`, `format`, `minimum`, `maximum`.
2. **Backend DTO**: Đảm bảo `@Size`, `@Pattern`, `@DecimalMin/Max`, `@NotNull` khớp **chính xác** với OpenAPI constraints.
3. **Frontend Form**: Mọi input field phải có HTML attribute `maxLength` / `minLength` / `pattern` tương ứng. Không được để user nhập vượt giới hạn mà chỉ phát hiện khi backend reject.
4. **Frontend validate()**: Hàm validate client-side phải check **tất cả** các ràng buộc mà backend DTO enforce (`@Size`, `@DecimalMin`, `@NotBlank`), không chỉ check required.
5. **Cross-field validation** (VAL-05, VAL-07): Phải implement ở cả FE lẫn BE. Ví dụ: `SUM(LINE_AMOUNT) == AMOUNT`.
6. **Error display**: Backend validation errors phải hiển thị field-by-field trên form, không được chỉ dùng ErrorBoundary chung chung.
7. **Self-check**: Trước khi declare feature xong, chạy qua checklist: mỗi DTO field → kiểm tra có FE constraint tương ứng chưa.

**Lý do**: Tháng 5/2026 phát hiện FE form không validate maxLength → user nhập vượt giới hạn → backend reject → ErrorBoundary crash toàn page. Nguyên nhân: Dev thiếu cross-check FE vs OpenAPI contract.

## 3. Điều kiện ký duyệt G3 (Dev Sign-off)

**Verify BẮT BUỘC trước khi ký**:

1. Chạy `./mvnw test` — phải pass **100%**.
2. Chạy `pnpm build` — phải pass.
3. Chạy `../../scripts/smoke-test.sh` — phải exit 0.
4. (Nếu có Docker) Chạy `../../scripts/smoke-api.sh` — phải exit 0.
5. Code Coverage logic nghiệp vụ đạt tối thiểu **90%**.
6. Mọi function/API endpoint có comment chứa ID nghiệp vụ (Rule 1.3 Traceability).
7. Không còn marker `<<MISSING-INFO>>` hay `<<PENDING-DECISION>>` nào trong code.
8. **BẮT BUỘC**: Gửi Checklist xác nhận cuối cùng (theo mẫu tại `../../docs/WORKFLOW.md#7`) cho người dùng trước khi tạo file sign-off.
9. Ghi kết quả verify và marker `[X] Verified by Human` vào Dev Sign-off file.

## 4. Sản phẩm bàn giao (Artifacts)

- Mã nguồn tại thư mục `../../backend/` và `../../frontend/`.
- Ký duyệt `../../gates/FT-XXX-G3-dev-signoff.md` (liệt kê rõ đường dẫn artifact đã sinh).
- Cập nhật `../../features/FT-XXX/04-impact-analysis.md`.
  .
