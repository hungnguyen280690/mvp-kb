# ADR-SA-0002: Saga Orchestration cho quy trình LTT nhiều bước

- **Status**: Accepted
- **Date**: 2026-05-10
- **Decision makers**: SA Lead

## Context

Một Lệnh thanh toán (LTT) đi NHNN thủ công có vòng đời gồm tối thiểu 8 bước nghiệp vụ: Tạo (DRAFT) → Gửi kiểm soát (SUBMITTED) → Kiểm soát (IN_CONTROL) → Phê duyệt (APPROVED) → Ký số (SIGNED) → Gửi NH (SENT) → Xác nhận NH (CONFIRMED) → Hạch toán GL (POSTED). Ngoài ra còn có các bước phụ: Reserve quỹ, Push ECM, Push QLT, Push QLChi, Notification.

Tại nhiều bước, LTT tương tác với hệ thống bên ngoài (IBM MQ, NHNN/CITAD Gateway, GL, ECM, TAD-COMM). Mỗi bước có thể thất bại và cần rollback một phần hoặc toàn bộ.

**Ràng buộc**:
- 15 trạng thái LTT với nhiều nhánh rẽ (reject, cancel, fail, reverse, block).
- Reserve fund phải được release khi Reject/Cancel (BIZ-RELEASE-HOLD).
- Sau CONFIRMED, phải hạch toán GL; nếu GL fail → POST_FAILED, cần alert vận hành.
- CLAUDE.md nguyên tắc 3: Sử dụng cơ chế điều phối (orchestration) thay vì biên đạo (choreography).

**Các lựa chọn xem xét**:

1. **Choreography**: Mỗi service phát event, service khác subscribe và tự quyết định hành động tiếp.
2. **Orchestration**: Một Saga Orchestrator trung tâm quản lý toàn bộ luồng, quyết định bước tiếp theo, xử lý compensating action khi fail.

## Decision

Chọn **Saga Orchestration** (lựa chọn 2). Orchestrator là một thành phần (component) bên trong LTT Service.

**Thiết kế Orchestrator**:

```
LTT Saga Orchestrator
├── Input: LTT ID + Event type (SUBMIT, APPROVE, SIGN, SEND, CALLBACK, GL_RESULT)
├── State: Saga state machine (khác với LTT state machine — saga state theo dõi tiến trình đa bước)
├── Logic:
│   ├── Đọc trạng thái hiện tại của LTT từ DB
│   ├── Xác định bước tiếp theo dựa trên event + trạng thái
│   ├── Thực hiện action (gọi service, đẩy MQ, update DB)
│   ├── Nếu action fail → thực hiện compensating action
│   └── Ghi saga step vào audit log
└── Output: Cập nhật trạng thái LTT + phát event (qua outbox)
```

**Ví dụ luồng Saga: Submit → ... → POSTED**:

1. **Submit**: Orchestrator gọi `reserve_fund()` → ghi DB (SUBMITTED) → outbox event `TT.OUT.MANUAL.SUBMITTED`.
2. **Approve**: Orchestrator gọi `set_approver()` → ghi DB (APPROVED) → outbox event `TT.OUT.MANUAL.APPROVED`.
3. **Sign**: Orchestrator gọi TAD-COMM sign → ghi DB (SIGNED) → outbox event.
4. **Send**: Orchestrator gọi Gateway push MQ → ghi DB (SENT) → chờ callback.
5. **Callback Success**: Orchestrator nhận callback → ghi DB (CONFIRMED) → gọi GL post.
6. **GL Success**: Orchestrator nhận kết quả GL → ghi DB (POSTED) → outbox event `TT.OUT.MANUAL.POSTED`.
7. **GL Fail**: Orchestrator ghi DB (POST_FAILED) → alert ops → không rollback (LTT đã được NH xác nhận).

**Compensating actions**:

| Bước fail | Compensating action |
| :-------- | :------------------ |
| Reserve fund fail khi Submit | Rollback trạng thái về DRAFT, không phát event |
| TAD-COMM sign fail | Giữ ở APPROVED, cho phép retry sign |
| Gateway send fail (sau 3 retry) | Chuyển SEND_FAILED, cho phép resend hoặc cancel. Nếu cancel → release fund |
| GL post fail | Chuyển POST_FAILED, alert ops. **Không rollback** vì NH đã xác nhận |

**Lý do chọn Orchestration**:
- **Đồng bộ với CLAUDE.md**: Nguyên tắc 3 yêu cầu orchestration.
- **Khả năng quan sát**: Toàn bộ luồng saga nằm trong một chỗ, dễ debug và audit.
- **Compensating action rõ ràng**: Orchestrator biết chính xác khi nào cần rollback, rollback cái gì.
- **Phù hợp với Maker-Checker-Approver**: Luồng 3 cấp là tuần tự, orchestration phù hợp hơn event-driven choreography.
- **State persistence**: Saga state được lưu trong DB, survive pod restart.

## Consequences

### Tích cực
- **Tầm nhìn toàn cảnh (Visibility)**: Orchestrator cung cấp view toàn bộ luồng LTT, dễ giám sát và troubleshoot.
- **Rollback có kiểm soát**: Mỗi bước fail có compensating action được thiết kế trước.
- **Phù hợp nghiệp vụ**: Luồng Maker → Checker → Approver → Sign → Send là tuần tự, orchestration là mô hình tự nhiên.
- **Dễ mở rộng**: Thêm bước mới (vd: kiểm tra hợp đồng QLChi) chỉ cần thêm vào orchestrator.
- **Audit tập trung**: Mọi bước saga đều ghi audit từ một chỗ.

### Tiêu cực
- **Single point of failure**: Orchestrator fail → toàn bộ saga dừng. Giảm thiểu: Orchestrator là stateless component, saga state lưu DB, pod mới có thể tiếp tục.
- **Tight coupling**: Orchestrator biết về tất cả các bước và service. Tuy nhiên, trong bối cảnh MVP chỉ có 1 LTT Service, điều này chấp nhận được.
- **Overhead saga state**: Cần bảng `saga_instance` và `saga_step` trong DB.

### Rủi ro và giảm thiểu
| Rủi ro | Mức độ | Giảm thiểu |
| :------ | :------ | :--------- |
| Orchestrator pod crash giữa saga step | MEDIUM | Saga state persistent trong DB; pod mới đọc state và tiếp tục hoặc timeout |
| Orchestrator trở thành god object | LOW | Giữ orchestrator mỏng — chỉ điều phối, logic nghiệp vụ nằm ở domain service |
| Khó mở rộng sang choreography sau này | LOW | Event vẫn được phát qua outbox, service khác có thể subscribe thêm mà không ảnh hưởng orchestrator |

## References

- [CLAUDE.md](../../CLAUDE.md) — Nguyên tắc 3: Điều phối Saga (orchestration)
- [states.yaml](../../../ba/domain/states.yaml) — 15 trạng thái LTT + transitions
- [business-rules.yaml](../../../ba/domain/business-rules.yaml) — BIZ-RESERVE-FUND, BIZ-RELEASE-HOLD, BIZ-RETRY
- [api-spec.yaml](../../../ba/domain/api-spec.yaml) — API-001 đến API-009
- [events.yaml](../../../ba/domain/events.yaml) — E001-E022
- Chris Richardson, "Microservices Patterns", Ch. 4 — Saga pattern
