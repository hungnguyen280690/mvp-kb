# ADR-0003: Mô hình đa kho lưu trữ lai với `docs-platform` trung tâm + tính năng theo từng kho code + ghim mã SHA chéo kho

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 07-05-2026
- **Người quyết định:** Kiến trúc sư trưởng (SA), DevOps, tham vấn tất cả các vai trò
- **Thẻ:** cấu-trúc-kho-lưu-trữ, nền-tảng, hạ-tầng
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

Hầu hết các tổ chức thực tế đều có nhiều kho lưu trữ mã nguồn (repo) — một repo cho mỗi dịch vụ, cộng với các repo riêng cho frontend, hạ tầng dạng code (IaC), mobile, thư viện dùng chung. Hệ thống tài liệu SDLC của chúng ta phải hoạt động được với thực tế này.

Một thiết kế đơn kho (monorepo - mọi thứ trong một repo) giúp việc kiểm tra quy tắc, phát hiện lan tỏa và phân quyền CODEOWNERS trở nên đơn giản — nhưng hiếm khi khả thi với các tổ chức đã có sẵn hệ thống. Ép buộc di chuyển sang monorepo chỉ để hỗ trợ hệ thống tài liệu là một lựa chọn kinh tế kỹ thuật tồi.

Mô hình đa repo tạo ra năm vấn đề mà bất kỳ giải pháp nào cũng phải trả lời:

1. **Phát hiện lan tỏa chéo repo** — khi ADR-0007 thay đổi trong một repo, mọi tính năng ở các repo khác đã ghim mã SHA của nó cần phải biết.
2. **Sự phân kỳ CODEOWNERS** — mỗi repo có quyền sở hữu riêng; các nhóm sẽ phải xử lý sự sai lệch theo thời gian.
3. **Sự sai lệch bản mẫu (Template)** — nếu không có nguồn duy nhất, các bản mẫu của mỗi repo sẽ khác nhau sau 6 tháng.
4. **Vị trí thư mục tính năng** — một tính năng chạm vào 3 repo sẽ do repo nào "sở hữu"?
5. **Tìm kiếm & Bảng theo dõi** — việc "tìm mọi tính năng tham chiếu đến ADR-0007" yêu cầu khả năng tìm kiếm liên hợp.

Các phương án thuần túy đều có những điểm gãy nghiêm trọng:

- **Chỉ dùng Monorepo**: Giả định dự án mới hoàn toàn hoặc sẵn sàng di chuyển; không thực tế với các tổ chức hiện tại.
- **Chỉ dùng kho tài liệu trung tâm** (không có `docs/features/` trong từng repo): Thay đổi code ở repo A không kích hoạt PR tài liệu ở repo trung tâm — sự sai lệch giữa code và tài liệu sẽ trở thành lỗi phổ biến nhất.
- **Chỉ dùng phân tán** (mỗi repo tự quản lý tài liệu, không có trung tâm): Tính nhất quán chéo bị phá vỡ; các nhóm sẽ khác nhau về ADR và chính sách.

## Quyết định

**Cấu trúc lai (Hybrid topology):**

- **Repo `docs-platform`** — trung tâm, có thẩm quyền đối với nội dung dùng chung (NGỮ CẢNH, các ADR, chính sách, tiêu chuẩn, bản mẫu, danh sách nhân sự, mã nguồn công cụ kiểm tra, bảng theo dõi tổng hợp).
- **Mỗi repo mã nguồn** — có thư mục `docs/features/` riêng chứa các thư mục tính năng cho các tính năng chủ yếu thuộc sở hữu của dịch vụ đó. Cộng với file `docs/service-context.md` tùy chọn để mở rộng NGỮ CẢNH trung tâm.
- **Các tham chiếu chéo repo được ghim mã SHA** trong phần khai báo đầu file (ví dụ: `applies_adrs: [{id: 0007, repo: docs-platform, sha: <mã_commit>}]`).
- **Một bot sẽ tự động tạo PR** khi các tài liệu trung tâm thay đổi: cập nhật mã SHA đã ghim hoặc đánh dấu sự lạc hậu trong các repo phụ thuộc.
- **Công cụ kiểm tra (linter) được phát hành dưới dạng CLI** (`mass-doc-lint`), được đưa vào CI của mọi repo như một thư viện phụ thuộc có phiên bản.
- **Quy tắc repo chính** điều phối các tính năng chéo repo: mỗi tính năng có đúng một repo chính (nơi chứa thư mục tính năng đầy đủ); các repo khác chứa các thư mục "bóng" (shadow) chỉ bao gồm phần việc của họ và dẫn link ngược lại repo chính.

