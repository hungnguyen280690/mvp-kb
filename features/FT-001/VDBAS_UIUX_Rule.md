# QUY ĐỊNH THIẾT KẾ GIAO DIỆN NGƯỜI DÙNG – VDBAS

**Phạm vi áp dụng:** Các phân hệ nghiệp vụ thuộc Hệ thống thông tin ngân sách và kế toán nhà nước số (VDBAS)

**Cơ sở xây dựng:** Thiết kế áp dụng cho ngữ cảnh mô tả tại file "VDBAS_Context.md".

**Phiên bản:** v1.0 – 11/05/2026

**Người tạo:** PhongTD16

---

## Mục lục

1. Phong cách thiết kế (Design principles)
2. Typography
3. Color
4. Layout & Spacing
5. Components (Top bar, Breadcrumb, Card, Form field, Button, Icon button, Table, Status badge, Pagination, Modal, Hint / Empty state)
6. Iconography
7. States & Feedback
8. Responsive breakpoints
9. Accessibility (A11y)
10. Localization (i18n)
11. Naming conventions & CSS variables
12. Checklist nghiệm thu giao diện

---

## 1. Phong cách thiết kế (Design principles)

Hệ thống theo phong cách **Enterprise / Government Web Application**, tối ưu cho nghiệp vụ xử lý dữ liệu có mật độ cao, ưu tiên tính rõ ràng, trang nghiêm và quen thuộc với người dùng hành chính công.

Các nguyên tắc chủ đạo:

- **Rõ ràng hơn trang trí (Clarity over decoration):** Hạn chế hiệu ứng đổ bóng mạnh, gradient loè loẹt, hoạt ảnh phức tạp. Chỉ dùng gradient ở thanh tiêu đề cấp 1 (topbar, modal head) để tạo điểm neo thị giác.
- **Mật độ thông tin cao, nhưng có nhịp điệu:** Font cỡ nhỏ (13px cơ bản), khoảng cách hợp lý giữa khối (14–16 px) để hiển thị được nhiều dữ liệu trên một màn hình mà không rối.
- **Nhất quán về hành vi:** Cùng một loại thao tác (tìm kiếm, tạo mới, đặt lại, lưu, huỷ) phải dùng cùng loại nút, cùng icon, cùng vị trí trên mọi màn hình.
- **Ưu tiên bàn phím:** Người dùng nghiệp vụ thao tác nhanh bằng bàn phím (Tab, Enter, Esc). Mọi thành phần tương tác phải có trạng thái focus rõ ràng.
- **Hệ thống thông tin có thể truy vết:** Mỗi màn hình / khu vực chức năng phải có mã chức năng hiển thị góc phải card header để phục vụ kiểm thử, tài liệu và hỗ trợ người dùng.
- **Phân quyền hiển thị:** Dữ liệu và thao tác hiển thị theo phân quyền của user hiện tại; trường khoá (readonly) phải có màu nền phân biệt.

---

## 2. Typography

### 2.1. Họ font chữ

| Vai trò                 | Font stack                                                                       |
| ----------------------- | -------------------------------------------------------------------------------- |
| UI chính (chữ Latin)    | `"Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`                        |
| Văn bản tiếng Việt      | Cùng font stack trên (đảm bảo hiển thị đầy đủ dấu thanh theo Unicode tổ hợp/NFC) |
| Mã kỹ thuật / code / ID | `"Consolas", "Menlo", monospace` (chỉ dùng khi cần phân biệt mã)                 |

### 2.2. Thang cỡ chữ (Type scale)

| Token       | Cỡ           | Dòng (line-height) | Dùng cho                               |
| ----------- | ------------ | ------------------ | -------------------------------------- |
| `text-xs`   | 11 – 11.5 px | 1.4                | Chú thích, caption, code ID góc card   |
| `text-sm`   | 12 px        | 1.4                | Nhãn form, header cột bảng, breadcrumb |
| `text-md`   | 12.5 px      | 1.4                | Nội dung ô bảng, nút                   |
| `text-base` | 13 px        | 1.4                | Body mặc định, input, select           |
| `text-lg`   | 14 – 15 px   | 1.3                | Tiêu đề modal, tiêu đề topbar          |
| `text-xl`   | 16 – 18 px   | 1.3                | Tiêu đề trang (Page Title)             |

