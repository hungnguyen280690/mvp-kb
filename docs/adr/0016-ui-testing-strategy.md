# ADR-0016: Chiến lược kiểm thử UI — bộ công cụ phân lớp tích hợp vòng lặp

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 08-05-2026
- **Người quyết định:** QA (dẫn dắt), UI/UX (đồng sở hữu), Bảo mật (a11y), DevOps (tích hợp CI)
- **Thẻ:** kiểm-thử, ui, khả-năng-truy-cập, nền-tảng
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

ADR-0014 đã bổ sung vai trò UI/UX + sản phẩm bàn giao `07-ui-spec.md`. Bản mẫu `04-test-plan.md` hiện có 4 danh mục (Chức năng, Tích hợp, Hiệu năng, Bảo mật) — không danh mục nào bao phủ UI. Nếu không có chiến lược kiểm thử UI, sai lệch thoải mái đưa vào sản xuất và a11y không được kiểm chứng.

Sáu mối quan tâm mà kiểm thử UI phải bao phủ:

1. Luồng trình duyệt đầu-cuối (E2E)
2. Render / tương tác mức component
3. Sai lệch trực quan (so sánh ảnh chụp)
4. Khả năng truy cập (mục tiêu WCAG 2.1 AA từ ADR-0014)
5. Hợp đồng API (đồng bộ kiểu frontend <-> backend)
6. Hiệu năng UI (Core Web Vitals)

## Quyết định

Áp dụng **bộ công cụ phân lớp** với **5 danh mục kiểm thử mới** trong `04-test-plan.md`, **3 reviewer agent mới** trong danh sách, và **kết quả kiểm thử UI tích hợp vòng lặp**.

### Bộ công cụ

| Tầng                               | Công cụ                                                       | Lý do                                                                                 |
| ---------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Luồng trình duyệt E2E              | **Playwright**                                                | Đa trình duyệt; trace viewer; codegen; so sánh ảnh chụp tích hợp sẵn                 |
| Render component                   | **Vitest + React Testing Library**                            | Tương thích Vite gốc (khớp build frontend); tương thích API Jest; nhanh               |
| Sai lệch trực quan                 | **So sánh snapshot Playwright**                               | Một công cụ bao phủ E2E + trực quan; baseline được commit vào kho                    |
| Khả năng truy cập                  | **`@axe-core/playwright`** (E2E) + **`jest-axe`** (component) | Tiêu chuẩn a11y thực tế; bộ quy tắc WCAG 2.1 AA                                      |
| Phát triển component / soát xét trực quan | **Storybook** với CSF stories                          | Bắt buộc khi `07-ui-spec.md` liệt kê >5 component; đồng thời là bề mặt soát xét thiết kế |
| Mock API mức component             | **MSW** (Mock Service Worker)                                 | Theo ADR-0015                                                                         |
| Hợp đồng API                       | **Kiểu TS phản chiếu thủ công** (MVP) -> OpenAPI/Pact (v2)    | Thủ công đủ ở quy mô MVP                                                              |
| Hiệu năng UI                       | **Lighthouse CI**                                             | Tiêu chuẩn ngành cho Core Web Vitals                                                  |

### Các danh mục kiểm thử mới trong bản mẫu `04-test-plan.md`

Từ 4 danh mục hiện có lên 9. Quyền sở hữu các mục:

| #     | Danh mục                | Chủ sở hữu                | Công cụ                  |
| ----- | ----------------------- | ------------------------- | ------------------------ |
| 1     | Chức năng               | QA-A                      | Java                     |
| 2     | Tích hợp                | QA-B                      | Java + Playwright        |
| 3     | Hiệu năng (backend)     | QA-B                      | Java + k6                |
| 4     | Bảo mật                 | QA + Bảo mật              | Java + quét ZAP          |
| **5** | **UI E2E**              | **QA + UI/UX**            | **Playwright**           |
| **6** | **UI Component**        | **UI/UX + QA**            | **Vitest + RTL**         |
| **7** | **Khả năng truy cập**   | **UI/UX + QA + Bảo mật**  | **axe-core**             |
| **8** | **Sai lệch trực quan**  | **UI/UX**                 | **Playwright snapshots** |
| **9** | **Hiệu năng UI**        | **UI/UX**                 | **Lighthouse CI**        |