```
docs-platform/                       (toàn tổ chức có quyền đọc, trung tâm)
├── CONTEXT.md                       (NGỮ CẢNH)
├── adr/                             (các quyết định kiến trúc)
├── policies/                        (chính sách)
├── standards/                       (tiêu chuẩn)
│   ├── team-handles.md              (tên chuẩn của các nhóm CODEOWNER)
│   └── linter-changelog.md
├── templates/                       (các bản mẫu sản phẩm bàn giao)
├── team-roster.md                   (danh sách nhân sự)
└── tools/doc-lint/                  (mã nguồn công cụ kiểm tra)

service-orders/                      (mỗi repo mã nguồn có cấu trúc tương tự)
├── docs/
│   ├── features/
│   │   └── 2026-05-XX-feature/      (thư mục tính năng đầy đủ, có ghim SHA chéo repo)
│   └── service-context.md
├── .github/CODEOWNERS               (được kiểm tra đối chiếu với team-handles.md)
└── src/
```

## Hệ quả

### Tích cực

- **Code và tài liệu tính năng nằm cùng nhau**: Các PR sửa code có thể sửa luôn thiết kế tính năng một cách đồng bộ.
- **Nguồn dữ liệu gốc duy nhất cho nội dung dùng chung**: Các ADR và chính sách không bị phân kỳ giữa các repo.
- **Cố định phiên bản công cụ kiểm tra cho từng repo**: Mỗi nhóm repo tự kiểm soát nhịp độ nâng cấp của họ.
- **Bảng theo dõi tổng hợp** chạy trong `docs-platform`, thu thập dữ liệu từ mọi repo thông qua GitHub API.

### Hạn chế / Chi phí

- **Công cụ kiểm tra phải xử lý Git chéo repo** để lấy mã SHA — phức tạp hơn nhiều so với đơn repo.
- **Bot tự động tạo PR** là một thành phần hạ tầng thực sự — mất khoảng 1 tuần để xây dựng và cần bảo trì liên tục.
- **Tính nhất quán của CODEOWNERS** là một kỷ luật, không phải tự động — cần quy tắc kiểm tra (file `team-handles.md` là chuẩn; CODEOWNERS từng repo được kiểm tra dựa trên đó).
- **Lan tỏa chéo repo là nỗ lực tối đa (best-effort)**: Khi ADR thay đổi ở `docs-platform`, bot mở các PR nhưng chúng có thể nằm chờ soát xét trong nhiều ngày. Khoảng thời gian sai lệch sẽ lớn hơn so với đơn repo.
- **Việc chọn repo chính là một quyết định cảm tính** cho các tính năng chéo; đôi khi gây tranh cãi (dịch vụ nào "sở hữu" một tính năng chạm vào 3 dịch vụ?).

### Trung lập

- **Tìm kiếm**: Liên hợp. Bảng theo dõi tổng hợp cung cấp giao diện tìm kiếm duy nhất. Việc tìm kiếm trực tiếp (grep) trên các repo yêu cầu một công cụ cục bộ (`mass-doc-lint search` hoặc tương tự).
- **Kết hợp Công khai/Riêng tư**: `docs-platform` có thể được phản chiếu một phần sang một trang web công khai trong khi vẫn giữ `docs-confidential` (ADR-0004) hoàn toàn riêng tư.

## Các phương án đã cân nhắc

### A. Monorepo (code + tất cả tài liệu trong 1 repo) — Bị loại bỏ cho mục đích chung

Đơn giản nhất. Chỉ hoạt động nếu dự án mới hoặc đã là monorepo. Hầu hết các tổ chức hiện tại không thể di chuyển chỉ vì một hệ thống tài liệu.

### B. Chỉ có repo tài liệu trung tâm, các repo code không có tài liệu — Bị loại bỏ

Sự sai lệch giữa code và tài liệu trở thành lỗi phổ biến nhất. Mọi thay đổi code yêu cầu một PR riêng ở một repo khác. Áp lực tiến độ sẽ khiến việc này bị bỏ qua chỉ sau vài tuần.

### C. Chỉ phân tán — mỗi repo tự quản lý tài liệu, không có trung tâm — Bị loại bỏ

Tính nhất quán chéo bị phá vỡ. Các dịch vụ khác nhau áp dụng các ADR, chính sách, thậm chí cả bản mẫu khác nhau. Làm mất đi mục đích của "không chồng chéo/mâu thuẫn".

### D. Tài liệu dạng submodule — Bị loại bỏ

Submodule rất khó dùng: cố định phiên bản phức tạp, người đóng góp dễ gặp lỗi khi checkout, và việc cập nhật yêu cầu thao tác ở mọi repo. Bot tự động tạo PR đơn giản và minh bạch hơn.

## Liên kết liên quan

- **ADR-0001** — Cấu trúc thư mục theo từng tính năng (nằm trong `docs/features/` của mỗi repo code).
- **ADR-0004** — Bảo mật hai tầng (`docs-confidential` là repo thứ ba trong cấu trúc).
- **ADR-0005** — Quy trình kiểm tra quy tắc chất lượng (công cụ được phát hành từ `docs-platform`).
