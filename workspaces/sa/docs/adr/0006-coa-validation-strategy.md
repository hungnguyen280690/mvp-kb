# ADR-SA-0006: Chiến lược xác thực COA (Hệ thống mục lục ngân sách) phía server

- **Status**: Accepted
- **Date**: 2026-05-10
- **Decision makers**: SA Lead

## Context

Hệ thống mục lục ngân sách (COA — Chart of Accounts) trong KBNN có 18 segment, mỗi segment có giá trị riêng và tổ hợp giữa các segment phải hợp lệ theo bảng cấu hình DMHT.COA-MATRIX. BIZ-COA-CROSS yêu cầu: "Tổ hợp các segment Mã quỹ/TK/Cấp NS/Chương/Ngành KT/NDKT/ĐB/CTMT/MN/Kho bạc/DP phải hợp lệ theo bảng cấu hình QLT/QLChi."

**18 COA segments (từ SRS sheet 5.3)**:
1. Mã quỹ (Fund code)
2. Tài khoản (Account)
3. Cấp ngân sách (Budget level)
4. Chương (Chapter)
5. Ngành kinh tế (Economic sector)
6. Nội dung kinh tế (NDKT)
7. Địa bàn (Region)
8. Chương trình mục tiêu (Target program)
9. Mục ngách (Sub-item)
10. Kho bạc (Treasury)
11. Dự phòng (Reserve)
12-18. Các segment bổ sung theo cấu hình

**Ràng buộc**:
- Xác thực COA phải chạy khi Submit (DRAFT → SUBMITTED) và khi GL post (CONFIRMED → POSTED).
- Mỗi khi user thay đổi một segment trên form, cần validate lại tổ hợp (cross-validation).
- DMHT.COA-MATRIX là bảng cấu hình tĩnh (thay đổi ít, chỉ khi có quyết định NSNN mới), có thể cache.
- Response time target: validate < 200ms cho 1 tổ hợp.

**Các lựa chọn xem xét**:

1. **Client-side only validation**: Frontend gọi API lấy hợp lệ COA, validate trên client.
2. **Server-side validation, query DB mỗi lần**: Mỗi request validate, query trực tiếp bảng DMHT.COA-MATRIX.
3. **Server-side validation + cache**: Server validate, cache COA-MATRIX trong local cache (Caffeine) hoặc Redis.
4. **External validation service**: COA validation tách thành microservice riêng.

## Decision

Chọn **Server-side validation với multi-level cache** (lựa chọn 3): Local cache (Caffeine, L1) + Redis cache (L2).

**Thiết kế COA Validator**:

```
COA Validator Component
├── Input: COA composite key { fundCode, account, budgetLevel, chapter, ... }
├── Validation logic:
│   1. Build composite key from 18 segments
│   2. Check L1 cache (Caffeine, in-process)
│   3. If miss → check L2 cache (Redis, shared across pods)
│   4. If miss → query DMHT.COA-MATRIX from Oracle DB
│   5. Store result in L1 + L2 cache
│   6. Return valid/invalid + error detail
├── Cache configuration:
│   ├── L1 (Caffeine): TTL 30 phút, max 10,000 entries
│   ├── L2 (Redis): TTL 24 giờ, eviction LRU
│   └── Cache key: SHA-256(concat of all 18 segment values)
└── Output: { valid: boolean, errors: [{segment, message}] }
```

**Chiến lược cache invalidation**:
- **Time-based**: L1 TTL 30 phút, L2 TTL 24 giờ. COA-MATRIX thay đổi rất ít (theo quyết định NSNN, thường quý/năm).
- **Event-based**: Khi Admin cập nhật DMHT.COA-MATRIX qua QLHT, publish event `DMHT.COA-MATRIX.UPDATED`. COA Validator subscribe và clear cache.
- **Manual**: Admin API `POST /api/admin/cache/coa-matrix/evict` để force clear khi cần.

