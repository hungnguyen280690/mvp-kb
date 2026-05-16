# Handoff: BA → SA

## Context

- **Feature**: [tên feature, ví dụ: TT-OUT-MANUAL]
- **Stage completed**: Stage 1 (BA)
- **Gate signed**: G1 — [date]

## Artifacts handed off

| Artifact          | Path                            | Status | Notes                      |
| ----------------- | ------------------------------- | ------ | -------------------------- |
| Glossary mở rộng  | `domain/glossary.md`            | Active | Mở rộng từ CONTEXT.md      |
| State machine     | `domain/states.yaml`            | Active | 15 trạng thái + transition |
| Business rules    | `domain/business-rules.yaml`    | Active | 29 BIZ rules               |
| Validation rules  | `domain/validation-rules.yaml`  | Active | 36 VAL rules               |
| Permissions       | `domain/permissions.yaml`       | Active | 4 vai trò + 5 SoD          |
| COA segments      | `domain/coa-segments.yaml`      | Active | COA matrix                 |
| Events            | `domain/events.yaml`            | Active | 22 events                  |
| Notifications     | `domain/notifications.yaml`     | Active | Message catalog            |
| API spec tóm lược | `domain/api-spec.yaml`          | Active | 12 API endpoints           |
| Screens           | `domain/screens.yaml`           | Active | 7 màn S01-S07              |
| MVP Scope         | `domain/scope.yaml`             | Active | G1 đã review               |
| Inconsistencies   | `domain/inconsistencies.md`     | Active | Flagged items              |
| User stories      | `domain/user-stories/*.feature` | Active | Gherkin scenarios          |

## Key decisions made

- MVP scope: [tóm tắt scope decisions]
- Inconsistencies resolved: [danh sách]
- Inconsistencies deferred: [danh sách + lý do]

## Open questions for SA

- [Question 1]
- [Question 2]

## SA Checklist

- [ ] Đọc tất cả `domain/*.yaml`
- [ ] Verify state machine đủ transitions
- [ ] Check COA segments cover đủ use cases
- [ ] Review inconsistencies.md — flag những cái ảnh hưởng architecture
- [ ] Confirm scope.yaml trước khi design
