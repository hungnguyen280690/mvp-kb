# Quality Rule Lifecycle

Quản lý vòng đời của quality rules — từ proposal đến enforcement. Adapt từ ADR-0005.

## Severity Tiers

| Tier       | Meaning                              | Enforcement               | Waiver possible?                             |
| ---------- | ------------------------------------ | ------------------------- | -------------------------------------------- |
| **MUST**   | Bắt buộc. Fail = block merge.        | CI doc-lint (blocking)    | Chỉ với Security Lead approval + expiry date |
| **SHOULD** | Khuyến nghị mạnh. Fail = warning.    | Pre-commit (non-blocking) | Có, tự-serve với expiry date                 |
| **MAY**    | Best practice. Fail = informational. | Manual review             | N/A                                          |

## Rule States

```
Proposed → Accepted → Active → Deprecated → Retired
              ↓
           Rejected
```

- **Proposed**: Rule mới, chưa enforce. Review period 1 tuần.
- **Accepted**: Rule được approve. Grace period 2 tuần trước khi Active.
- **Active**: Rule đang enforce. Fail = CI block (MUST) hoặc warning (SHOULD).
- **Deprecated**: Rule không còn applicable. Có replacement reference. Grace period 4 tuần.
- **Retired**: Rule bị xóa khỏi linter. Historical reference only.

## Waiver Process

### MUST rule waiver

1. Tạo file `quality-rules/waivers/W-{RULE_ID}-{date}.md`
2. Nội dung: rule bị waive, lý do, expiry date (max 30 ngày), approver
3. Security Lead review và approve
4. Waiver hết hạn → rule enforce lại tự động

### SHOULD rule waiver

1. Comment trong PR: `waive: R-{RULE_ID} reason: ... expiry: YYYY-MM-DD`
2. Auto-recorded trong CI log
3. Reviewer có thể challenge waiver trong review

## Adding New Rules

1. Tạo proposal trong `docs/quality-rules/rules.md` với state `Proposed`
2. Reference ADR nguồn (nếu có)
3. Tag severity tier
4. Sau 1 tuần review, update state → `Accepted`
5. Sau 2 tuần grace, update state → `Active`
6. Update CI doc-lint để enforce

## Backfill Program

Khi thêm MUST rule mới cho project đã có artifacts:

1. Rule ở state `Accepted` (not `Active`) trong 2 tuần
2. Chạy linter trên tất cả existing artifacts → generate gap report
3. Tạo backfill tasks cho từng fail
4. Sau khi backfill xong → promote rule lên `Active`

## Rule ID Allocation

| Range       | Category                       |
| ----------- | ------------------------------ |
| R0010–R0099 | Structure & Format             |
| R0100–R0199 | Coverage & Completeness        |
| R0200–R0299 | Consistency & Cross-artifact   |
| R0300–R0399 | Agent governance               |
| R0400–R0499 | Security & compliance          |
| R1000+      | Linter implementation-specific |