**Quy trình validate**:

```
1. User chọn giá trị segment trên form (S02):
   → Frontend gọi API validate (debounce 300ms)
   → Server validate tổ hợp
   → Response: { valid, warnings[], errors[] }

2. User bấm Submit (DRAFT → SUBMITTED):
   → Server validate lại toàn bộ tổ hợp (đảm bảo không bị bypass)
   → Nếu invalid → trả 400 với chi tiết lỗi
   → Nếu valid → cho phép chuyển trạng thái

3. GL post (CONFIRMED → POSTED):
   → Server validate lại COA trước khi gửi GL
   → Nếu invalid → POST_FAILED (kỳ đóng/COA sai)
```

**Lý do chọn**:
- **Đảm bảo tính toàn vẹn dữ liệu**: Server-side validation là source of truth, không thể bị bypass bằng cách sửa frontend.
- **Hiệu năng**: Cache giảm DB query từ ~50ms xuống < 5ms cho cache hit.
- **Phù hợp đặc thù**: COA-MATRIX ít thay đổi, cache TTL dài là phù hợp.
- **Không cần Redis riêng**: Nếu Redis chưa sẵn sàng trong MVP, có thể dùng Caffeine L1 cache only.

## Consequences

### Tích cực
- **Toàn vẹn dữ liệu**: Server-side validation đảm bảo không có tổ hợp COA không hợp lệ nào vào DB hoặc gửi GL.
- **Hiệu năng cao**: Cache hit trả kết quả < 5ms, đáp ứng target < 200ms.
- **Phản hồi tức thì**: Frontend gọi validate khi user thay đổi segment → hiển thị lỗi ngay.
- **Dễ bảo trì**: Logic validate tập trung ở server, frontend chỉ hiển thị kết quả.
- **Linh hoạt cache**: Multi-level cho phép chọn L1 only (MVP) hoặc L1+L2 (production).

### Tiêu cực
- **Độ trễ cache miss**: Request đầu tiên hoặc sau khi cache expire phải query DB (~50ms). Chấp nhận được vì tần suất thấp.
- **Phức tạp cache**: Cần quản lý cache invalidation, TTL, và sự đồng bộ giữa L1 và L2.
- **Kích thước cache**: COA-MATRIX có thể lớn (hàng nghìn tổ hợp). Tuy nhiên, chỉ cache tổ hợp đã query (lazy loading), không preload toàn bộ.
- **Phụ thuộc Redis**: Nếu dùng L2, cần Redis available. MVP có thể bỏ qua L2.

### Rủi ro và giảm thiểu
| Rủi ro | Mức độ | Giảm thiểu |
| :------ | :------ | :--------- |
| Cache stale sau khi COA-MATRIX cập nhật | MEDIUM | Event-based invalidation + TTL ngắn L1 (30 phút) |
| Redis unavailable trong production | LOW | Fallback về L1 cache only + DB direct query |
| COA validation quá chậm cho 18 segments | LOW | Composite key hash; DB index trên tổ hợp segments; benchmark target < 200ms |
| Frontend bypass server validation | NEGLIGIBLE | Server validate lại lần cuối khi Submit — frontend validate chỉ là UX enhancement |

## References

- [CLAUDE.md](../../CLAUDE.md) — Nguyên tắc 1: Ưu tiên hợp đồng (Contract-first)
- [CONTEXT.md](../../../../docs/CONTEXT.md) — COA (Hệ thống mục lục ngân sách)
- [business-rules.yaml](../../../ba/domain/business-rules.yaml) — BIZ-COA-CROSS, BIZ-NDND-RULE
- [api-spec.yaml](../../../ba/domain/api-spec.yaml) — API-004 (PushGL, segments[COA])
- [scope.yaml](../../../ba/domain/scope.yaml) — F18: Ràng buộc kết hợp chéo COA
- Spring Framework Caffeine Cache documentation
