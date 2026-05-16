# LTT State Machine — TT.OUT.MANUAL

> Nguồn: `workspaces/ba/domain/states.yaml` — sinh ở Stage 1, SA/Dev đọc file này.

## Tổng quan

LTT (Lệnh thanh toán đi NHNN thủ công) có **15 trạng thái** và **20 transitions** (+ 1 global BLOCK).

## Sơ đồ state machine

```
                          ┌──────────┐
                 edit     │  DRAFT   │←──────────────────┐
              ┌──────────►│ (initial)│                   │
              │           └────┬─────┘                   │
              │                │ submit                  │
              │                ▼                         │
              │           ┌───────────┐    return        │
              │           │ SUBMITTED │◄────────────┐    │
              │           └─────┬─────┘             │    │
              │                 │ approve (checker)  │    │
              │                 ▼                    │    │
              │           ┌───────────┐    return    │    │
              │           │IN_CONTROL │◄────────┐   │    │
              │           └─────┬─────┘         │   │    │
              │                 │ approve (appr) │   │    │
              │                 ▼                │   │    │
              │           ┌───────────┐          │   │    │
              │           │ APPROVED  │          │   │    │
              │           └─────┬─────┘          │   │    │
              │                 │ sign           │   │    │
              │                 ▼                │   │    │
              │           ┌───────────┐          │   │    │
              │           │  SIGNED   │          │   │    │
              │           └─────┬─────┘          │   │    │
              │                 │ send           │   │    │
              │                 ▼                │   │    │
              │     ┌──────────────────────┐     │   │    │
              │     │         SENT         │     │   │    │
              │     └──────────┬───────────┘     │   │    │
              │          ┌────┴────┐             │   │    │
              │     fail │        │ success      │   │    │
              │          ▼        ▼              │   │    │
              │   ┌───────────┐ ┌───────────┐    │   │    │
              │   │SEND_FAILED│ │ CONFIRMED  │    │   │    │
              │   └─────┬─────┘ └─────┬──────┘    │   │    │
              │         │             │ post GL    │   │    │
              │         │             ▼            │   │    │
              │         │     ┌──────────────┐     │   │    │
              │         │     │              │     │   │    │
              │         │  ┌──┴───┐    ┌─────┴──┐ │   │    │
              │         │  │POSTED│    │POST_FAIL│ │   │    │
              │         │  │(final)│   └────────┘ │   │    │
              │         │  └──────┘               │   │    │
              │         │                         │   │    │
              │    ┌────┴─────────────────────────┘   │    │
              │    │ retry                             │    │
              │    ▼                                   │    │
              │  cancel/reverse                        │    │
              │    │                                   │    │
              │    ▼                                   ▼    │
              │  ┌───────────┐              ┌──────────────┤
              │  │ CANCELLED │              │RETURNED_TO_* │
              │  │  (final)  │              └──────────────┘
              │  └───────────┘
              │    ▲
              │    │
              └────┘ delete (soft)
```

## Bảng trạng thái

| # | State | Mô tả | Vai trò chính | Final? |
|---|-------|-------|---------------|--------|
| 1 | DRAFT | Maker tạo mới/lưu nháp | Maker | No |
| 2 | SUBMITTED | Đã gửi kiểm soát | Checker | No |
| 3 | IN_CONTROL | Checker đã thông qua | Approver | No |
| 4 | APPROVED | Approver đã duyệt | Approver | No |
| 5 | SIGNED | Đã ký số (TAD-COMM) | Approver | No |
| 6 | SENT | Đã gửi qua gateway NHNN | System | No |
| 7 | CONFIRMED | NHNN/KB xác nhận thành công | System | No |
| 8 | POSTED | Đã hạch toán GL thành công | System | Yes |
| 9 | RETURNED_TO_MAKER | Checker/Approver trả lại | Maker | No |
| 10 | RETURNED_TO_CHECKER | Approver trả lại Checker | Checker | No |
| 11 | SEND_FAILED | Gateway báo lỗi | Maker/Checker | No |
| 12 | POST_FAILED | GL hạch toán lỗi | Checker | No |
| 13 | CANCELLED | Đã huỷ | Maker/System | Yes |
| 14 | REVERSED | Đã đảo bút toán | Approver | Yes |
| 15 | BLOCKED | Khóa do nghi ngờ gian lận | Admin | Yes |

## Transitions chính

| Từ → Đến | Event | Guards | Actions |
|-----------|-------|--------|---------|
| DRAFT → SUBMITTED | SUBMIT | VAL-005, VAL-019, BIZ-COA-CROSS, BIZ-LIMIT, BIZ-COT-CHECK | reserve_fund, audit_create, notify_checker |
| SUBMITTED → IN_CONTROL | CHECKER_APPROVE | BIZ-MAKER-CHECKER, BIZ-SOD | audit_approve, notify_approver |
| SUBMITTED → RETURNED_TO_MAKER | CHECKER_REJECT | BIZ-REJECT-REASON | release_hold, notify_maker |
| IN_CONTROL → APPROVED | APPROVER_APPROVE | BIZ-SOD, BIZ-MAKER-CHECKER | audit_approve, notify_signer |
| IN_CONTROL → RETURNED_TO_CHECKER | APPROVER_REJECT | BIZ-REJECT-REASON | notify_checker |
| APPROVED → SIGNED | SIGN | BIZ-SIGN-TAD-COMM, BIZ-TOKEN-VALID | store_signature, audit_sign |
| SIGNED → SENT | SEND | BIZ-CHANNEL-ROUTING | send_to_gateway, audit_send |
| SENT → CONFIRMED | CALLBACK_SUCCESS | Idempotency check | release_fund, audit_confirm, post_gl |
| SENT → SEND_FAILED | CALLBACK_FAIL | - | notify_maker, audit_fail |
| CONFIRMED → POSTED | GL_POST_SUCCESS | - | audit_post, notify_complete |
| CONFIRMED → POST_FAILED | GL_POST_FAIL | - | notify_checker, audit_gl_fail |
| DRAFT → CANCELLED | CANCEL | BIZ-EDIT-OWN | soft_delete, audit_cancel |
| Any → BLOCKED | BLOCK | Admin only | audit_block, notify_all |

> Chi tiết đầy đủ: `workspaces/ba/domain/states.yaml`