### 2.3. Trọng lượng (weight)

- `400` – Body, input, nội dung bảng.
- `500` – Nhãn form, text trong breadcrumb.
- `600` – Tiêu đề topbar, nút, current breadcrumb, badge.
- `700` – Tiêu đề card, header cột bảng, tiêu đề modal.
- `800` – Logo 2 ký tự trên topbar (duy nhất).

### 2.4. Quy tắc viết

- Nhãn form, tiêu đề cột bảng, tiêu đề card: **viết hoa chữ cái đầu** từ đầu tiên; tiêu đề card có thể dùng **UPPERCASE** với `letter-spacing: .3px`.
- Placeholder dùng giọng gợi ý (VD: `Nhập mã quyền…`), luôn kết thúc bằng dấu `…`.
- Tiếng Việt: viết đúng chính tả, có dấu; không viết tắt trong nhãn form.
- Tên ngày giờ theo định dạng `DD/MM/YYYY`, giờ theo `HH:mm:ss`.

---

## 3. Color

### 3.1. Bảng màu hệ thống (Design tokens)

| Token             | Giá trị   | Mục đích                                                    |
| ----------------- | --------- | ----------------------------------------------------------- |
| `--primary`       | `#0b5394` | Màu chủ đạo: nút Primary, focus ring, link, header cột bảng |
| `--primary-dark`  | `#073763` | Gradient đậm trên topbar / modal head, hover primary        |
| `--primary-light` | `#e7f0f9` | Nền hover icon button, nền ghost button, highlight nhẹ      |
| `--accent`        | `#cc0000` | Dấu sao (\*) bắt buộc, màu chữ nút Danger                   |
| `--success`       | `#137333` | Nút "Tạo mới", "Thêm mới", badge Hiệu lực                   |
| `--warning`       | `#b45309` | Cảnh báo dạng text; nhãn khu vực cần chú ý                  |
| `--muted`         | `#5f6368` | Text phụ, breadcrumb, hint, icon mặc định                   |
| `--border`        | `#d7dbe0` | Viền input, card, bảng                                      |
| `--bg`            | `#f4f6fa` | Nền trang                                                   |
| `--card`          | `#ffffff` | Nền card                                                    |
| `--head`          | `#eef3f9` | Nền card-header, nền thead của bảng                         |
| `--row-alt`       | `#fafcfe` | Nền dòng chẵn (zebra stripe)                                |

### 3.2. Màu trạng thái (Status)

| Trạng thái                | Token chữ                | Token nền | Ghi chú          |
| ------------------------- | ------------------------ | --------- | ---------------- |
| Nháp (`DRAFT`)            | `#8a8f98` (`--draft`)    | `#eef0f2` | Badge trung tính |
| Hiệu lực (`ACTIVE`)       | `#137333` (`--active`)   | `#e6f4ea` | Xanh lá nhạt     |
| Hết hiệu lực (`INACTIVE`) | `#c0392b` (`--inactive`) | `#fde7e7` | Đỏ nhạt          |

### 3.3. Nguyên tắc sử dụng màu

- **Không dùng màu làm phương tiện duy nhất** để truyền đạt thông tin (phải đi kèm text / icon) → tuân thủ WCAG 1.4.1.
- Màu đỏ (`--accent`) chỉ dùng cho: dấu bắt buộc, thông báo lỗi, icon/nút Huỷ/Xoá.
- Màu xanh lá (`--success`) chỉ dùng cho: hành động tạo mới/thêm mới, badge hiệu lực, xác nhận thành công.
- Không dùng gradient vào trong các khối nội dung; gradient chỉ cho phép ở topbar và modal head.
- Độ tương phản text/nền tối thiểu: **4.5:1** cho text thông thường, **3:1** cho text ≥ 18 px / bold ≥ 14 px.

---

## 4. Layout & Spacing

### 4.1. Khung chung

- Bố cục 3 lớp từ trên xuống: **Top bar → Breadcrumb → Page content**.
- Chiều rộng nội dung: full-width, padding trang `16px 20px 40px` (top / horizontal / bottom).
- Nền trang dùng `--bg`; mọi khu vực nội dung nghiệp vụ nằm trong `Card` (nền trắng).

### 4.2. Thang khoảng cách (Spacing scale)

Dùng thang bội 2 – 4 px cho tính nhất quán:

