# Quality Rules Index

Quy tắc chất lượng cho hệ thống documentation và artifact. Tham chiếu từ CI doc-lint job và pre-commit hooks.

## Phân loại

| Range       | Category                     | Mô tả                                            |
| ----------- | ---------------------------- | ------------------------------------------------ |
| R0010–R0099 | Structure & Format           | Front-matter, naming convention, lifecycle state |
| R0100–R0199 | Coverage & Completeness      | Artifact completeness, cross-reference validity  |
| R0200–R0246 | Consistency & Cross-artifact | Gap detection, divergence, upstream propagation  |

## Severity Tiers

Xem chi tiết tại [lifecycle.md](./lifecycle.md)

- **MUST**: Block merge nếu fail. Không có waiver.
- **SHOULD**: Fail warning. Có thể waive với expiry date.
- **MAY**: Informational. Khuyến nghị best practice.

## Tham chiếu

- Chi tiết rules: [rules.md](./rules.md)
- Rule lifecycle: [lifecycle.md](./lifecycle.md)
- ADR nguồn: [docs/adr/0005](../adr/0005-severity-tiered-rule-lifecycle.md), [docs/adr/0017](../adr/0017-output-completeness-discipline.md), [docs/adr/0018](../adr/0018-cross-artifact-coverage-discipline.md)
