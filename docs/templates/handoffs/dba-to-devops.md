# Handoff: DBA → DevOps

## Context

- **Feature**: [tên feature]
- **Stage completed**: Stage 2 (DBA)
- **Gate signed**: G-DBA — [date]

## Artifacts handed off

| Artifact       | Path                                     | Status |
| -------------- | ---------------------------------------- | ------ |
| DDL Init       | `db/migrations/V1__init_ltt.sql`         | Active |
| DDL Outbox     | `db/migrations/V2__outbox.sql`           | Active |
| DDL Audit      | `db/migrations/V3__audit_hash_chain.sql` | Active |
| DDL Lock       | `db/migrations/V4__lock_table.sql`       | Active |
| DDL COA        | `db/migrations/V5__coa_segments.sql`     | Active |
| Rollback R1-R5 | `db/rollback/`                           | Active |

## Migration notes

- **Execution order**: V1 → V2 → V3 → V4 → V5 (strict sequential)
- **Rollback order**: R5 → R4 → R3 → R2 → R1 (reverse)
- **Oracle-specific**: Uses SEQUENCE, not auto-increment
- **Locking**: V3 audit table is append-only — no UPDATE/DELETE allowed
- **Performance**: V1 init table đã có indexes cho hot-path queries

## Deployment considerations

- Migrations nên chạy off-peak (Oracle lock escalation risk)
- V3 audit table sẽ grow fast — cần partitioning strategy trong DevOps runbook
- Rollback test trên staging TRƯỚC khi deploy production

## DevOps Checklist

- [ ] Include migrations trong Helm chart initContainer
- [ ] Setup Flyway migration runner
- [ ] Test forward + rollback trên Oracle Free
- [ ] Monitor migration execution time trong deploy pipeline
- [ ] Setup audit table partitioning (monthly)
