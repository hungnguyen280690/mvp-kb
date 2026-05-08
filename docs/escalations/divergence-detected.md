# Escalation: Divergence Detected

## Template

```markdown
## Divergence Escalation

- **Artifact**: [đường dẫn file]
- **Iteration**: [số iteration]
- **Jaccard similarity**: [0.XX] (threshold: 0.85)
- **Detected by**: [agent name + role]
- **Date**: YYYY-MM-DD

### Lịch sử iterations

| Iteration   | Jaccard | Thay đổi chính |
| ----------- | ------- | -------------- |
| N-2         | —       | [summary]      |
| N-1         | 0.XX    | [summary]      |
| N (current) | 0.XX    | [summary]      |

### Vấn đề

[Output không hội tụ — AI đang oscillate giữa các versions]

### Đề xuất

- [ ] Human review và chốt direction
- [ ] Narrow scope của iteration
- [ ] Accept current version với caveat
```

## Trigger condition

- Jaccard similarity giữa 2 iterations liên tiếp < 0.85
- Hoặc similarity trend không tăng sau 3 iterations