### Các handle reviewer mới trong danh sách (mở rộng ADR-0011)

| Handle                       | Nền tảng                                            | Tầng vòng lặp                 | permitted_C          |
| ---------------------------- | --------------------------------------------------- | ----------------------------- | -------------------- |
| `@claude-ui-design-reviewer` | `comprehensive-review:architect-review` (prompt UI) | per-artifact (07-ui-spec)     | UI/UX, SA, Dev       |
| `@claude-a11y-auditor`       | (kết quả axe-core -> định dạng vòng lặp)            | per-artifact (UI components)  | UI/UX, Bảo mật, QA   |
| `@claude-visual-diff-triage` | (so sánh snapshot Playwright -> phân loại kết quả)  | per-artifact (thay đổi trực quan) | UI/UX            |

### Tích hợp vòng lặp — Kết quả UI dưới dạng fingerprint

Khi Playwright thất bại trong vòng lặp, **sai lệch trực quan và vi phạm a11y trở thành fingerprint** theo định dạng lần lặp vòng lặp từ ADR-0013:

```yaml
findings_fingerprints:
  - R-VISUAL-001:components/PlanList.tsx:0-0:visual-regression
  - R-A11Y-002:routes/customers.tsx:0-0:a11y-contrast
```

Fingerprint sai lệch trực quan có `suggested_fix.type` đặc biệt:

| Loại khắc phục         | Hành vi                                                |
| ---------------------- | ------------------------------------------------------ |
| `accept-baseline`      | Con người phê duyệt; bot cập nhật PNG baseline         |
| `revert-to-baseline`   | Thay đổi không cố ý; bộ khắc phục hoàn nguyên component |
| `escalate`             | Không rõ ràng; con người soát xét                      |

Vòng lặp **không thể** tự quyết định thay đổi trực quan (cần phán đoán); phát ra kết quả; con người phê duyệt cập nhật baseline. Tôn trọng ADR-0006 A-chỉ-con-người-được-quyết.

### Mục tiêu quy trình CI

```
make test           # Tích hợp Java (hiện có) + Vitest frontend
make test-e2e       # Playwright (cần dịch vụ đang chạy)
make test-a11y      # axe-core trên UI đã build
make test-visual    # So sánh ảnh chụp Playwright
make test-ui        # tất cả danh mục UI ở trên
make test-all       # tất cả mọi thứ
```

### Các tầng nghiêm trọng (theo vòng đời ADR-0005)

| Danh mục kiểm thử      | Nghiêm trọng Phase 0 | Nghiêm trọng Phase 1+                              |
| ---------------------- | -------------------- | -------------------------------------------------- |
| UI E2E                 | warn                 | error                                              |
| UI Component           | warn                 | error                                              |
| Khả năng truy cập      | warn                 | error (chỉ code mới; code cũ được miễn trừ)        |
| Sai lệch trực quan     | warn                 | warn (luôn — con người phê duyệt)                  |
| Hiệu năng UI           | info                 | warn                                               |

### Bổ sung quy tắc linter

- **`R0220`** — Sản phẩm UI phải khai báo `applies_a11y_baseline` (mặc định "WCAG-2.1-AA"); `07-ui-spec.md` phải điền
- **`R0221`** — Các mục UI trong `04-test-plan.md` phải tham chiếu chéo các danh mục kiểm thử trên (không thiếu danh mục cho tính năng có `07-ui-spec.md` Đã phê duyệt)
- **`R0222`** — Cần Storybook stories khi `07-ui-spec.md` liệt kê >5 component (tư vấn)

