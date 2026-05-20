# Audit Log — Lỗi phát sinh trong quá trình phát triển

**Scope**: FT-001 / PAY.OUT.MANUAL — Stage 3 (Fullstack Dev)  
**Branch**: TEMP_FEATURE_001_PRO  
**Ghi lần đầu**: 2026-05-20  
**Mục đích**: Ghi nhận tất cả lỗi (tự gen code sai, hiểu nhầm yêu cầu, do người dùng chỉ ra) để phân tích khắc phục ở bước sau, tránh lặp lại.

---

## Phân loại

| Ký hiệu  | Nguồn lỗi                          |
| -------- | ---------------------------------- |
| `[AUTO]` | AI tự gen code sai, không kiểm tra |
| `[MISS]` | Hiểu nhầm yêu cầu / spec           |
| `[USER]` | Người dùng chỉ ra                  |
| `[ENV]`  | Môi trường / tooling               |

---

## Danh sách lỗi

### E-01 · `[AUTO]` · BE — NULL constraint khi tạo lệnh

**Thời điểm**: Khi test curl POST `/api/pay-out-manual`  
**Lỗi**: `NULL not allowed for column "SENDER_GL_SEGMENT2"` (và nhiều cột khác)  
**Nguyên nhân**: AI gen payload curl test thiếu các trường NOT NULL — chưa đọc kỹ schema để biết danh sách mandatory fields. Các trường bị thiếu: `senderGlSegment2`, `senderBankCode`, `receiverGlSegment2`, `receiverBankCode`, `receiverAccountName`, `senderName`, `senderAddress`, `receiverName`.  
**Fix tại thời điểm**: Bổ sung đầy đủ tất cả NOT NULL fields vào test payload.  
**Tác động**: Mất time debug, tưởng BE lỗi logic nhưng thực ra là thiếu dữ liệu test.

---

### E-02 · `[AUTO]` · BE — Giá trị GL_SEGMENT4 quá dài

**Thời điểm**: Khi test curl POST tạo lệnh có `orderLines`  
**Lỗi**: `Value too long for column "GL_SEGMENT4 CHARACTER VARYING(1)"`  
**Nguyên nhân**: AI dùng `"ccidSegment4": "04"` (2 ký tự) nhưng schema Oracle định nghĩa VARCHAR(1). Chưa đọc schema constraint trước khi tạo test data.  
**Fix tại thời điểm**: Đổi thành `"ccidSegment4": "1"`.  
**Tác động**: Nhỏ, fix nhanh.

---

### E-03 · `[AUTO]` · BE — Sai tên field trong Return DTO

**Thời điểm**: Khi test curl POST `/{id}/return`  
**Lỗi**: `Unrecognized field "comment"` → HTTP 400  
**Nguyên nhân**: AI đoán tên field là `comment` nhưng DTO thực tế dùng `reason`. Không đọc lại DTO trước khi viết payload test.  
**Fix tại thời điểm**: Đổi payload sang `{"reason": "..."}`.  
**Tác động**: Nhỏ.

---

### E-04 · `[AUTO]` · FE — Navigation double prefix `/ltt/ltt/`

**Thời điểm**: Integration test — click "Tạo mới" → URL thành `/ltt/ltt/pay-out-manual/new`  
**Lỗi**: Double prefix do `BrowserRouter basename="/ltt"` đã tự prepend `/ltt`, nhưng code dùng `navigate("/ltt/pay-out-manual/new")`.  
**Nguyên nhân**: AI không chú ý `basename` config của router khi viết tất cả `navigate()` và `<Link to="">`. Xảy ra ở 4 chỗ trong ListPage và 2 chỗ trong FormPage.  
**Fix tại thời điểm**: Xóa prefix `/ltt/` khỏi tất cả `navigate()` và `to=""`.  
**Tác động**: Toàn bộ navigation trong app bị broken cho đến khi fix.

---

### E-05 · `[AUTO]` · FE — Form select option không tồn tại trong integration test

**Thời điểm**: Integration test — `page.selectOption('select', 'MANUAL')` timeout  
**Lỗi**: Timeout 30000ms — option `MANUAL` không có trong select "Kênh giao dịch"  
**Nguyên nhân**: AI viết test dùng value `MANUAL` nhưng form chỉ có options: `LNH`, `TTSP`, `LIEN_KHO_BAC`. Không kiểm tra FormPage source trước khi viết test script.  
**Fix tại thời điểm**: Đổi thành `selectOption('LNH')`.  
**Tác động**: Integration test bị block ở bước 3.

