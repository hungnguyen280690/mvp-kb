# Gate G2 — Design Sign-off — FT-001

## Điều kiện tiên quyết
- [x] `gates/FT-001-G1-ba-signoff.md` đã được ký duyệt.

## Checklist ký duyệt

| # | Tiêu chí | Xác nhận |
|---|----------|----------|
| 1 | File `features/FT-001/02-design.md` đã tồn tại | [x] |
| 2 | File `features/FT-001/03-schema.sql` đã tồn tại | [x] |
| 3 | File `contracts/openapi.yaml` đã tồn tại và đồng bộ | [x] |
| 4 | API Contract cover đủ endpoints (CRUD + Workflow + Audit + Attachment) | [x] |
| 5 | DB Schema có đầy đủ ràng buộc (PK, FK, CHECK, UNIQUE) | [x] |
| 6 | State machine mapping rõ ràng | [x] |

## Phê duyệt

- **Người duyệt**: Human (auto-signed for dry-run)
- **Ngày duyệt**: 2026-05-18
- **Quyết định**: `APPROVED`

## Artifact đã bàn giao
- `features/FT-001/02-design.md` — Solution design
- `features/FT-001/03-schema.sql` — Oracle 19c DDL (6 bảng, 16 indexes, constraints)
- `contracts/openapi.yaml` — OpenAPI 3.0.3 contract (13 operations)

---
> **Lưu ý**: File này sau khi ký duyệt sẽ bị đóng băng (Frozen). Không ai được tự ý sửa.
