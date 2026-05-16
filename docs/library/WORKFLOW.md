# Quy trình 5 Giai đoạn — BA → SA → Dev → Test → DevOps

Mọi công việc đều phải trải qua 5 giai đoạn tuần tự. Đầu ra của giai đoạn trước là đầu vào của giai đoạn sau. Mỗi giai đoạn đều có người gác cổng riêng (xem [GATEKEEPERS.md](GATEKEEPERS.md)).

## Tổng quan luồng công việc

```
SRS xlsx (Tài liệu gốc)
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 1 — BA (AI phân tích SRS)     ✋ Cổng G1: BA  │
│ Đầu ra: domain/glossary, states, rules, *.feature       │
└─────────────────┬───────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 2 — SA + DBA + Bảo mật + UI   ✋ Cổng G2: SA  │
│ (AI tạo thiết kế, 4 vai chạy song song) ✋ Cổng G-DBA   │
│ Đầu ra: contracts, DDL, threat model, UI spec           │
│                                         ✋ Cổng G-SEC   │
│                                         ✋ Cổng G-UI    │
└─────────────────┬───────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 3 — Dev (AI lập trình)        ✋ Cổng G3: BE  │
│                                         ✋ Cổng G3': FE │
│ Đầu ra: 4 dịch vụ Java + Giao diện React                │
└─────────────────┬───────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 4 — Test (AI kiểm thử)        ✋ Cổng G4: QA  │
│ Đầu ra: Unit + Contract + Integration + E2E + Perf + Sec│
└─────────────────┬───────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│ GIAI ĐOẠN 5 — DevOps (AI triển khai)    ✋ Cổng G5: SRE │
│ Đầu ra: Tekton + ArgoCD + Helm + OTel + runbook         │
└─────────────────────────────────────────────────────────┘
```

---

## GIAI ĐOẠN 1 — BA (Phân tích Nghiệp vụ)

**Đầu vào**: File SRS xlsx

**AI thực hiện**:

- Phân tích 22 sheet thành **mô hình nghiệp vụ YAML** (máy đọc được).
- Sinh `domain/glossary.md` (Từ điển nghiệp vụ đầy đủ).
- Sinh `domain/states.yaml` — 15 trạng thái và các bước chuyển.
- Sinh `domain/business-rules.yaml` — 29 quy tắc nghiệp vụ (BIZ).
- Sinh `domain/validation-rules.yaml` — 36 quy tắc kiểm soát (VAL).
- Sinh `domain/permissions.yaml` — Phân quyền và 5 quy tắc SoD.
- Sinh `domain/user-stories/*.feature` — Các kịch bản kiểm thử Gherkin.
- Sinh `domain/scope.yaml` — Phạm vi MVP đã chốt.
- Phát hiện các điểm mâu thuẫn trong SRS.

**Cổng G1 soát xét**:

- Chốt phạm vi MVP (Ví dụ: Chỉ kênh LNH).
- Kiểm tra ma trận trạng thái và các quy tắc nghiệp vụ quan trọng.
- Ký duyệt: `gates/G1-ba-signoff.md`.

---

## GIAI ĐOẠN 2 — Thiết kế (SA + DBA + Bảo mật + UI/UX)

**Đầu vào**: Toàn bộ nội dung trong thư mục `domain/` từ Giai đoạn 1.

4 vai trò chạy song song:

### Kiến trúc sư (SA)

- Sinh hợp đồng OpenAPI và AsyncAPI.
- Sinh sơ đồ kiến trúc C4 (Context, Container, Component).
- Sinh các Quyết định Kiến trúc (ADR).
- Ký duyệt: `gates/G2-sa-signoff.md`.

### Quản trị dữ liệu (DBA)

- Sinh các kịch bản tạo bảng (DDL) cho Oracle.
- Sinh kịch bản cho bảng Outbox và Audit (kiểm toán).
- Sinh kịch bản hoàn tác (rollback).
- Ký duyệt: `gates/G-DBA-signoff.md`.

### Bảo mật (Security)

- Sinh mô hình hóa mối đe dọa (Threat model).
- Sinh chính sách kiểm soát truy cập và phân loại dữ liệu.
- Ký duyệt: `gates/G-SEC-signoff.md`.

### Giao diện (UI/UX)

- Sinh đặc tả chi tiết cho 7 màn hình (S01-S07).
- Sinh hệ thống thiết kế (Design system).
- Ký duyệt: `gates/G-UI-signoff.md`.

---

## GIAI ĐOẠN 3 — Lập trình (Dev)

**Đầu vào**: Hợp đồng API và cấu trúc DB từ Giai đoạn 2.

**AI thực hiện**:

- Sinh 4 dịch vụ Backend Java (Core, Gateway, GL Pusher, BFF).
- Sinh giao diện Frontend React.
- Mỗi Agent tự sinh: Mã nguồn, Unit test, Dockerfile, Helm values.

**Cổng G3 soát xét**:

- Tập trung vào các quy tắc nghiệp vụ cốt lõi: Phân tách Maker-Checker, Giữ chỗ nguồn vốn, Kiểm toán chuỗi Hash.
- Kiểm tra tính nhất quán của giao diện và luồng phê duyệt.

---

## GIAI ĐOẠN 4 — Kiểm thử (QA)

**Đầu vào**: Mã nguồn từ Giai đoạn 3 và kịch bản Gherkin từ Giai đoạn 1.

**AI thực hiện**:

- Sinh và chạy kiểm thử 5 tầng: Unit, Contract, Integration, E2E ( Playwright), Perf (k6), Security.
- Đảm bảo độ bao phủ mã nguồn (coverage) ≥ 80%.

**Cổng G4 soát xét**:

- Kiểm tra ma trận truy xuất nguồn gốc: Đảm bảo mọi quy tắc BIZ/VAL đều có ít nhất 1 ca kiểm thử thành công.
- Ký duyệt: `gates/G4-test-signoff.md`.

---

## GIAI ĐOẠN 5 — Triển khai (DevOps)

**Đầu vào**: Các dịch vụ và Helm chart từ Giai đoạn 3.

**AI thực hiện**:

- Thiết lập pipeline Tekton (Build → Test → Scan → Push).
- Cấu hình ArgoCD để đồng bộ môi trường.
- Thiết lập hệ thống quan sát (Grafana, Loki, OTel).
- Sinh tài liệu vận hành (Runbook).

**Cổng G5 soát xét**:

- Phê duyệt đồng bộ lên môi trường thực tế (Prod).
- Kiểm tra khả năng hoàn tác (rollback) và các kịch bản xử lý sự cố.
- Ký duyệt: `gates/G5-devops-signoff.md`.

---

## Các quy tắc chung

1. **Không nhảy giai đoạn**: Không lập trình (Gđ 3) khi thiết kế (Gđ 2) chưa được ký duyệt.
2. **Đóng băng sản phẩm**: Sản phẩm sau khi ký duyệt sẽ được đóng băng để giai đoạn sau sử dụng.
3. **Cập nhật lan tỏa (Ripple Update)**: Khi giai đoạn trước thay đổi, phải soát xét và cập nhật lại toàn bộ các sản phẩm bị ảnh hưởng ở các giai đoạn sau.
4. **Mọi thay đổi đều qua Git**: Không trao đổi miệng, mọi quyết định phải nằm trong mã nguồn hoặc tài liệu Markdown.
5. **Con người là người quyết định cuối**: AI thực hiện các công việc nặng nhọc, con người tập trung vào việc soát xét và ký duyệt tại các cổng chất lượng.
