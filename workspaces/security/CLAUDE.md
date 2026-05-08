# Workspace: Security — Security Engineer (Stage 2)

Workspace dành riêng cho **Stage 2 Security**. Làm việc song song với SA, đọc output BA + SA contracts, sinh threat model + security policies.

## Vai trò

Đọc `workspaces/ba/domain/` + `workspaces/sa/contracts/` (read-only) → sinh threat model STRIDE, security policies, compliance checklist.

## Bắt đầu

```bash
cd /home/hung/mvp-kho-bac/workspaces/security
# Verify G1 đã sign:
test -f ../../gates/G1-ba-signoff.md || echo "G1 chưa sign-off"

claude code .
# > security-threat-modeler
```

## Đọc trước (bắt buộc)

- [Root CLAUDE.md](../../CLAUDE.md)
- [docs/CONTEXT.md](../../docs/CONTEXT.md) — glossary VDBAS/KBNN
- [docs/WORKFLOW.md § Stage 2](../../docs/WORKFLOW.md) — yêu cầu output
- [docs/SAFETY.md](../../docs/SAFETY.md) — security policy + two-tier confidentiality
- [docs/GATEKEEPERS.md § G-SEC](../../docs/GATEKEEPERS.md) — bạn là G-SEC
- **ADR reference**: [docs/adr/](../../docs/adr/) — đặc biệt ADR-0004, ADR-0009

## Input

- **BA output**: `../ba/domain/*.yaml` (read-only)
- **SA contracts**: `../sa/contracts/` (read-only)
- **DBA schema**: `../db/db/migrations/` (read-only)

## Output bắt buộc (sinh trong `features/{{FEATURE}}/`)

```
features/{{FEATURE}}/
└── 06-threat-model.md           ← STRIDE analysis đầy đủ

security/
├── policies/
│   ├── data-classification.md   ← PII/Restricted/Internal/Public
│   ├── access-control.md        ← RBAC + SoD matrix
│   └── incident-response.md     ← Security incident playbook
├── compliance/
│   └── owasp-top10-checklist.md ← OWASP mapping cho LTT
└── agent-safety/
    └── prompt-injection-defense.md  ← Agent prompt boundary rules
```

## Quy tắc

- **Threat model STRIDE**: tập trung Tampering + Repudiation + Information Disclosure cho LTT
- **Maker-Checker-Approver SoD**: verify ở cả application và DB level
- **Two-tier confidentiality**: Public docs trong repo, Restricted docs trong `docs-confidential/`
- **Agent boundaries**: KHÔNG cho agent access `docs-confidential/`
- **PII handling**: tuân thủ SAFETY.md — không log số TK, CMND đầy đủ
- **Replay attack defense**: idempotency key + timestamp validation trên MQ messages

## Gate G-SEC

Khi xong:

1. Self-check: STRIDE đầy đủ 6 categories, mỗi threat có mitigation
2. Verify SoD constraint coverage
3. AI tóm tắt thành `gates/G-SEC-summary.md`
4. G-SEC reviewer (Security Lead) review trong 24h
5. Sign-off → tạo `gates/G-SEC-signoff.md`

## KHÔNG được làm

- Sửa `domain/` của BA (read-only)
- Sửa `contracts/` của SA (read-only)
- Sinh code service (Stage 3)
- Thay đổi security policy mà không có Security Lead approval

## Agent & Plugin hỗ trợ

- **Agent `security-threat-modeler`**: Đọc domain YAML + contracts → sinh STRIDE threat model.
  - **Cách gọi**: `> security-threat-modeler`
- **Plugin `superpowers`**: Cross-check threat model vs OWASP Top 10 coverage.

## Nhiệm vụ trọng tâm (Day 1)

1. Verify Gate G1 đã sign-off.
2. Chạy `security-threat-modeler` để sinh threat model STRIDE.
3. Review kỹ replay/tampering mitigations cho MQ channel LNH.
4. Verify access-control.md cover đủ 4 vai trò nghiệp vụ + SoD.

## Khi gặp vướng

- Threat cần domain expert: escalate qua docs/escalations/ template
- Policy conflict với SA design: coordinate với SA workspace
- Compliance requirement mới: flag và tạo issue

## Output Paths

Tất cả artifacts viết vào: `features/{{FEATURE_NAME}}/`

- [06-threat-model.md]: `features/{{FEATURE_NAME}}/06-threat-model.md`
- Security policies: `security/` (shared, không theo feature folder)