| Token     | Giá trị    | Áp dụng                                       |
| --------- | ---------- | --------------------------------------------- |
| `space-0` | 0          | Reset margin/padding mặc định                 |
| `space-1` | 4 px       | Khoảng giữa label và input                    |
| `space-2` | 6 – 8 px   | Gap giữa nút, gap nhỏ nội bộ                  |
| `space-3` | 10 px      | Padding top/bottom cell bảng, padding toolbar |
| `space-4` | 12 – 14 px | Padding card-body, gap giữa các khối form     |
| `space-5` | 16 – 20 px | Padding trang (horizontal)                    |
| `space-6` | 24 – 30 px | Padding viền ngoài modal                      |
| `space-7` | 40 px      | Padding cuối trang                            |

### 4.3. Lưới form (Form grid)

- Màn hình ≥ 960 px: **3 cột** (`grid-template-columns: repeat(3, 1fr)`).
- Màn hình 600 – 960 px: **2 cột**.
- Màn hình < 600 px: **1 cột**.
- Khoảng cách giữa các trường: `gap: 12px 18px` (dọc × ngang).
- Trường có độ dài lớn (description, address) có thể chiếm `grid-column: span 2` hoặc `span 3`.

### 4.4. Card – đơn vị bố cục tiêu chuẩn

- Tỷ lệ tối thiểu: header (≈ 40 px) / body (≥ 60 px) / toolbar (≈ 50 px).
- Border radius: `6 px` (card), `8 px` (modal).
- Shadow: `0 1px 2px rgba(15,20,25,.04)` (card), `0 10px 40px rgba(0,0,0,.25)` (modal).
- Giữa các card liên tiếp: `margin-bottom: 14px`.

---

## 5. Components

### 5.1. Top bar

- Nền gradient `--primary-dark → --primary`, chiều cao ≈ 54 px.
- Cấu trúc từ trái sang phải: **Logo 34×34 (nền trắng, chữ nghiệp vụ 2 ký tự) · Tiêu đề 2 dòng · Spacer · Khối user**.
- Khối user: avatar tròn 22 px + tên + vai trò, nền `rgba(255,255,255,.12)`, border-radius `20 px`.
- Đổ bóng: `0 1px 4px rgba(0,0,0,.12)`.

### 5.2. Breadcrumb

- Nền trắng, padding `8px 20px`, chữ 12 px, màu `--muted`.
- Separator ký tự `›` màu `#bbb`, khoảng cách `margin: 0 6px`.
- Mục cuối cùng (current) đậm, màu `#1f2328`; các mục trước là `<a>` màu `--primary`, không gạch chân.

### 5.3. Card

Cấu trúc 3 khối: `card-header` · `card-body` · `toolbar` (tuỳ chọn).

- `card-header`: nền `--head`, padding `10px 14px`, chứa:
  - Tiêu đề `<h2>` viết hoa, chữ 13 px, đậm 700, màu `--primary-dark`, `letter-spacing: .3px`.
  - Mã màn hình / khu vực bên phải, 11 px, màu `--muted`, font-weight 500 (VD: `TT_PHANQUYEN.1`).
- `card-body`: padding `14 px`.
- `toolbar`: nền `#fafcfe`, border-top 1 px, căn phải các nút, padding `10px 14px`.
- `toolbar-top` (khi cần nút ở phía trên bảng, VD nút "Thêm mới"): cùng style toolbar nhưng dùng `border-bottom` thay cho `border-top`.

### 5.4. Form field

**Kích thước & style chung:**

- Chiều cao input/select: **32 px**.
- Padding: `4px 8px`; font 13 px; border 1 px `--border`; border-radius 4 px.
- Focus: `border-color: --primary`; ring `box-shadow: 0 0 0 2px rgba(11,83,148,.15)`; `outline: none`.
- Readonly: nền `#f3f5f8`, chữ `#555`, không có ring focus.

**Nhãn (label):**

- Cỡ 12 px, đậm 500, màu `#333`.
- Nhãn và input cách nhau 4 px.
- Trường bắt buộc: thêm `<span class="req">*</span>` màu `--accent`, cách nhãn 2 px.

**Date range:** Dùng 2 `input[type=date]` trong `grid-template-columns: 1fr 1fr; gap: 6px;`.

