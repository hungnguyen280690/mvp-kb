# Cẩm nang Chi tiết: Vai Security (Security Engineer) — Stage 2

## Sứ mệnh

Phân tích mối đe dọa, thiết kế chính sách bảo mật, và đảm bảo tuân thủ compliance cho hệ thống LTT. Bảo vệ chống tampering, replay attack, và information disclosure.

---

## Công cụ AI của bạn

### 1. Agent: `security-threat-modeler`

- **Kích hoạt:** Gõ `> security-threat-modeler` trong Claude Code.
- **Nhiệm vụ:** Đọc domain YAML + contracts → sinh STRIDE threat model đầy đủ.

### 2. Plugin: `superpowers`

- **Mục đích:** Cross-check threat coverage vs OWASP Top 10.
- **Lệnh mẫu:**
  - `@superpowers kiểm tra xem threat model đã cover OWASP A01 (Broken Access Control) cho Maker-Checker flow chưa.`

---

## Quy trình làm việc (Step-by-Step)

### Bước 1: Khởi động Workspace

```bash
cd workspaces/security
claude code .
```

### Bước 2: Verify Gate G1

```bash
test -f ../../gates/G1-ba-signoff.md || echo "G1 chưa sign-off"
```

### Bước 3: Chạy Threat Modeler

Yêu cầu Claude:

> "Chạy agent `security-threat-modeler` để sinh STRIDE analysis cho TT.OUT.MANUAL. Tập trung vào: Tampering (sửa LTT), Repudiation (ai làm gì khi nào), Information Disclosure (PII trong audit log)."

### Bước 4: Review Threat Model

Kiểm tra:

- Mỗi STRIDE category có ít nhất 3 threats
- Mỗi threat có mitigation cụ thể (không chung chung)
- SoD constraint cover đủ 4 vai trò nghiệp vụ
- Replay attack defense cho MQ messages
- Idempotency key validation

### Bước 5: Sinh Security Policies

> "Sinh `security/policies/access-control.md` dựa trên `domain/permissions.yaml` của BA. Đảm bảo RBAC + SoD matrix khớp."

### Bước 6: OWASP Mapping

> "Sinh `security/compliance/owasp-top10-checklist.md` mapping từng item OWASP Top 10 vào LTT system."

### Bước 7: Ký duyệt (Sign-off)

> "Tóm tắt kết quả vào `gates/G-SEC-summary.md` và tạo file ký duyệt `gates/G-SEC-signoff.md`."

---

## Lưu ý tử huyệt

1. **KHÔNG** cho AI agent access `docs-confidential/` — two-tier confidentiality.
2. **SoD constraint** phải verify ở CẢ application LẪN DB level.
3. **PII** trong audit log: hash hoặc truncate theo SAFETY.md.
4. **Replay attack**: idempotency key + timestamp window cho MQ messages.
5. **Mọi** Restricted artifact cần Security R-approval (human only).
