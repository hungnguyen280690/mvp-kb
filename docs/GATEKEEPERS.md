# Gatekeepers — Người gác cổng theo chuyên môn

Mỗi stage trong pipeline có **1 người gác cổng riêng**, chuyên môn của họ. Họ chỉ review phần thuộc lĩnh vực mình giỏi nhất, không phải hiểu toàn bộ hệ thống.

## Bảng gatekeeper

| Gate | Stage | Vai trò | Chuyên môn cần | Output ký xác nhận | Time/lần |
|---|---|---|---|---|---|
| **G1** | 1 — BA | BA / Nghiệp vụ KBNN | Thông tư BTC, COA, NDKT, quy trình thanh toán | Sign-off `domain/scope.yaml` + `domain/glossary.md` | 2h |
| **G2** | 2 — SA | Solution Architect | Microservice, threat modeling, Oracle, message bus | Sign-off `contracts/*` + `db/migrations/*` + `docs/threat-model.md` | 4h |
| **G3** | 3 — Dev BE | Senior Java Lead | Spring Boot 3, DDD, saga, Oracle, IBM MQ | Approve PR per service (focus BIZ critical) | 1h × 4 PR = 4h |
| **G3'** | 3 — Dev FE | Senior Frontend Lead | React 18, TS, banking UX, accessibility | Approve PR frontend | 1h |
| **G4** | 4 — Test | QA Lead / Test Architect | Test pyramid, Pact, Playwright, k6, security test | Sign-off CI test xanh + triage flaky | 30min |
| **G5** | 5 — DevOps | DevOps / SRE Lead | OpenShift, Tekton, ArgoCD, Helm, OTel | Approve prod sync + đọc 3 runbook | 1h |

**Tổng**: ~12-13 giờ trên toàn bộ MVP, chia 6 người, mỗi người không quá vài giờ.

## Quy tắc cho gatekeeper

1. **Không ai gác cổng phần ngoài chuyên môn**. G1 không review code, G3 không review nghiệp vụ.
2. **AI chuẩn bị tóm tắt** cho mỗi gate (~1 trang) để gatekeeper không phải đọc hết artifact.
3. **Reject phải kèm lý do cụ thể** — viết ở đâu (file:line), sai gì, sửa thế nào.
4. **Sign-off lưu trong git** — file `gates/G{N}-{stage}-signoff.md` với chữ ký + ngày.
5. **Time limit 24h** — không sign trong 24h thì escalate; tránh tắc nghẽn.
6. **Kế thừa** — nếu G2 sign-off contracts thì G3 không tranh luận lại contract, chỉ implement.

## Workflow gate

```
[AI hoàn thành stage N]
        ↓
[AI tóm tắt diff + risk → docs/gates/G{N}-summary.md]
        ↓
[Notify gatekeeper qua Linear/Slack]
        ↓
   ┌────┴─────┐
   │          │
APPROVE    REJECT (kèm lý do)
   │          │
   ↓          ↓
[Stage N+1]  [AI sửa, lặp lại]
```

## Khi gatekeeper bận / không có

- **G1 vắng**: dùng SRS + commentary từ team nghiệp vụ làm proxy. KHÔNG được skip.
- **G2 vắng**: tăng cường review G3 (senior dev hiểu kiến trúc) thay tạm 1 lần. Lần sau phải có G2 thật.
- **G3/G3' vắng**: AI reviewer + 1 dev khác peer review. Chấp nhận được.
- **G4 vắng**: nếu CI xanh đủ 5 tầng (unit/contract/integration/E2E/security) thì auto-pass. G4 review post-merge.
- **G5 vắng**: KHÔNG được skip prod gate. Đợi.

## Anti-pattern (đừng làm)

- ❌ 1 người gác hết — burn-out + bottleneck
- ❌ AI tự phê duyệt artifact của chính nó
- ❌ Skip gate vì "đang gấp"
- ❌ Gatekeeper review luôn cả implementation detail (vượt scope chuyên môn)
- ❌ Chữ ký số gate bằng emoji trong chat — phải lưu file commit
