# Escalation: Incomplete Input

## Template

```markdown
## Incomplete Input Escalation

- **Expected input**: [artifact name + path]
- **Missing/Incomplete**: [chi tiết gì thiếu]
- **Blocking output**: [artifact đang bị block]
- **Detected by**: [agent name + role]
- **Date**: YYYY-MM-DD

### Missing information

1. [Item 1]
2. [Item 2]

### Impact

[Không thể proceed hoặc proceed với risk]

### Đề xuất

- [ ] Request upstream role cung cấp missing info
- [ ] Proceed với <<MISSING-INFO>> markers (cần G-approval)
```

## Trigger condition

- Upstream artifact chưa có (stage prerequisite not met)
- Artifact có nhưng thiếu section bắt buộc
- Cross-reference target không tồn tại
