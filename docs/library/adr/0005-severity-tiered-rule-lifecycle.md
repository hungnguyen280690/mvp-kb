# ADR-0005: Vòng đời quy tắc phân tầng theo mức độ nghiêm trọng với các ngoại lệ có thời hạn và chương trình bổ sung tài liệu

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 07-05-2026
- **Người quyết định:** DevOps (dẫn dắt, sở hữu công cụ kiểm tra), Bảo mật, SA, tham vấn tất cả các vai trò
- **Thẻ:** công-cụ-kiểm-tra, quản-trị, hạ-tầng
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

Công cụ kiểm tra tài liệu tùy chỉnh thực thi khoảng hơn 20 quy tắc bao gồm sự hiện diện của file, cấu trúc phần đầu file, sự phê duyệt của sản phẩm trước, sự lan tỏa thay đổi, ghim mã SHA chéo repo, liên kết ADR/chính sách, xác thực nhân sự, phân loại bảo mật và tính hợp lệ của CODEOWNERS.

**Các quy tắc này sẽ thay đổi theo thời gian**: Các sự cố phát sinh sẽ thêm quy tắc mới, các thay đổi về tuân thủ sẽ thắt chặt quy tắc, các vai trò mới sẽ thêm các bước kiểm tra. Có ba cách tiếp cận thuần túy nhưng đều có nhược điểm:

- **Luôn ép buộc di chuyển**: Mọi PR phải đưa thư mục tính năng lên bộ quy tắc hiện tại. Một PR sửa lỗi chính tả nhỏ có thể bị chặn vì ai đó vừa thêm yêu cầu về file `06-threat-model.md` tuần trước. Gây ra sự hỗn loạn cho tiến độ Sprint.
- **Luôn bảo lưu (Grandfathering)**: Quy tắc chỉ áp dụng cho các tính năng được tạo sau khi quy tắc đó ra đời. Tài liệu sẽ bị phân cấp vĩnh viễn. Các tính năng cũ bị mục nát. Bảng theo dõi trở thành "nghĩa địa".
- **Cố định phiên bản kiểm tra theo từng tính năng**: Mỗi tính năng cố định một phiên bản công cụ kiểm tra. Có tính tái lập nhưng chi phí bảo trì tăng theo cấp số nhân.

Chúng ta cần sự tiến hóa của quy tắc mà không làm tê liệt tiến độ Sprint hoặc gây ra sự mục nát tài liệu, cộng với một cách có cấu trúc để xử lý các ngoại lệ (một tính năng thực sự không thể tuân thủ do mã nguồn cũ hoặc trường hợp khẩn cấp).

## Quyết định

Áp dụng **vòng đời quy tắc phân tầng theo mức độ nghiêm trọng với các ngoại lệ (waiver) có thời hạn và một chương trình bổ sung tài liệu (backfill) được theo dõi**.

### Mỗi quy tắc mang siêu dữ liệu về vòng đời

```yaml
id: R0042
title: Mọi tính năng phải có sản phẩm mô hình hóa mối đe dọa
severity: error # error (lỗi) | warning (cảnh báo) | info (thông tin)
introduced: 2026-Q3
applies_to: all # all (tất cả) | new-features-only (chỉ tính năng mới)
enforce_after: 2026-09-01 # trước ngày này: cảnh báo; sau ngày này: lỗi
bypass: requires-waiver # requires-waiver (cần ngoại lệ) | not-allowed (không cho phép)
backport: needed # needed (cần bổ sung) | not-needed (không cần)
owner: Bảo mật
```

### Các tầng mức độ nghiêm trọng

- **Nghiêm trọng (Bảo mật/Tuân thủ)** — Ép buộc di chuyển ngay lập tức. Bot tự động tạo PR để cập nhật tất cả các tính năng bị ảnh hưởng. **Không bảo lưu.** Ví dụ: Xử lý dữ liệu cá nhân, nhãn phân loại.
- **Quan trọng** — Di chuyển mềm: Cảnh báo trong N tuần (mặc định là 6), sau đó chuyển thành lỗi. Ví dụ: Thêm sản phẩm bắt buộc mới (`07-observability.md`), thêm trường mới ở phần đầu file.
- **Trình bày / Gợi ý** — Mức độ thông tin, không bao giờ chặn PR. Ví dụ: Thứ tự các mục ưu tiên, phong cách liên kết chéo.

### Ngoại lệ (Waiver) phải rõ ràng, có thời hạn và được phê duyệt

