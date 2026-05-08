# Handoff Template Schema

## Format chuẩn cho mọi handoff template

```markdown
## Handoff: {From-Role} → {To-Role}

### Context

- **Feature**: [tên feature]
- **Stage completed**: [stage number]
- **Gate signed**: [gate ID + date]

### Artifacts handed off

| Artifact        | Path   | Status       | Notes     |
| --------------- | ------ | ------------ | --------- |
| [artifact name] | [path] | Active/Draft | [ghi chú] |

### Key decisions made

- [Decision 1]: lý do ...
- [Decision 2]: lý do ...

### Open questions for receiving role

- [Question 1]
- [Question 2]

### Quality gates verified

- [x] R-XXXX: [mô tả]
- [ ] R-XXXX: [pending — cần receiving role verify]

### Receiving role checklist

- [ ] Read [artifact list]
- [ ] Verify [specific checks]
- [ ] Flag inconsistencies to [role]
```
