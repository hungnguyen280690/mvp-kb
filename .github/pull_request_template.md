<!--
PR template — hệ thống tự kiểm các mục dưới qua CI.
Điền đủ giúp Claude reviewer + người duyệt xử lý nhanh.
-->

## Tóm tắt
<!-- 1-3 câu: thay đổi gì, vì sao -->


## Liên kết
- Ticket Linear / Jira: 
- Stage trong pipeline (BA / SA / Dev / Test / DevOps): 
- ADR / docs liên quan: 

## Phân loại rủi ro
<!-- Để Claude reviewer + branch protection áp dụng đúng quy tắc -->
- [ ] 🟢 Low-risk (docs, comment, test only, dependency patch)
- [ ] 🟡 Medium-risk (logic thường, UI không touch tiền/auth)
- [ ] 🔴 High-risk (LTT/outbox/audit/saga/payment/auth/signature/idempotency, DB migration, prod config)

## Self-check (xác nhận đã làm)
- [ ] Đã đọc [SAFETY.md](../docs/SAFETY.md), không vi phạm cấp 1
- [ ] Đã chạy `./mvnw verify` / `pnpm test` local — xanh
- [ ] Đã viết unit test, coverage không giảm
- [ ] Đã cập nhật `domain/*` / `contracts/*` nếu thay đổi nghiệp vụ / API
- [ ] Không hard-code credential, không log số TK / CMND đầy đủ
- [ ] Migration mới (không sửa file đã merge)
- [ ] OpenAPI khớp với code (nếu có endpoint mới)
- [ ] Đã thêm/cập nhật runbook nếu có alert mới

## Test plan
<!-- Reviewer cần biết check gì để đảm bảo PR không hỏng -->
- [ ] 
- [ ] 

## Screenshot / log (nếu UI hoặc logging thay đổi)


## Auto-merge?
<!-- Đặt label `auto-merge` nếu muốn merge tự động sau khi all check + Claude LGTM + 1 human approval. KHÔNG đặt nếu cần review tay. -->
- [ ] Đặt label `auto-merge`

---
<!-- Phần dưới là cho Claude reviewer + maintainer, không xoá -->

### Claude reviewer focus
<!-- Hint cho Claude review tập trung vào đâu (optional) -->


### Stage gate (nếu áp dụng)
- [ ] G1 (BA) — `gates/G1-ba-signoff.md` đã ký
- [ ] G2 (SA) — `gates/G2-sa-signoff.md` đã ký
- [ ] G3 (Java Lead) — review xong
- [ ] G3' (FE Lead) — review xong (nếu có FE)
- [ ] G4 (QA) — test xanh
- [ ] G5 (SRE) — chỉ với PR prod
