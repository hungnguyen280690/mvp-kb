# Escalation: Scope Violation

## Template

```markdown
## Scope Violation Escalation

- **Artifact**: [đường dẫn file]
- **Authorized scope**: [scope được phép]
- **Actual action**: [action thực tế]
- **Violation type**: [feature creep / unauthorized change / cross-role intrusion]
- **Detected by**: [agent name + role]
- **Date**: YYYY-MM-DD

### Chi tiết violation

[Agent đã làm gì ngoài scope]

### Nguyên nhân

[Lý do agent đi ngoài scope — misinterpretation, missing boundary, etc.]

### Impact

[Changes đã tạo, files ảnh hưởng]

### Remediation

- [ ] Revert unauthorized changes
- [ ] Update agent prompt để prevent recurrence
- [ ] Document lesson learned
```

## Trigger condition

- Agent modify file ngoài workspace được phân công
- Agent tạo artifact type không thuộc role
- Agent change vượt quá scope feature hiện tại
