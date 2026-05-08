# Workspace: BA — Business Analyst (Stage 1)

Workspace dành riêng cho **Stage 1 BA**. Làm việc trong thư mục này, đọc shared docs ở root.

## Vai trò

Parse SRS xlsx → semantic model + Gherkin user stories → handoff cho SA (Stage 2).

## Bắt đầu

```bash
cd /home/hung/mvp-kho-bac/workspaces/ba
claude code .
# Trong Claude Code, gọi agent:
# > ba-parser
```

## Đọc trước (bắt buộc)

- [Root CLAUDE.md](../../CLAUDE.md)
- [docs/CONTEXT.md](../../docs/CONTEXT.md) — glossary VDBAS/KBNN
- [docs/WORKFLOW.md § Stage 1](../../docs/WORKFLOW.md) — yêu cầu output
- [docs/SAFETY.md](../../docs/SAFETY.md) — quy tắc viết artifact
- [docs/GATEKEEPERS.md § G1](../../docs/GATEKEEPERS.md) — bạn là G1

## Input

- **SRS xlsx**: `../../shared/specs/VDBAS_TT_SRS_*.xlsx` (chỉ đọc, KHÔNG sửa)

## Output bắt buộc (sinh trong `domain/`)

- `domain/glossary.md` — mở rộng từ CONTEXT.md
- `domain/states.yaml` — 15 trạng thái + transition
- `domain/business-rules.yaml` — 29 BIZ rule
- `domain/validation-rules.yaml` — 36 VAL rule
- `domain/permissions.yaml` — 4 vai trò + 5 SoD
- `domain/coa-segments.yaml` — COA matrix
- `domain/events.yaml` — 22 event
- `domain/notifications.yaml` — message catalog
- `domain/api-spec.yaml` — 12 API tóm lược
- `domain/screens.yaml` — 7 màn S01-S07
- **`domain/scope.yaml`** — đề xuất MVP scope (G1 review CỐT LÕI)
- `domain/inconsistencies.md` — flag điểm SRS thiếu / mâu thuẫn
- `domain/user-stories/*.feature` — Gherkin

## Gate

Khi xong:
1. Self-check: tất cả output có đủ không
2. AI tóm tắt thành `gates/G1-summary.md`
3. G1 reviewer (BA / nghiệp vụ KBNN) review trong 24h
4. Sign-off → tạo `gates/G1-ba-signoff.md` với chữ ký + ngày
5. Push lên GitHub → SA pull và bắt đầu Stage 2

## KHÔNG được làm

- Sinh `contracts/`, `services/`, `db/migrations/` (Stage 2-3)
- Sửa SRS xlsx
- Tự đoán rule không có trong SRS — flag vào `inconsistencies.md`
- Sửa file ngoài `domain/`, `gates/`

## Agent có sẵn

- `ba-parser` — tự động đọc 22 sheet SRS, sinh đầy đủ 12 file domain/

## Khi gặp vướng

- Rule mâu thuẫn: ghi `domain/inconsistencies.md` rồi notify G1
- SRS thiếu: KHÔNG đoán, ghi inconsistency
- Không hiểu thuật ngữ: hỏi nghiệp vụ KBNN trước, đừng tự dịch