**Placeholder:** Viết tiếng Việt có dấu, đuôi `…`; không dùng placeholder thay cho label.

**Select:** Giá trị mặc định đầu danh sách dạng `-- Tất cả --` khi thuộc khu vực tra cứu, hoặc `-- Chọn --` khi bắt buộc chọn trong form nhập liệu.

### 5.5. Button

**Kích thước chuẩn:** Cao 32 px, padding ngang 14 px, border-radius 4 px, font 12.5 px / weight 600, icon 14 px đặt trước text, khoảng cách icon – text 6 px.

**Biến thể:**

| Class            | Màu nền     | Màu chữ     | Viền        | Dùng cho                                             |
| ---------------- | ----------- | ----------- | ----------- | ---------------------------------------------------- |
| `.btn` (default) | `#fff`      | `#333`      | `--border`  | Huỷ, thao tác phụ                                    |
| `.btn-primary`   | `--primary` | `#fff`      | `--primary` | Tìm kiếm, Lưu, Xác nhận                              |
| `.btn-success`   | `--success` | `#fff`      | `--success` | Tạo mới, Thêm mới                                    |
| `.btn-danger`    | `#fff`      | `--accent`  | `#e7c2c2`   | Xoá, Huỷ mang tính phá hủy                           |
| `.btn-ghost`     | `#fff`      | `--primary` | `#c6d6e6`   | Đặt lại, Xuất file, thao tác trung tính có gợi ý màu |

**Hover:**

- Primary → `--primary-dark`.
- Success → `filter: brightness(.92)`.
- Default → `#f3f5f8`.
- Ghost → `--primary-light`.
- Danger → `#fdecec`.

**Thứ tự bố trí toolbar (trái → phải):** Hành động Primary / Positive trước, Secondary ở giữa, Destructive / Cancel ở cuối — ngoại trừ `toolbar` căn phải thì đảo lại: Cancel bên trái, Primary bên phải.

### 5.6. Icon button

- Ô vuông 26 × 26 px, border-radius 4 px, viền `--border`, icon 14 px.
- Biến thể nguy hiểm: class `.icon-btn.danger` – hover nền `#fdecec`, chữ/viền `--accent`.
- Mỗi icon button bắt buộc có `title="…"` để hiển thị tooltip mô tả hành động.

### 5.7. Table (bảng dữ liệu)

**Bố cục:**

- Bọc trong `.table-wrap` để cho phép cuộn ngang khi tràn.
- `border-collapse: collapse`, font 12.5 px.
- Header (`thead th`): nền `--head`, chữ `--primary-dark` 12 px uppercase, weight 700, `letter-spacing: .3px`, `border-bottom: 2px solid #c9d6e3`, sticky top khi cuộn.
- Body: `td` padding `8px 10 px`, `border-bottom: 1px solid --border`, căn trái mặc định, `vertical-align: middle`, `white-space: nowrap` (bật wrap cho các cột mô tả dài).
- Zebra: dòng chẵn nền `--row-alt`.
- Hover dòng: nền `#eef5fd`.

**Cột đặc biệt:**

- `.num` – căn giữa, width 50 px, dùng cho STT, checkbox, số đếm.
- `.act` – căn giữa, width 90 px, chứa icon button thao tác.

**Editable cell (bảng nhập liệu trong modal):**

- Input trong ô: class `.cell-input`, cao 28 px, padding `2px 6px`, focus như form chính.
- Checkbox: class `.cell-check`, 16 × 16 px, `accent-color: --primary`.

**Empty state:** Khi bảng chưa có dữ liệu, hiển thị 1 dòng `<td colspan="…">` class `.empty-state` (italic, màu muted, padding 30 px).

### 5.8. Status badge

- Pill border-radius 12 px, padding `2px 10px`, font 11.5 px, weight 600, `letter-spacing: .2px`.
- 3 biến thể: `.badge-draft`, `.badge-active`, `.badge-inactive` (xem mục 3.2).
- Nội dung text bắt buộc (không dùng chỉ chấm màu) để đáp ứng a11y.

### 5.9. Pagination

- Đặt ở đáy card dữ liệu, nền `#fafcfe`, `border-top: 1px solid --border`.
- Trái: dropdown chọn cỡ trang (`10 / 20 / 50`) + hiển thị tổng bản ghi.
- Phải: các nút số trang, `«` đầu, `»` cuối. Nút active: nền `--primary`, chữ trắng.

