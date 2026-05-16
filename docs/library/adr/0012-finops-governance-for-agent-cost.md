# ADR-0012: Quản trị FinOps cho chi phí agent (hiện thị + phân bổ ngân sách + tối ưu + tính phí chéo hỗn hợp + luồng phê duyệt)

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 07-05-2026
- **Người quyết định:** DevOps + Tài chính + SA (sở hữu chung ba bên), tham vấn nhà tài trợ điều hành
- **Thẻ:** agents, finops, chi phí, quản trị
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

SDLC cơ bản trả bằng giờ nhân lực. Phiên bản tăng cường agent trả bằng token. Ước tính chi phí năm hóa thận trọng:

| Quy mô nhóm                                    | Chi phí agent năm hóa         |
| ---------------------------------------------- | ----------------------------- |
| Nhóm 5 người, 30 PR/ngày, đa nhà cung cấp      | $20K-100K/năm                 |
| Nhóm 15 người, 80 PR/ngày                      | $100K-500K/năm                |
| Cộng bộ kiểm thử hành vi (ADR-0011)            | +5-15% chi phí phát sinh      |
| Cộng sự kiện chi phí tăng vượt mức (phòng ngừa ADR-0009) | $0-$10K mỗi sự cố, có giới hạn |

Nếu không có quản trị, bốn sự cố có thể dự đoán được:

| Sự cố                                                                                | Tác động                                      |
| ------------------------------------------------------------------------------------ | --------------------------------------------- |
| **Sốc hóa đơn** — hóa đơn nhà cung cấp đến 30 ngày sau khi chi tiêu; tài chính đóng băng chương trình | Dự án bị hủy giữa quá trình triển khai        |
| **Lạm dụng premium** — Opus chạy các tác vụ mà GLM-4-Air xử lý được với chi phí 1/30 | Lãng phí chi tiêu gấp 5-10 lần               |
| **Nhầm lẫn tính phí chéo** — agent phục vụ Tính năng A và Tính năng B; không ai trả | Chủ sở hữu tính năng từ chối cam kết ngân sách |
| **Không nhìn thấy chi phí trên giá trị** — không có chỉ số "agent này có đáng không?" | Không thể bảo vệ chương trình khi rà soát ngân sách |

Các sự cố này xảy ra ở các thời điểm có thể dự đoán: sốc hóa đơn ở tháng 1-2, lạm dụng premium liên tục, nhầm lẫn tính phí chéo ở lần refactor liên tính năng đầu tiên, chi phí trên giá trị ở lần rà soát ngân sách đầu tiên. **Cả bốn đều sẽ giết chết chương trình** nếu không được thiết kế phòng ngừa.

## Quyết định

Áp dụng **quản trị FinOps đầy đủ** trên ba chiều, cộng mô hình tính phí chéo hỗn hợp và luồng phê duyệt phân cấp.

### Chiều 1 — Hiển thị (bảng điều khiển thời gian thực)

`docs-platform/cost-dashboard.md`, do cron job của linter sinh ra:

- Chi tiêu trực tiếp: $/ngày cho từng agent, từng nhà cung cấp, so với tốc độ ngân sách
- Chi phí theo tính năng (tổng hợp từ lịch sử commit của thư mục tính năng)
- Chi phí theo vai trò
- Chi phí theo PR (đã có trong mô tả PR, ADR-0007)
- Tỷ lệ nhà cung cấp (tỷ lệ chia anthropic vs zai; cảnh báo khi lệch chính sách)
- Đường xu hướng (hàng tuần/hàng tháng)
- Chỉ báo bất thường (các PR/ngày vượt 2σ so với mức bình thường được đánh dấu)

Nguồn: API nhà cung cấp (sử dụng token) + phân tích commit trailer + cấu trúc thư mục tính năng.

### Chiều 2 — Phân bổ ngân sách (giới hạn theo tính năng + theo nhóm)

**Theo tính năng** trong OWNERS.md:

