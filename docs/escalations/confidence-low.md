# Escalation: Confidence Low

## Template

```markdown
## Low Confidence Escalation

- **Artifact**: [đường dẫn file]
- **Section**: [section uncertain]
- **Confidence**: [Low/Medium-Low]
- **Detected by**: [agent name + role]
- **Date**: YYYY-MM-DD

### Vấn đề

[Chi tiết lý do confidence thấp]

### Đã thử verify

- [Method 1]: kết quả ...
- [Method 2]: kết quả ...

### Rủi ro nếu proceed

[Chi tiết risk]

### Cần gì từ human

[Xác nhận / Correction / Additional context]
```

## Trigger condition

- Agent không thể verify output correctness
- Domain decision outside agent's training data
- Novel edge case not covered in specs