```yaml
# OWNERS.md hoặc phần khai báo đầu file tính năng
linter_waivers:
  - rule: R0042
    reason: "Tính năng đã có từ trước, mô hình mối đe dọa dự kiến hoàn thành vào 2026-Q4"
    expires: 2026-12-31
    approved_by: @security-lead     # người phê duyệt bắt buộc do chính công cụ kiểm tra thực thi
```

Công cụ kiểm tra xác thực: Ngoại lệ phải có `reason` (lý do), `expires` (ngày hết hạn), và `approved_by` (người phê duyệt) từ vai trò sở hữu quy tắc đó. Các ngoại lệ hết hạn sẽ tự động trở thành lỗi.

### Chương trình bổ sung tài liệu (Backfill)

Khi một quy tắc Nghiêm trọng được thêm vào, công cụ kiểm tra sẽ tự động tạo một **issue bổ sung tài liệu** liệt kê mọi thư mục tính năng không tuân thủ trên tất cả các repo. Vai trò sở hữu quy tắc đó chịu trách nhiệm hoàn thành việc bổ sung trong khoảng thời gian quy định.

### Phiên bản công cụ kiểm tra được cố định theo từng repo

Mỗi repo mã nguồn có phiên bản `mass-doc-lint@x.y.z` được cố định trong cấu hình CI. Việc cố định theo từng repo giúp các nhóm áp dụng thay đổi quy tắc theo nhịp độ của họ.

### Chu kỳ loại bỏ quy tắc

Các quy tắc không chỉ được thêm vào. Các quy tắc bị loại bỏ phải:

- Không có ngoại lệ nào đang phụ thuộc vào chúng.
- Có giai đoạn thông báo loại bỏ (tối thiểu 3 tháng) — cảnh báo "đã lỗi thời, sẽ bị loại bỏ trong phiên bản X".

## Hệ quả

### Tích cực

- **Tránh mục nát tài liệu**: Các quy tắc nghiêm trọng áp dụng cho tất cả; các tính năng cũ được bổ sung tài liệu.
- **Tránh tê liệt tiến độ Sprint**: Các quy tắc quan trọng được chuyển đổi mềm; các quy tắc trình bày không chặn PR.
- **Ngoại lệ hiển thị minh bạch và có thời hạn**: Công cụ kiểm tra sẽ đánh dấu các ngoại lệ đã hết hạn.
- **Lộ trình triển khai quy tắc có thể dự đoán được**: Được thông báo, có ngày tháng và người sở hữu rõ ràng.

### Hạn chế / Chi phí

- **Siêu dữ liệu quy tắc là một gánh nặng chi phí**: Việc viết một quy tắc mới tốn nhiều công sức hơn là chỉ thêm một hàm kiểm tra.
- **Chương trình bổ sung tài liệu cần người sở hữu**: Việc thêm quy tắc Nghiêm trọng tạo ra công việc cho vai trò sở hữu quy tắc đó.
- **Kỷ luật kiểm thử công cụ**: Mọi quy tắc đều cần được kiểm thử. Nếu không, các thay đổi quy tắc sẽ làm hỏng việc build trên tất cả các repo.
- **Khả năng lạm dụng ngoại lệ**: Dưới áp lực tiến độ, các ngoại lệ có thể bị cấp quá mức. Cần soát xét định kỳ hàng quý.

## Các phương án đã cân nhắc

### A. Luôn ép buộc di chuyển — Bị loại bỏ

Sạch sẽ nhất nhưng gây đau đớn trong thực tế. Chỉ phù hợp với các nhóm rất nhỏ (<5 người).

### B. Luôn bảo lưu (chỉ tính năng mới mới áp dụng quy tắc mới) — Bị loại bỏ

Dễ nhất, rẻ nhất. Nhưng làm tài liệu bị phân cấp vĩnh viễn. Các tính năng cũ trở thành các sản phẩm di sản; bảng theo dõi bị chia thành hai phần "được bao phủ" và "không được bao phủ".

### C. Cố định phiên bản kiểm tra theo từng tính năng — Bị loại bỏ

Linh hoạt tối đa nhưng chi phí bảo trì theo cấp số nhân. Nhiều phiên bản công cụ kiểm tra cùng tồn tại vĩnh viễn.

## Liên kết liên quan

- **ADR-0001** — Cấu trúc thư mục theo từng tính năng (các quy tắc thực thi cấu trúc này).
- **ADR-0004** — Bảo mật hai tầng (các quy tắc phân loại thuộc tầng Nghiêm trọng).