```yaml
budget:
  monthly_token_cost: $500
  hard_cap: $750
  provider_mix_target:
    claude-opus: 30%
    claude-sonnet: 50%
    glm-4-air: 20%
```

**Theo nhóm / tổ chức** trong `docs-platform/policies/cost-governance.md`:

```yaml
budgets:
  team_orders:
    monthly: $5000
    hard_cap: $7500
  team_billing:
    monthly: $3000
    hard_cap: $4500
  platform_pool:
    monthly: $2000
    hard_cap: $3000
```

**Thực thi giới hạn phân cấp:**

| Ngưỡng                                | Hành động                                            |
| ------------------------------------- | ---------------------------------------------------- |
| 70% giới hạn hàng tháng               | Thông báo thông tin cho trưởng vai trò               |
| 85%                                   | Thông báo SA + DevOps                                |
| 95%                                   | Chặn các lệnh gọi không khẩn cấp mới                 |
| 100%                                  | Chặn mọi lệnh gọi agent trừ khi có ghi đè được ký   |
| Giới hạn theo PR (ví dụ $5)           | Chặn PR; yêu cầu phê duyệt                          |
| Giới hạn theo lệnh gọi (ví dụ 200K token) | Kiểm tra trước khi gửi; từ chối nếu vượt            |

Giới hạn cứng là bộ ngắt mạch; hệ thống luôn hạ cấp an toàn (con người tiếp quản).

### Chiều 3 — Tối ưu (định tuyến theo tỷ lệ nhà cung cấp)

`docs-platform/standards/agent-routing.md`:

| Sản phẩm / tác vụ                | Agent ưu tiên                    | Lý do                                       |
| -------------------------------- | -------------------------------- | ------------------------------------------- |
| ADR / Cấp critical               | `@claude-opus-reviewer`          | Rủi ro cao; chi phí premium hợp lý          |
| Bản nháp ban đầu tính năng nội bộ | `@glm-4-air-doc-drafter`        | Nháp giá rẻ; Opus soát xét sẽ bắt lỗi      |
| Sinh mã kiểm thử mẫu             | `@claude-sonnet-test-automator` | Hạng trung; đáng tin cậy cho các pattern   |
| Soát xét tư vấn liên nhà cung cấp | Nhà cung cấp khác với tác giả   | Điểm mù không tương quan (ADR-0008)         |
| Cập nhật link/SHA thường quy     | `@glm-4-air-doc-drafter`        | Giá rẻ; mang tính cơ học                   |
| Thiết kế migration schema         | `@claude-opus-reviewer`         | Tính đúng đắn quan trọng; premium           |

Linter xác thực định tuyến ở mức **tư vấn** (đôi khi premium là hợp lý cho các lý do phi thường quy), nhưng đánh dấu các pattern tác vụ thường quy trên mô hình premium và hiển thị trên bảng điều khiển.

**Bộ nhớ đệm và gom lô:**

- Bộ nhớ đệm các lệnh gọi agent lặp lại (cùng prompt + ngữ cảnh) trong 24 giờ
- Gom các PR fan-out vào một phiên agent duy nhất khi có thể
- Tái sử dụng các lần soát xét trước thông qua trích dẫn thay vì tạo lại

### Mô hình tính phí chéo hỗn hợp

| Hạng mục công việc                                         | Ai trả                                |
| ---------------------------------------------------------- | ------------------------------------- |
| Công việc theo tính năng (trong thư mục tính năng)         | Ngân sách nhóm của tính năng           |
| Công việc liên tính năng (thay đổi template, nháp ADR, PR fan-out) | **Quỹ nền tảng** (ngân sách R&D trung ương) |
| Bot quản lý danh sách (phân công lại, fan-out)            | Quỹ nền tảng                           |
| Bộ kiểm thử hành vi (ADR-0011)                             | Quỹ nền tảng                           |
| Tạo bảng điều khiển chi phí, chạy linter                   | Quỹ nền tảng                           |
| Soát xét tư vấn liên nhà cung cấp                          | Ngân sách của tính năng được soát xét  |