---

### E-06 · `[AUTO]` · FE→BE — Draft save 500 khi chưa fill đủ tabs

**Thời điểm**: Integration test — click "Lưu nháp" sau khi chỉ fill tab "Thông tin chung"  
**Lỗi**: HTTP 500 — `NULL not allowed` cho các sender/receiver fields  
**Nguyên nhân**: `draftSchema.partial()` cho phép save với data minimal, nhưng BE entity vẫn enforce NOT NULL. AI không tính đến luồng "partial save" sẽ gửi null cho các tab chưa được điền.  
**Fix tại thời điểm**: Cập nhật integration test để fill đủ cả 4 tabs (sender/receiver info) trước khi save draft.  
**Tác động**: Vấn đề design — FE draft save schema và BE entity constraint chưa được align. Cần xem lại ở Stage 4.

---

### E-07 · `[AUTO]` · FE — `navigate(-1)` sau DetailPage quay về FormPage

**Thời điểm**: Integration test bước 7 — sau khi tạo xong, click link row từ list → detail page → `navigate(-1)` → lại về FormPage (0 rows kiểm tra)  
**Lỗi**: Test expect 6 rows nhưng đang ở FormPage, không phải ListPage  
**Nguyên nhân**: History stack lúc đó là: List → Form → Detail. `navigate(-1)` từ Detail đưa về Form, không phải về List như AI kỳ vọng.  
**Fix tại thời điểm**: Trong test script, `goto` trực tiếp URL list thay vì dựa vào browser history.  
**Tác động**: Logic `navigate(-1)` trong DetailPage có thể confuse user nếu họ đến từ Form flow. Cần xem lại ở Stage 4.

---

### E-08 · `[AUTO]` · FE — Unused import gây TypeScript error

**Thời điểm**: Khi agent rewrite PayOutManualFormPage  
**Lỗi**: `TS2305: Module has no exported member 'FormField'` (hoặc tương tự)  
**Nguyên nhân**: Agent import `FormField` component nhưng không dùng trong code sau refactor. Không chạy `tsc --noEmit` ngay sau khi viết xong từng file.  
**Fix tại thời điểm**: Xóa dead import.  
**Tác động**: Nhỏ, nhưng thể hiện pattern không verify ngay sau gen code.

---

### E-09 · `[MISS]` · G3 Dev Sign-off được tạo trước khi verify tích hợp thực

**Thời điểm**: Sau khi test BE và FE riêng lẻ, AI tạo `FT-001-G3-dev-signoff.md`  
**Lỗi**: Sign-off khai báo "integration test pass" nhưng thực ra FE↔BE chưa được test cùng nhau trên browser  
**Nguyên nhân**: AI hiểu "integration test" là: "BE curl test OK + FE compile OK = done". Bỏ qua yêu cầu thực sự là test luồng end-to-end trên browser thực.  
**Phát hiện bởi**: Người dùng chỉ ra — _"nhưng tích hợp 2 thằng đã kiểm tra đâu"_  
**Fix tại thời điểm**: Tiến hành chạy Playwright integration test thực sự, update sign-off với kết quả thật.  
**Tác động**: Sign-off ban đầu là fake. Nếu không bị bắt, Stage 4 sẽ dựa trên thông tin sai.

---

### E-10 · `[MISS]` · UI không tuân thủ VDBAS_UIUX_Rule.md

**Thời điểm**: Sau khi FE code được gen lần đầu (commit FE-T7)  
**Lỗi**: UI dùng Tailwind/Radix UI generic styling, không khớp với VDBAS design system  
**Nguyên nhân**: AI gen UI theo "best practice React" mà không đọc `VDBAS_UIUX_Rule.md` và `VDBAS_HOME.html` để lấy design tokens. Thiếu bước đọc design spec trước khi code UI.  
**Phát hiện bởi**: Người dùng chỉ ra — _"ui không maps với VDBAS_HOME.html, và VDBAS_UIUX_Rule.md"_  
**Fix tại thời điểm**: Rewrite toàn bộ UI với VDBAS tokens (4 parallel agents): Layout, StatusBadge, DataTable, 3 pages.  
**Tác động**: Tốn nhiều token nhất trong session — phải rewrite gần như toàn bộ FE presentation layer.

---

