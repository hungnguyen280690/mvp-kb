# Escalation Templates Index

Templates chuẩn cho các tình huống AI agent cần escalate cho human gatekeeper.

## Danh sách templates

| File                                               | Tình huống                            | Khi nào dùng                               |
| -------------------------------------------------- | ------------------------------------- | ------------------------------------------ |
| [ambiguity.md](./ambiguity.md)                     | Yêu cầu mơ hồ, có thể hiểu nhiều cách | BA output ambiguous, SA design unclear     |
| [confidence-low.md](./confidence-low.md)           | AI confidence thấp về output          | Agent uncertain about domain decision      |
| [conflict.md](./conflict.md)                       | Xung đột giữa artifacts/roles         | BA vs SA, design vs code conflict          |
| [divergence-detected.md](./divergence-detected.md) | Iteration divergence (Jaccard < 0.85) | Agent loop not converging                  |
| [incomplete-input.md](./incomplete-input.md)       | Input thiếu, không thể proceed        | Missing upstream artifact, incomplete spec |
| [runaway-prevented.md](./runaway-prevented.md)     | Agent loop vượt max iterations        | Anti-loop guard triggered                  |
| [scope-violation.md](./scope-violation.md)         | Agent đi ngoài scope                  | Feature creep, unauthorized changes        |

## Cách dùng

1. Agent detect trigger condition
2. Agent fill template với context cụ thể
3. Template post vào `features/{{FEATURE}}/escalations/` hoặc gate review
4. Gatekeeper review và respond
5. Agent tiếp tục với response

## Quy tắc

- **KHÔNG** tự giải quyết khi template trigger — phải chờ human
- Template phải có: context, attempted actions, specific question for human
- Response từ human được log vào same file
