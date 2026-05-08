# Workspace: Dev FE — Frontend Developer (Stage 3')

Workspace cho **React frontend**. Sinh 7 màn S01-S07 từ contracts.

## Vai trò

Implement React 18 + Vite + TypeScript, 7 màn S01-S07, auth giả 3 user (maker/checker/approver).

## Bắt đầu

```bash
cd /home/hung/mvp-kho-bac/workspaces/dev-fe
test -f ../../gates/G2-sa-signoff.md || echo "❌ G2 chưa sign-off"
claude code .
# > react-builder
```

## Đọc trước

- [Root CLAUDE.md](../../CLAUDE.md)
- [docs/CONTEXT.md](../../docs/CONTEXT.md)
- [docs/WORKFLOW.md § Stage 3](../../docs/WORKFLOW.md)
- **SA output**: `../sa/contracts/openapi/api-internal-v1.yaml`
- **BA output**: `../ba/domain/screens.yaml`, `../ba/domain/user-stories/*.feature`

## Output bắt buộc

```
frontend/
├── src/
│   ├── pages/
│   │   ├── S01-PaymentOrderList.tsx
│   │   ├── S02-PaymentOrderForm.tsx     (Create / Edit / Clone modes)
│   │   ├── S03-PaymentOrderDetail.tsx
│   │   ├── S04-ApprovalQueue.tsx
│   │   ├── S05-RejectDialog.tsx
│   │   ├── S06-CancelReverse.tsx
│   │   └── S07-DeleteConfirm.tsx
│   ├── components/payment/
│   ├── components/approval/
│   ├── lib/api-client/                  ← OpenAPI codegen
│   ├── auth/                            ← maker/checker/approver mock
│   └── i18n/                            ← Vietnamese first
├── tests/
│   └── components/                      ← Vitest unit test
├── vite.config.ts
├── tailwind.config.ts
└── package.json
```

## Quy tắc

- **Form S02 — màn lập LTT**: validate đủ 36 VAL rule, hiển thị message tiếng Việt
- **Optimistic lock** — gửi `If-Match` header với version, handle 409
- **Idempotency key** — sinh client-side cho mọi POST
- **A11y** — keyboard navigation, ARIA cho form lệnh chi
- **Mask** số TK trên UI: `1234****5678`
- **KHÔNG fetch direct** — qua BFF (`/api/internal/*`)

## Agent & Plugin hỗ trợ

- **Agent `react-builder`**:
  - **Cách gọi**: `> react-builder`
  - **Kỹ năng**: Sinh React components, Hooks và tích hợp API Client từ OpenAPI.
- **Plugin `superpowers`**:
  - **Ứng dụng**: Kiểm tra `screens.yaml` để đảm bảo UI không thiếu field nào so với đặc tả của BA.

## Output Paths

Tất cả artifacts viết vào: `features/{{FEATURE_NAME}}/` và `frontend/`

- UI implementation: `frontend/` (workspace-local)
- Tham khảo `workspaces/ui/ui/` cho UI spec

## Nhiệm vụ trọng tâm (Day 1)

1. Verify G2 sign-off.
2. Chạy `react-builder` sinh khung cho 7 màn hình.
3. Review UX: Workflow Maker→Checker→Approver trên màn hình S02/S04.

## KHÔNG được làm

- Gọi MQ trực tiếp (qua BFF)
- Hardcode credential / endpoint prod
- Tự đặt validation rule khác `validation-rules.yaml`