### E-11 · `[ENV]` · Headless Chrome chụp screenshot trước khi React + API load xong

**Thời điểm**: Khi chụp `/ltt/pay-out-manual/1` để verify detail page  
**Lỗi**: Screenshot chỉ thấy loading spinner hoặc error message  
**Nguyên nhân**: `google-chrome --headless=new --screenshot` không có cơ chế chờ network idle. Chrome chụp ngay sau parse HTML, trước khi React render và fetch API hoàn thành.  
**Fix tại thời điểm**: Thử `--virtual-time-budget` → blocked real network. Sau đó dùng CDP WebSocket để chờ đúng.  
**Tác động**: Mất nhiều round để tìm cách chụp screenshot đúng.

---

### E-12 · `[ENV]` · Playwright không hỗ trợ Ubuntu 26.04

**Thời điểm**: Khi cài playwright browser để chạy screenshot  
**Lỗi**: `ERROR: Playwright does not support chromium on ubuntu26.04-x64`  
**Nguyên nhân**: Môi trường dev dùng Ubuntu 26.04 (chưa release chính thức), Playwright 1.60.0 chưa có browser binary cho distro này.  
**Fix tại thời điểm**: Dùng hệ thống `google-chrome` + CDP thủ công.  
**Tác động**: Không thể dùng Playwright E2E test trực tiếp trên môi trường này — cần ghi nhận để QA Agent xử lý.

---

### E-13 · `[AUTO]` · Dùng ID integer (`/pay-out-manual/1`) thay vì UUID

**Thời điểm**: Khi chụp screenshot detail page  
**Lỗi**: `Không thể tải dữ liệu lệnh thanh toán` — 404 hoặc parse lỗi  
**Nguyên nhân**: AI dùng URL `/pay-out-manual/1` nhưng BE dùng UUID làm primary key (H2 auto-gen). ID `1` không tồn tại.  
**Fix tại thời điểm**: Fetch danh sách để lấy UUID thật, dùng `e37a433b-7f9d-43d4-9995-3e888259ffe7`.  
**Tác động**: Nhỏ.

---

### E-14 · `[AUTO]` · `--virtual-time-budget` chặn real network call

**Thời điểm**: Thử chụp detail page bằng Chrome với `--virtual-time-budget=5000`  
**Lỗi**: Page hiển thị error "Không thể tải..." vì API call không đi qua được  
**Nguyên nhân**: `--virtual-time-budget` là flag cho testing timer-based JS, không phải "wait 5 giây". Nó thay thế real time = API fetch không có real clock để timeout/complete.  
**Fix tại thời điểm**: Bỏ flag đó, dùng CDP.  
**Tác động**: Nhỏ.

---

## Tổng kết theo loại

| Loại                              | Số lỗi | Lỗi nặng nhất                                    |
| --------------------------------- | ------ | ------------------------------------------------ |
| `[AUTO]` — AI tự gen sai          | 10     | E-04 (navigation), E-06 (draft/nullable), E-10\* |
| `[MISS]` — Hiểu nhầm spec/yêu cầu | 2      | E-09 (fake sign-off), E-10 (VDBAS UI)            |
| `[ENV]` — Môi trường/tooling      | 2      | E-12 (Playwright), E-11 (screenshot)             |

> \*E-10 kết hợp cả `[AUTO]` + `[MISS]`

---

## Ghi chú để phân tích khắc phục (TODO)

- [ ] Pattern check: **Đọc schema SQL + DTO trước khi viết bất kỳ test data hay form schema nào**
- [ ] Pattern check: **Đọc router config (basename) trước khi viết navigate/Link**
- [ ] Pattern check: **Đọc design spec (VDBAS*.md, *.html) trước khi viết bất kỳ dòng UI nào**
- [ ] Pattern check: **Không tạo sign-off cho đến khi E2E test thực sự pass**
- [ ] Design issue: **FE draft schema vs BE NOT NULL — cần align hoặc BE cần nullable trên draft**
- [ ] Design issue: **`navigate(-1)` trong detail page — cần "Quay lại danh sách" explicit**
- [ ] Infra issue: **Playwright trên Ubuntu 26.04 — cần giải pháp E2E test thay thế cho QA Stage**

---

## Audit Log

- **2026-05-20** | **Fullstack Dev Agent** | FT-001 | Tạo file audit-errors-log.md ghi nhận 14 lỗi phát sinh trong Stage 3.