### 5.10. Modal

- Overlay: `position: fixed; inset: 0;` nền `rgba(15,20,25,.5)`, `z-index: 1000`, `padding: 30px 20px`, scroll dọc khi nội dung dài.
- Hộp modal: nền `--bg`, `border-radius: 8px`, `max-width: 1100 px`, shadow `0 10px 40px rgba(0,0,0,.25)`, hiệu ứng `slideDown .2s ease`.
- `modal-head`: gradient cùng topbar, padding `12px 18px`, tiêu đề 14 px bold + mã màn hình 11 px opacity .85, nút đóng `×` 28 px ở góc phải.
- `modal-body`: padding `14px 16px`, có thể chứa nhiều `card` lồng bên trong.
- **Thao tác đóng:** click nút `×`, click overlay (ngoài hộp), phím `Esc` – cả ba đều phải hoạt động.

### 5.11. Hint & Inline help

- Class `.hint`: font 11.5 px, padding `6px 14px`, nền `#fff8e1`, `border-left: 3px solid #f0ad4e`.
- Dùng để hướng dẫn người dùng hoặc giải thích điều kiện hiển thị (VD: "Hiển thị kết quả sau khi ấn Tìm kiếm").

### 5.12. Empty state

- Text italic, màu `--muted`, căn giữa, padding 30 px.
- Khuyến khích kèm câu hướng dẫn hành động tiếp theo (VD: _"Chưa có chức năng nào. Nhấn Thêm mới để bắt đầu."_).

---

## 6. Iconography

- Sử dụng bộ **Feather-style icons** (SVG stroke 2 px, `stroke-linecap: round`, `stroke-linejoin: round`, màu `currentColor`).
- Kích thước mặc định 14 × 14 px trong nút, 16 × 16 px độc lập.
- Các icon chuẩn đã dùng:
  - Tìm kiếm: kính lúp (circle + đường chéo).
  - Tạo mới / Thêm mới: dấu cộng.
  - Đặt lại: mũi tên xoay.
  - Lưu: biểu tượng đĩa mềm.
  - Huỷ / Đóng: dấu ×.
  - Xem: mắt.
  - Xoá: thùng rác.
- Mỗi icon trong button phải đi kèm text label; trong icon-button độc lập phải có `title` (tooltip) và `aria-label` (xem mục 9).
- Màu icon kế thừa `currentColor` để tự đồng bộ theo trạng thái nút.

---

## 7. States & Feedback

### 7.1. Trạng thái tương tác

| Trạng thái       | Quy cách                                                                                |
| ---------------- | --------------------------------------------------------------------------------------- |
| Default          | Theo token mặc định của component.                                                      |
| Hover            | Đổi nền theo biến thể (xem 5.5); chuyển tiếp `transition: all .15s`.                    |
| Focus            | Viền `--primary` + ring `0 0 0 2px rgba(11,83,148,.15)`; giữ nguyên khi dùng bàn phím.  |
| Active / Pressed | Giảm `brightness(.92)` hoặc nền đậm hơn một bậc.                                        |
| Disabled         | `opacity: .55`, `cursor: not-allowed`, không hover.                                     |
| Readonly         | Nền `#f3f5f8`, chữ `#555`.                                                              |
| Loading          | Dùng spinner hoặc skeleton; nút giữ chiều rộng, đổi text thành spinner + "Đang xử lý…". |
| Error (field)    | Viền `--accent`, message đỏ 12 px ngay dưới field.                                      |

### 7.2. Thông báo hệ thống

- **Toast/Alert success:** nền xanh nhạt, icon check, tự ẩn sau 3 giây.
- **Alert warning / cảnh báo trước khi rời màn hình có thay đổi chưa lưu:** modal xác nhận với nút Primary bên phải.
- **Error dialog:** nền trắng, border trái đỏ, icon cảnh báo, mô tả ngắn + nút "Đóng".
- Thông báo nghiệp vụ sử dụng tiếng Việt có dấu, xưng hô trang trọng ("Vui lòng…", "Bạn có chắc chắn…?").

### 7.3. Xác nhận huỷ / xoá