**Quỹ nền tảng do DevOps sở hữu + được tài trợ từ ngân sách kỹ thuật trung ương.** Đóng vai trò bộ đệm — các tính năng không bị phạt vì hưởng lợi từ cải thiện liên tính năng; công việc liên tính năng không bị chặn bởi ngân sách từng tính năng. **Phải là một khoản ngân sách thực sự được tài trợ, không phải hy vọng không ngân sách.**

Báo cáo theo tính năng hiển thị chi tiêu trực tiếp VÀ "lợi ích từ quỹ chung" (giá trị ước tính của công việc liên tính năng đã giúp tính năng đó) để đảm bảo minh bạch.

### Luồng phê duyệt phân cấp cho chi phí vượt mức

| Phạm vi                  | Người phê duyệt                                     |
| ------------------------ | --------------------------------------------------- |
| Lên đến 110% giới hạn   | Trưởng vai trò phê duyệt                            |
| Lên đến 130%             | SA + DevOps đồng phê duyệt                          |
| Lên đến 200%             | Nhà tài trợ điều hành phê duyệt                     |
| > 200% hoặc lặp lại      | Bắt buộc ADR (lý do + điều chỉnh dự phóng)          |

Mỗi lần ghi đè được ghi log với người phê duyệt và lý do. Chi phí vượt mức lặp lại (>2 lần trong một quý) kích hoạt đặt lại/điều chỉnh ngân sách qua ADR.

### Chỉ số chi phí trên giá trị (công cụ bảo vệ chương trình trước ban lãnh đạo)

- Chi phí trên mỗi sản phẩm bàn giao = $/tính năng / số sản phẩm bàn giao
- Chi phí trên mỗi lỗi được phòng ngừa = $/soát xét liên nhà cung cấp × tỷ lệ bắt lỗi
- Chi phí trên mỗi giờ nhân lực tiết kiệm = $/tác vụ agent × thời gian tương đương con người ước tính
- Chi phí trên mỗi sự cố được tránh = khó đo hơn; sử dụng proxy là chi phí phòng ngừa tăng vượt mức

Được theo dõi trên bảng điều khiển. Rà soát hàng quý. **Nếu không có các chỉ số này, bạn không thể bảo vệ chương trình trước lập luận "cứ dùng người thôi."**

### Phần ngân sách trên role-card

Mọi role-card đều bao gồm:

- Ngân sách agent hàng tháng cho vai trò
- Kỳ vọng tỷ lệ nhà cung cấp
- Hướng dẫn "khi nào nên nâng cấp từ giá rẻ lên premium"
- Mục runbook cho chi phí tăng vượt mức (liên kết chéo đến ADR-0009)

### Chủ sở hữu

**Chính sách sở hữu chung ba bên:**

- **DevOps** — vận hành bảng điều khiển và thực thi
- **Tài chính** — đặt giới hạn và phê duyệt chi phí vượt mức
- **SA** — đặt chính sách định tuyến và mục tiêu chi phí trên giá trị

## Hệ quả

### Tích cực

- Phòng ngừa sốc hóa đơn — giới hạn + bảng điều khiển bắt vượt chi tiêu trước khi có hóa đơn.
- Lạm dụng premium bị phát hiện và định tuyến sang mô hình rẻ hơn khi phù hợp.
- Mô hình tính phí chéo công bằng (tính năng trả trực tiếp, nền tảng trả liên tính năng).
- Chỉ số chi phí trên giá trị bảo vệ chương trình khi rà soát ngân sách.
- Đường hạ cấp thực tế: giới hạn cứng khiến con người tiếp quản, không phải chi tiêu vượt âm thầm.

### Tiêu cực / Chi phí

- Thêm khoảng 3 tuần công việc nền tảng (bảng điều khiển + giới hạn + định tuyến + chỉ số + tài liệu chính sách).
- Nhịp FinOps liên tục chiếm khoảng 5% thời gian DevOps.
- Quỹ nền tảng cần quyết định tài trợ rõ ràng; công việc chính trị.
- Mục tiêu tỷ lệ nhà cung cấp tạo phát sinh cho từng tính năng (theo dõi tỷ lệ).
- Luồng phê duyệt có thể làm chậm chi phí vượt mức hợp lý; cần điều chỉnh ngưỡng cẩn thận.