## Hệ quả

### Tích cực

- 9 danh mục kiểm thử mang lại độ bao phủ UI đáng tin cậy; phù hợp với tham vọng thiết kế nâng cấp.
- Tính 3-trong-1 của Playwright (E2E + trực quan + a11y qua plugin) giúp công cụ tinh gọn.
- Vi phạm a11y xuất hiện dưới dạng kết quả vòng lặp — agent khắc phục có thể xử lý các trường hợp đơn giản (alt text, nhãn ARIA); con người xử lý các trường hợp phức tạp.
- Baseline trực quan được commit trong kho (không phụ thuộc SaaS) hỗ trợ mục tiêu "chạy được tại chỗ".

### Hạn chế / Chi phí

- Nền tảng một lần: ~3-4 ngày (ADR + cập nhật agent vai trò + prompt + quy tắc linter).
- Chi phí thêm mỗi tính năng: ~$30-80 chi phí agent cho việc viết kiểm thử UI.
- Bảo trì sai lệch trực quan — baseline phải được cập nhật có chủ đích; con người phê duyệt diff.
- Binary trình duyệt: Playwright tải xuống ~150MB trong lần chạy đầu tiên.

### Trung tính

- Chỉ Chromium cho MVP (CI nhanh); thêm Firefox + WebKit trong v2.
- Storybook thêm công cụ thời gian phát triển (~30s thêm trên `pnpm install`); bù đắp cho các tính năng nặng UI.

## Các phương án đã cân nhắc

### A. Cypress + Vitest — Bị loại bỏ

Khả năng E2E tương đương; câu chuyện đa trình duyệt yếu hơn; Playwright là lựa chọn dài hạn tốt hơn.

### B. Selenium — Bị loại bỏ

Chậm, dễ hỏng; công nghệ cũ.

### C. Bỏ qua kiểm thử UI trong MVP — Bị loại bỏ

Bỏ qua yêu cầu rõ ràng của người dùng; tạo ra UI không có độ bao phủ kiểm thử.

### D. Chỉ Playwright + Vitest (bỏ Storybook + trực quan + Lighthouse) — Bị loại bỏ

Chỉ đạt ~50% giá trị; mất so sánh trực quan và tốc độ phát triển component.

## Liên kết liên quan

- ADR-0008 — Ma trận phê duyệt phân tầng (quy trình tư vấn đa nhà cung cấp mở rộng cho reviewer UI)
- ADR-0009 — Phòng thủ chiều sâu (R0220-R0222 gia nhập họ R)
- ADR-0011 — Nhận dạng agent lai (3 handle danh sách mới)
- ADR-0013 — Cấu trúc liên kết vòng lặp agent (kết quả UI tích hợp vào định dạng vòng lặp)
- ADR-0014 — Vai trò UI/UX + 07-ui-spec.md (ADR này kiểm thử sản phẩm bàn giao đó)
- ADR-0015 — Dữ liệu kiểm thử hạng nhất (dữ liệu demo UI + factory được sử dụng bởi Vitest/Playwright)

## Ghi chú cho lần xem xét sau

- **Độ bao phủ trình duyệt** — chỉ chromium là cắt giảm có chủ đích; thêm Firefox + WebKit khi ngân sách thời gian CI cho phép.
- **Lưu trữ baseline trực quan** — PNG commit phù hợp cho MVP; chuyển sang Chromatic hoặc LFS khi khối lượng baseline vượt ~50MB.
- **Mức nghiêm ngặt quy tắc a11y** — bắt đầu ở WCAG 2.1 AA; siết chặt lên AAA chỉ khi có nhu cầu tuân thủ cụ thể.
- **Ngưỡng Lighthouse CI** — bắt đầu với Core Web Vitals mặc định; điều chỉnh sau khi quan sát hiệu năng thực tế.
