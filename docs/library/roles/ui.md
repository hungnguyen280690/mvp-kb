# Cẩm nang Chi tiết: Vai UI/UX (User Interface Designer) — Stage 2-3

## Sứ mệnh

Thiết kế trải nghiệm người dùng cho 7 màn hình LTT. Đảm bảo accessibility (WCAG 2.1 AA), consistency, và đúng nghiệp vụ KBNN.

---

## Công cụ AI của bạn

### 1. Agent: `ui-spec-builder`

- **Kích hoạt:** Gõ `> ui-spec-builder` trong Claude Code.
- **Nhiệm vụ:** Đọc `screens.yaml` + OpenAPI → sinh UI spec cho 7 màn S01-S07.

### 2. Plugin: `superpowers`

- **Mục đích:** Cross-check UI spec vs validation rules.
- **Lệnh mẫu:**
  - `@superpowers kiểm tra xem validation trong S02-payment-order-form.md có khớp với domain/validation-rules.yaml không.`

---

## Quy trình làm việc (Step-by-Step)

### Bước 1: Khởi động Workspace

```bash
cd workspaces/ui
claude code .
```

### Bước 2: Verify Gate G1

```bash
test -f ../../gates/G1-ba-signoff.md || echo "G1 chưa sign-off"
```

### Bước 3: Chạy UI Spec Builder

Yêu cầu Claude:

> "Chạy agent `ui-spec-builder` để sinh UI spec cho 7 màn S01-S07. Dựa trên `screens.yaml` của BA và OpenAPI contracts của SA."

### Bước 4: Review từng Screen

Kiểm tra 7 screens:

- **S01** Payment Order List — filter, sort, pagination, permission-based actions
- **S02** Payment Order Form — validation rules match BA, auto-complete COA
- **S03** Payment Order Detail — status trail, audit history, action buttons
- **S04** Approval Queue — bulk approve/reject, SoD enforcement
- **S05** Reject Dialog — reason required, predefined reasons
- **S06** Cancel/Reverse — confirmation flow, fund release
- **S07** Delete Confirm — soft delete only, confirmation pattern

### Bước 5: Verify Accessibility

> "Kiểm tra tất cả 7 screens đạt WCAG 2.1 AA. Sinh `ui/accessibility/a11y-baseline.md`."

### Bước 6: Design System Consistency

> "Verify tất cả components dùng shadcn/ui. Sinh `ui/design-system/components.md` inventory."

### Bước 7: Ký duyệt (Sign-off)

> "Tóm tắt kết quả vào `gates/G-UI-summary.md` và tạo file ký duyệt `gates/G-UI-signoff.md`."

---

## Lưu ý tử huyệt

1. **KHÔNG** thay đổi tech stack — React 18 + TypeScript + Tailwind + shadcn/ui (locked by ADR-0014).
2. **MỌI** labels, messages, validation errors bằng tiếng Việt.
3. **Form validation** PHẢI match `domain/validation-rules.yaml` của BA.
4. **Permission-aware UI**: show/hide actions dựa trên role + trạng thái LTT.
5. **Accessibility không optional** — WCAG 2.1 AA là baseline, không phải target.
