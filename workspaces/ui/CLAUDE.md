# Workspace: UI/UX — User Interface Designer (Stage 2-3)

Workspace dành riêng cho **Stage 2-3 UI/UX**. Đọc output BA screens + SA contracts, sinh UI spec + component design.

## Vai trò

Đọc `workspaces/ba/domain/screens.yaml` + `workspaces/sa/contracts/openapi/` (read-only) → sinh UI spec, component library, accessibility baseline.

## Bắt đầu

```bash
cd /home/hungnv/mvp-kho-bac/workspaces/ui
# Verify G1 đã sign:
test -f ../../gates/G1-ba-signoff.md || echo "G1 chưa sign-off"

claude code .
# > ui-spec-builder
```

## Đọc trước (bắt buộc)

- [Root CLAUDE.md](../../CLAUDE.md)
- [docs/CONTEXT.md](../../docs/CONTEXT.md) — glossary VDBAS/KBNN
- [docs/WORKFLOW.md § Stage 2-3](../../docs/WORKFLOW.md) — yêu cầu output
- [docs/SAFETY.md](../../docs/SAFETY.md) — UX-related safety rules
- [docs/GATEKEEPERS.md § G-UI](../../docs/GATEKEEPERS.md) — bạn là G-UI
- **ADR reference**: [docs/adr/](../../docs/adr/) — đặc biệt ADR-0014, ADR-0016

## Input

- **BA output**: `../ba/domain/screens.yaml`, `../ba/domain/permissions.yaml` (read-only)
- **SA contracts**: `../sa/contracts/openapi/` (read-only)

## Output bắt buộc (sinh trong `features/{{FEATURE}}/`)

```
features/{{FEATURE}}/
└── 07-ui-spec.md                 ← UI specification đầy đủ

ui/
├── design-system/
│   ├── colors.md                 ← Color palette + accessibility contrast ratios
│   ├── typography.md             ← Font scale + spacing system
│   └── components.md             ← Component inventory (shadcn/ui based)
├── screens/
│   ├── S01-payment-order-list.md     ← Wireframe + interaction spec
│   ├── S02-payment-order-form.md     ← Form validation + layout
│   ├── S03-payment-order-detail.md   ← Detail view + actions
│   ├── S04-approval-queue.md         ← Queue + bulk actions
│   ├── S05-reject-dialog.md          ← Dialog + reason required
│   ├── S06-cancel-reverse.md         ← Cancel/reverse flow
│   └── S07-delete-confirm.md         ← Confirmation pattern
└── accessibility/
    └── a11y-baseline.md          ← WCAG 2.1 AA compliance checklist
```

## Quy tắc

- **Tech stack locked**: React 18 + TypeScript + Tailwind CSS + shadcn/ui (ADR-0014)
- **WCAG 2.1 AA**: mọi screen phải đạt accessibility baseline
- **Consistent patterns**: dùng shadcn/ui components, không custom trừ khi cần
- **Vietnamese UI**: tất cả labels, messages, validation errors bằng tiếng Việt
- **Form validation**: match `domain/validation-rules.yaml` của BA
- **Permission-aware UI**: show/hide actions dựa trên `domain/permissions.yaml`

## Gate G-UI

Khi xong:

1. Self-check: 7 screens đủ + a11y baseline pass
2. Verify form validation match BA rules
3. AI tóm tắt thành `gates/G-UI-summary.md`
4. G-UI reviewer (UI Lead) review trong 24h
5. Sign-off → tạo `gates/G-UI-signoff.md`

## KHÔNG được làm

- Sửa `domain/` của BA (read-only)
- Sửa `contracts/` của SA (read-only)
- Sinh frontend code (đó là dev-fe workspace)
- Thay đổi tech stack (locked by ADR-0014)

## Agent & Plugin hỗ trợ

- **Agent `ui-spec-builder`**: Đọc screens.yaml + OpenAPI → sinh UI spec cho 7 màn.
  - **Cách gọi**: `> ui-spec-builder`
- **Plugin `superpowers`**: Cross-check UI spec vs validation rules consistency.

## Nhiệm vụ trọng tâm (Day 1)

1. Verify Gate G1 đã sign-off.
2. Chạy `ui-spec-builder` để sinh UI spec cho 7 screens.
3. Review kỹ S02 (Payment Order Form) — form validation phức tạp nhất.
4. Verify a11y baseline cho tất cả screens.

## Khi gặp vướng

- UX conflict với business rules: escalate qua docs/escalations/ template
- Component không có trong shadcn/ui: flag và evaluate custom vs alternative
- Accessibility trade-off: document rationale trong a11y-baseline.md

## Output Paths

Tất cả artifacts viết vào: `features/{{FEATURE_NAME}}/`

- [07-ui-spec.md]: `features/{{FEATURE_NAME}}/07-ui-spec.md`
- UI design docs: `ui/` (shared, không theo feature folder)