- Bắt buộc hiển thị hộp xác nhận: "Bạn có chắc chắn muốn [hành động] bản ghi [mã]? Thao tác này không thể hoàn tác."
- Nút Xác nhận: biến thể `btn-danger` nếu là xoá vĩnh viễn; `btn-primary` nếu là huỷ/chuyển trạng thái.

---

## 8. Responsive breakpoints

| Breakpoint | Độ rộng      | Form grid | Topbar                         | Bảng                                                                        |
| ---------- | ------------ | --------- | ------------------------------ | --------------------------------------------------------------------------- |
| Desktop    | ≥ 960 px     | 3 cột     | Hiển thị đầy đủ tiêu đề + user | Hiển thị toàn bộ cột                                                        |
| Tablet     | 600 – 959 px | 2 cột     | Có thể giữ đầy đủ; ẩn phần sub | Giữ nguyên, cuộn ngang                                                      |
| Mobile     | < 600 px     | 1 cột     | Thu gọn thành logo + user icon | Cho phép ẩn các cột không quan trọng, luôn giữ STT + các cột khoá nghiệp vụ |

Modal `max-width: 1100 px` — ở mobile giãn full màn hình, bỏ padding ngang overlay.

---

## 9. Accessibility (A11y)

Tuân thủ tối thiểu **WCAG 2.1 AA**.

### 9.1. Bàn phím

- Mọi thành phần tương tác (input, select, button, icon-button, link, tab của pagination) phải truy cập được bằng `Tab` theo thứ tự đọc tự nhiên.
- Thứ tự focus không được nhảy ngược hoặc bị bẫy (focus trap) trừ khi trong modal (khi modal mở, focus chỉ chạy trong modal).
- Phím tắt tối thiểu:
  - `Enter` trong form tra cứu → thực thi nút Tìm kiếm.
  - `Esc` trong modal → đóng modal.
  - `Ctrl + S` trong form nhập liệu → nếu áp dụng được, kích hoạt nút Lưu (tuỳ phân hệ).

### 9.2. Ngữ nghĩa HTML & ARIA

- Dùng thẻ ngữ nghĩa: `<header>`, `<nav>`, `<main>`, `<table>`, `<thead>`, `<tbody>`, `<label for="…">`.
- Icon-button độc lập phải có `aria-label` mô tả hành động (VD: `aria-label="Xem chi tiết quyền PQ001"`).
- Modal: gắn `role="dialog"`, `aria-modal="true"`, `aria-labelledby` tới id tiêu đề.
- Bảng: dùng `<caption>` mô tả nội dung, hoặc `aria-label` cho `<table>` nếu không có caption.
- Trạng thái badge: thêm `aria-label` (VD: `aria-label="Trạng thái: Hiệu lực"`) để screen reader đọc ngữ nghĩa thay vì chỉ màu.

### 9.3. Tương phản & kích thước

- Tương phản text ≥ 4.5:1 với nền; icon ≥ 3:1.
- Target tương tác tối thiểu 32 × 32 px (chiều cao nút tiêu chuẩn).
- Khoảng cách giữa các target ≥ 4 px để tránh click nhầm trên touch.

### 9.4. Hình ảnh & icon

- Icon decorative: `aria-hidden="true"`.
- Icon mang nghĩa: có `aria-label` tương ứng.
- Không truyền đạt thông tin chỉ bằng màu (badge có text, lỗi field có message).

### 9.5. Nội dung động

- Khi hiển thị thông báo (toast, inline error), thêm `aria-live="polite"` hoặc `aria-live="assertive"` tuỳ mức khẩn.
- Khi cập nhật bảng sau Tìm kiếm, thông báo số bản ghi tìm thấy qua region live.

---

## 10. Localization (i18n)

- Ngôn ngữ mặc định: **tiếng Việt (vi-VN)**. Dự phòng song ngữ (vi / en) cho các nhãn kỹ thuật nếu hệ thống cần mở rộng.
- Thẻ `<html lang="vi">` bắt buộc.
- Định dạng:
  - Ngày: `DD/MM/YYYY`; giờ: `HH:mm` (24h).
  - Số: dấu phẩy ngăn cách thập phân, dấu chấm ngăn cách nghìn (VD: `1.234.567,89`).
  - Tiền tệ: `1.234.567 VND` (hoặc `₫`).
- Tất cả chuỗi hiển thị nằm trong tập tin ngôn ngữ (key/value) để dễ dịch, không hard-code trực tiếp trong template.

