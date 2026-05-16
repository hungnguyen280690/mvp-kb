# Cẩm nang Chi tiết: Vai DBA (Database Administrator) — Stage 2

## Sứ mệnh

Thiết kế và duy trì schema Oracle cho hệ thống LTT. Đảm bảo migration an toàn, audit trail chống sửa lùi, và performance cho nghiệp vụ KBNN.

---

## Công cụ AI của bạn

### 1. Agent: `dba-schema-builder`

- **Kích hoạt:** Gõ `> dba-schema-builder` trong Claude Code.
- **Nhiệm vụ:** Đọc `domain/*.yaml` của BA + contracts của SA → sinh DDL Oracle, rollback scripts.

### 2. Plugin: `superpowers`

- **Mục đích:** Cross-check schema consistency.
- **Lệnh mẫu:**
  - `@superpowers kiểm tra xem tất cả foreign key trong V1__init_ltt.sql có khớp với type trong OpenAPI contract không.`

---

## Quy trình làm việc (Step-by-Step)

### Bước 1: Khởi động Workspace

```bash
cd workspaces/dba
claude code .
```

### Bước 2: Verify Gate G1

Kiểm tra BA đã sign-off:

```bash
test -f ../../gates/G1-ba-signoff.md || echo "G1 chưa sign-off"
```

### Bước 3: Chạy Schema Builder

Yêu cầu Claude:

> "Chạy agent `dba-schema-builder` để sinh bộ DDL migration từ BA domain YAML. Tập trung vào: LTT main table, outbox pattern, audit hash chain, optimistic locking, COA segments."

### Bước 4: Review Migrations

Kiểm tra từng file:

- `V1__init_ltt.sql` — bảng chính, indexes, SoD constraint
- `V2__outbox.sql` — same-transaction với LTT write
- `V3__audit_hash_chain.sql` — `prev_hash || payload || timestamp` → SHA-256
- `V4__lock_table.sql` — version column cho optimistic locking
- `V5__coa_segments.sql` — COA validation lookup

### Bước 5: Verify Rollback Scripts

Mỗi migration PHẢI có rollback tương ứng. Test trên Oracle Free:

> "Chạy lần lượt V1-V5 rồi R5-R1 trên Oracle Free để verify rollback sạch."

### Bước 6: Ký duyệt (Sign-off)

Khi mọi thứ chuẩn:

> "Tóm tắt kết quả vào `gates/G-DBA-summary.md` và tạo file ký duyệt `gates/G-DBA-signoff.md`."

---

## Lưu ý tử huyệt

1. **KHÔNG** sửa migration đã merge — tạo migration mới.
2. **MỌI** PII column phải có `classification` annotation.
3. **Audit hash chain** là cơ sở chống sửa lùi — review kỹ thuật `prev_hash` concatenation.
4. **SoD constraint** ở DB level: `CHECK (maker_id <> checker_id AND checker_id <> approver_id)`.
5. **Rollback** phải test thực tế, không chỉ review bằng mắt.
