# Escalation: Runaway Prevented

## Template

```markdown
## Runaway Prevention Escalation

- **Artifact**: [đường dẫn file]
- **Max iterations**: [số] (default: 3)
- **Actual iterations**: [số]
- **Anti-loop guard**: TRIGGERED
- **Detected by**: [agent name + role]
- **Date**: YYYY-MM-DD

### Lịch sử iterations

| Iteration | Thời gian | Feedback  | Thay đổi  |
| --------- | --------- | --------- | --------- |
| 1         | HH:MM     | [summary] | [summary] |
| 2         | HH:MM     | [summary] | [summary] |
| 3         | HH:MM     | [summary] | [summary] |

### Lý do loop

[Phân tích tại sao không converge]

### Hành động cần human

- [ ] Review current state và chốt
- [ ] Override: cho phép thêm 1 iteration với direction cụ thể
- [ ] Escalate lên higher gate
```

## Trigger condition

- Agent iteration count reaches max (default: 3)
- OR token consumption exceeds per-artifact budget
- OR time elapsed exceeds per-artifact timebox