---

## 11. Naming conventions & CSS variables

### 11.1. Đặt mã màn hình

- Format: `<APP>_<FUNCTION>` (ứng dụng thanh toán: `TT_<FUNCTION>`). Ví dụ: `TT_PHANQUYEN`.
- Khu vực con: thêm hậu tố số `.1`, `.2`, `.3.1`, `.3.2`…
- Hiển thị ở góc phải card-header và modal-head để phục vụ truy vết.

### 11.2. CSS class naming

- Dùng **kebab-case** nhất quán: `.card`, `.card-header`, `.card-body`, `.form-grid`, `.form-group`, `.btn`, `.btn-primary`, `.icon-btn`, `.table-wrap`, `.badge-active`.
- Prefix trạng thái: `.is-active`, `.is-disabled`, `.has-error` (nếu dự án mở rộng).

### 11.3. CSS variables

Khai báo tại `:root` của tài liệu hoặc file `variables.css` dùng chung. Khi thay theme (VD: dark mode tương lai), chỉ đổi giá trị biến, không sửa component.

---

## 12. Checklist nghiệm thu giao diện

Trước khi bàn giao mỗi màn hình, designer/FE phải kiểm tra đủ các mục sau:

- [ ] Top bar, breadcrumb, tiêu đề card hiển thị đúng; mã màn hình đặt góc phải card-header/modal-head.
- [ ] Các trường form dùng đúng component (size, font, focus, readonly).
- [ ] Trường bắt buộc có dấu `*` đỏ và kiểm tra validate rõ ràng.
- [ ] Nút tuân thủ biến thể (primary/success/ghost/danger/default) và thứ tự trong toolbar.
- [ ] Bảng có thead sticky, zebra, hover dòng, empty state, phân trang.
- [ ] Status badge có text + màu đúng 3 trạng thái Nháp / Hiệu lực / Hết hiệu lực.
- [ ] Modal đóng được bằng `×`, click overlay và `Esc`.
- [ ] Thao tác huỷ/xoá có hộp xác nhận.
- [ ] Kiểm thử responsive ở 3 breakpoint (≥ 960 px, 600–959 px, < 600 px).
- [ ] Kiểm thử bằng bàn phím (Tab, Enter, Esc) mà không chuột; trạng thái focus rõ ràng.
- [ ] Kiểm thử với screen reader (VoiceOver / NVDA): đọc được nhãn, badge, icon-button, modal.
- [ ] Kiểm tra tương phản màu bằng công cụ (axe / Lighthouse) đạt WCAG AA.
- [ ] Văn bản tiếng Việt đầy đủ dấu, đúng chính tả, không lẫn tiếng Anh không cần thiết.
- [ ] Không chứa PII thật trong mockup/test.

---

## Phụ lục A – Tham chiếu nguồn

- Mockup gốc: `VDBAS_HOME.html` – màn hình chính giao diện người dùng, hệ thống VDBAS.
- Ngữ cảnh hệ thống: 'VDBAS_Context.md'

## Phụ lục B – Danh sách token CSS khuyến nghị (copy-paste)

```css
:root {
  /* Brand */
  --primary: #0b5394;
  --primary-dark: #073763;
  --primary-light: #e7f0f9;

  /* Semantic */
  --accent: #cc0000; /* required, danger */
  --success: #137333;
  --warning: #b45309;
  --muted: #5f6368;

  /* Surfaces */
  --bg: #f4f6fa;
  --card: #ffffff;
  --head: #eef3f9;
  --row-alt: #fafcfe;
  --border: #d7dbe0;

  /* Status */
  --draft: #8a8f98;
  --active: #137333;
  --inactive: #c0392b;

  /* Typography */
  --font-sans: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --text-base: 13px;
  --line-base: 1.4;

  /* Radius & Shadow */
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --shadow-card: 0 1px 2px rgba(15, 20, 25, 0.04);
  --shadow-modal: 0 10px 40px rgba(0, 0, 0, 0.25);
}
```

---

_Tài liệu này là chuẩn tham chiếu. Mọi sai lệch so với quy định phải được Trưởng nhóm thiết kế UI/UX phê duyệt và cập nhật ngược lại vào tài liệu để duy trì tính nhất quán toàn hệ thống._
