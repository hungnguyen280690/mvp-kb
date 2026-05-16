# FinOps Governance — AI Agent Cost Control

Quản lý chi phí AI agent khi chạy vibe-code pipeline. Adapt từ ADR-0012.

## Nguyên tắc

1. **Mọi AI session có budget** — không unlimited
2. **Track per-feature cost** — biết feature nào tốn bao nhiêu
3. **Alert khi vượt threshold** — không silent overrun
4. **Provider routing** — chọn model phù hợp cho task

## Per-Feature Budget

| Stage | Role      | Default Budget | Model         | Ghi chú                   |
| ----- | --------- | -------------- | ------------- | ------------------------- |
| 1     | BA        | $5/feature     | Claude Sonnet | Parse + YAML generation   |
| 2     | SA        | $10/feature    | Claude Sonnet | OpenAPI + DDL generation  |
| 2     | DBA       | $5/feature     | Claude Sonnet | DDL + rollback generation |
| 2     | Security  | $5/feature     | Claude Sonnet | STRIDE threat model       |
| 2-3   | UI/UX     | $5/feature     | Claude Sonnet | UI spec generation        |
| 3     | Dev-BE    | $15/feature    | Claude Sonnet | 4 services code gen       |
| 3     | Dev-FE    | $10/feature    | Claude Sonnet | 7 screens React           |
| 4     | QA        | $10/feature    | Claude Sonnet | Test generation           |
| 5     | DevOps    | $5/feature     | Claude Sonnet | Pipeline + Helm gen       |
| —     | CI Review | $2/PR          | Claude Sonnet | Automated PR review       |

**Total default per feature: ~$72**

## Cost Dashboard

Track trong session logs:

```
features/{{FEATURE}}/sessions/
├── meta.json    ← model, tokens, cost, duration
└── full.json    ← full session transcript
```

Aggregate report: `docs/finops-report.md` (auto-generated monthly).

## Provider-Mix Routing

| Task type         | Preferred model   | Fallback      | Lý do                     |
| ----------------- | ----------------- | ------------- | ------------------------- |
| Code generation   | Claude Sonnet 4.6 | Claude Haiku  | Balance quality/cost      |
| Doc drafting      | Claude Sonnet 4.6 | GLM-4         | Template-heavy, lower bar |
| Review / Analysis | Claude Opus 4.7   | Claude Sonnet | Highest quality needed    |
| Quick lookup      | Claude Haiku      | —             | Cheapest, fastest         |
| Security review   | Claude Opus 4.7   | —             | Non-negotiable quality    |

## Budget Alerts

| Threshold                  | Action                                                    |
| -------------------------- | --------------------------------------------------------- |
| 80% of per-feature budget  | Warning in session log                                    |
| 100% of per-feature budget | Soft stop: agent finishes current task, doesn't start new |
| 150% of per-feature budget | Hard stop: agent terminates. Human review required        |
| Monthly total > $500       | Review meeting. Adjust budgets or scope                   |

## Tracking Template

Mỗi session log `meta.json`:

```json
{
  "feature": "TT-OUT-MANUAL",
  "role": "ba",
  "stage": 1,
  "model": "claude-sonnet-4-6",
  "timestamp_start": "2026-05-08T10:00:00Z",
  "timestamp_end": "2026-05-08T10:45:00Z",
  "duration_minutes": 45,
  "input_tokens": 50000,
  "output_tokens": 15000,
  "estimated_cost_usd": 1.2,
  "budget_usd": 5.0,
  "budget_remaining_usd": 3.8,
  "artifacts_produced": ["domain/glossary.md", "domain/states.yaml"],
  "quality_gates_passed": ["R0010", "R0011", "R0120"],
  "escalations_triggered": []
}
```