### Trung tính

- Ngân sách theo tính năng khiến một số nhóm cảm thấy bị hạn chế; đánh đổi là tính dự đoán được.
- Bộ nhớ đệm có thể tạo ra độ cũ bất ngờ nếu ngữ cảnh thay đổi; vô hiệu hóa bộ nhớ đệm cần cẩn trọng.

## Các phương án thay thế đã xem xét

### A. Chỉ hiện thị + giới hạn — Bị loại bỏ

Bảng điều khiển + giới hạn cứng; bỏ qua tính phí chéo và chính sách tỷ lệ nhà cung cấp. Rẻ hơn khi xây dựng nhưng không có công cụ bảo vệ khi rà soát ngân sách; sốc hóa đơn được phòng ngừa nhưng lạm dụng premium vẫn tiếp diễn.

### B. Chỉ giới hạn — Bị loại bỏ

Chỉ giới hạn cứng; không hiện thị, không tối ưu. Sống sót tháng đầu tiên; thất bại ở quy mô lớn vì không ai trả lời được "tại sao chi tiêu tăng?"

### C. Không có — trả hóa đơn, coi là chi phí chung — Bị loại bỏ

Chỉ khả thi nếu tổng chi tiêu agent giữ ở mức nhỏ. Với tỷ lệ agent 70% trên 8 vai trò, gần như chắc chắn không phải trường hợp đó.

## Liên quan

- **ADR-0007** — Gán nguồn đầy đủ (cung cấp dữ liệu theo PR/theo tính năng cho bảng điều khiển chi phí)
- **ADR-0008** — Ma trận phê duyệt phân cấp (chi phí tư vấn liên nhà cung cấp tính theo tính năng)
- **ADR-0009** — Phòng thủ đa tầng (kiểm soát chi phí tăng vượt mức)
- **ADR-0010** — Thiết kế vai trò con người (con người tiếp quản khi giới hạn được kích hoạt)
- **ADR-0011** — Danh tính agent hỗn hợp (kiểm thử hành vi được tài trợ từ quỹ nền tảng)
- **Lịch sử thiết kế**: [`design/2026-05-07-agent-augmentation-grill.md`](../design/2026-05-07-agent-augmentation-grill.md), Attack #7

## Ghi chú cho lần rà soát tới

- **Tài trợ quỹ nền tảng** là phần mong manh nhất. Nếu không phải là một khoản ngân sách thực sự, công việc liên tính năng sẽ không được thực hiện; các tính năng sẽ từ chối gánh chi phí; hệ thống đình trệ. Cần có cam kết điều hành rõ ràng **trước** Giai đoạn 0.
- **Chỉ số chi phí trên giá trị** sẽ tiến hóa. Bắt đầu đơn giản; tinh chỉnh khi dữ liệu tích lũy. Lần rà soát quý đầu tiên sẽ bộc lộ khoảng trống đo lường; lặp lại.
- **Mục tiêu tỷ lệ nhà cung cấp** mang tính tư vấn, không ép buộc. Nếu tỷ lệ thực tế liên tục vi phạm mục tiêu, có thể mục tiêu đang sai (chứ không phải định tuyến); cần hiệu chỉnh lại.
- **Độ cũ của bộ nhớ đệm** có thể gây ra lỗi agent khó gỡ lỗi; theo dõi tỷ lệ trúng bộ nhớ đệm và tỷ lệ trúng sai; giới hạn TTL bộ nhớ đệm chặt chẽ cho nội dung đang thay đổi.
- Các cân nhắc đa tiền tệ / đa thuê bao được hoãn lại. Nếu tổ chức thêm nhóm khu vực hoặc khách hàng bên ngoài, cần xem xét lại.
