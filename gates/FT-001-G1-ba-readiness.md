# BA Readiness Check — FT-001

## Thông tin chung

- **Tính năng**: FT-001
- **File đặc tả**:
  - `features/FT-001/01_spec_field.md` — Đặc tả trường dữ liệu
  - `features/FT-001/01_spec_button.md` — Đặc tả nút bấm & hành động
  - `features/FT-001/01_spec_function.md` — Đặc tả luồng xử lý & quy tắc
- **Người review**: SA Agent
- **Ngày review**: 2026-05-18

## Kết quả

> **Status**: `APPROVED`

## Tiêu chí đánh giá

| #   | Tiêu chí                                                            | Pass? | Ghi chú                                                                                                                                                                   |
| --- | ------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Acceptance Criteria đủ rõ, đo đếm được                              | PASS  | Validation rules có mã VAL-01 đến VAL-18, business rules BIZ-001 đến BIZ-010, message codes MSG-\* đầy đủ. Mỗi rule đo đếm được.                                          |
| 2   | Mỗi nghiệp vụ có ID trace (VD: `BIZ-xxx`)                           | PASS  | Có BIZ-001 đến BIZ-010 (SoD, Maker-only, soft-delete, cross-validation, audit, notification, limit). Event ID từ `<MOD>.LIST.VIEW` đến `<MOD>.LOCK.CONFLICT` (28 events). |
| 3   | Thuật ngữ mới đã có trong `docs/domain/glossary.md`                 | PASS  | Glossary đã khởi tạo: LTT, LNH, TTSP, DVQHNS, COA, CCID, SoD, F-STATUS states, GL_Segment, v.v.                                                                           |
| 4   | Luồng nghiệp vụ không có khoảng trống (không có `<<MISSING-INFO>>`) | PASS  | Không có marker MISSING-INFO. Luồng chính (10 bước), luồng thay thế (7 nhánh), luồng ngoại lệ (11 trường hợp) đều đã cover.                                               |
| 5   | Đủ thông tin để thiết kế API và DB Schema                           | PASS  | Đặc tả trường có đủ: tên ENG, kiểu dữ liệu, bắt buộc, giá trị mặc định, ràng buộc. State machine rõ ràng 20 transitions. Screen list 12 màn hình.                         |

## Feedback chi tiết

**APPROVED** — Đặc tả BA chất lượng cao:

1. **Độ chi tiết trường**: Mỗi trường có type, mandatory, default, constraint — đủ để thiết kế DB column và API payload trực tiếp.
2. **State machine**: 20 trạng thái chuyển tiếp đầy đủ, bao gồm cả edge cases (vi phạm status, vi phạm SoD, concurrent edit).
3. **Validation rules**: 18 rules (VAL-01 đến VAL-18) có mã định danh, đủ để implement guard clauses và test cases.
4. **Screen inventory**: 12 màn hình được định nghĩa rõ, giúp plan API endpoints.
5. **Message catalog**: 25 messages có mã, sẵn sàng cho i18n.

**Gợi ý nhỏ (không block)**: Event ID dùng `<MOD>` placeholder — khi thiết kế cần replace bằng `LTT` thực tế.
