# ADR-0013: Cấu trúc liên kết vòng lặp agent — các lớp lồng nhau với cơ chế kết thúc tường minh

- **Trạng thái:** Đã phê duyệt
- **Ngày:** 08-05-2026
- **Người quyết định:** SA (chủ trì), DevOps, Bảo mật
- **Thẻ:** agents, vòng lặp, hội tụ, nền tảng
- **Thay thế cho:** —
- **Được thay thế bởi:** —

## Ngữ cảnh

Các ADR 0001-0012 tạo ra một hệ thống mà mỗi sản phẩm bàn giao có máy trạng thái (`Draft → In Review → Approved`) — vốn đã là một vòng lặp ngầm theo từng sản phẩm. Lần chạy MVP TT.OUT.MANUAL đầu tiên đã bộc lộ khoảng trống: 3 trong số 6 agent bị đình trệ ở mốc watchdog 600 giây, cần can thiệp thủ công để lấp khoảng trống. Vòng lặp "thử lại khi lỗi" ngây thơ mà không có đảm bảo kết thúc sẽ gây ra **chi phí tăng vượt mức** (ADR-0009) và **agent phân kỳ không bao giờ hội tụ**.

Ba phạm vi vòng lặp tồn tại; chỉ dùng một sẽ thất bại:

- **Chỉ theo sản phẩm bàn giao**: các vấn đề liên tính năng (trượt giữa schema và thiết kế) lọt qua
- **Chỉ theo lô**: một sản phẩm lỗi kích hoạt chạy lại toàn bộ lô (lãng phí)
- **Chỉ theo tính năng**: agent lặp lại trên các sản phẩm upstream đã Approved, cố sửa các triệu chứng downstream

## Quyết định

Áp dụng **vòng lặp lồng nhau ở ba lớp** với hợp đồng kết thúc tường minh cho từng lớp:

```
Vòng lặp theo tính năng (ngoài):
  kết thúc: tiêu chí sẵn sàng phát hành của 04-test-plan được đáp ứng
  ngân sách:  OWNERS.md monthly_token_cost (theo ADR-0012)
  số lần lặp tối đa:   3 → leo thang lên con người theo ADR-0009
  thời gian thực:  7 ngày → phê duyệt phân cấp ADR-0012

  Vòng lặp theo lô (giữa):
    kết thúc: kiểm thử tích hợp + soát xét liên tính năng đạt
    ngân sách:      30% ngân sách tính năng mỗi lô
    số lần lặp tối đa:   2

    Vòng lặp theo sản phẩm bàn giao (trong):
      kết thúc: người soát xét sản phẩm báo cáo 0 phát hiện mức error
      ngân sách:      estimated_cost_usd của prompt template × 3
      số lần lặp tối đa:   3
      phân công lại: theo thang ADR-0013 (phần bổ sung bên dưới)
```

**Ba đường kết thúc mà mọi vòng lặp phải khai báo:**

1. **Thành công** — tiêu chí hội tụ được đáp ứng → thoát sạch
2. **Ngân sách** — đạt giới hạn chi phí hoặc số lần lặp → leo thang qua `escalations/runaway-prevented.md`
3. **Phân kỳ** — các fingerprint phát hiện lặp lại (Jaccard >50%) → leo thang qua `escalations/divergence-detected.md` (enum leo thang thứ 7 mới)

**Thuật toán phát hiện phân kỳ (đã khóa):**

```
fingerprint = rule_id + ':' + path_relative_to_feature_folder + ':' + bucketed_line_range_to_10 + ':' + category_enum

prev = set(iter_N_minus_1.findings_fingerprints)
curr = set(iter_N.findings_fingerprints)
jaccard = |prev ∩ curr| / |prev ∪ curr|
diverged = jaccard > 0.50  # có thể tinh chỉnh; phát cảnh báo ở 0.30
```

## Hệ quả

### Tích cực

- Chi phí có giới hạn: mọi lớp có giới hạn tường minh; tăng vượt mức được phòng ngừa ở lớp phát hiện.
- Phân kỳ có thể phát hiện: vòng lặp biết khi nào nên dừng, ngay cả khi agent nghĩ rằng nó đang tiến triển.
- Tái sử dụng cơ chế hiện có (máy trạng thái, phát hiện lan truyền, phân cấp mức độ nghiêm trọng).
- Khả năng kết hợp liên lớp: hội tụ theo sản phẩm bàn giao nuôi soát xét theo lô; theo lô nuôi theo tính năng.

### Tiêu cực / Chi phí

- Phát sinh ghi chép ở ba lớp (bản ghi lần lặp theo ADR-0013 §Bản ghi).
- Ngưỡng phân kỳ (Jaccard 0.50) là kinh nghiệm; cần tinh chỉnh từ dữ liệu thực tế.
- Giới hạn thời gian thực 7 ngày trên vòng ngoài buộc các quyết định mà con người có thể muốn trì hoãn; đây là chủ ý.

### Trung tính

- Phù hợp với pattern "soát xét chọn lọc" / "soát xét sâu theo rủi ro" từ ADR-0008 — sản phẩm bàn giao rủi ro cao được nhiều lần lặp hơn; sản phẩm thường quy hội tụ nhanh.

## Thang phân công lại (bổ sung cho cấu trúc liên kết)

Khi lần lặp vòng trong thất bại, bộ điều phối đi theo **thang kích hoạt cụ thể** (ưu tiên rẻ trước):

| Kích hoạt       | Hành động 1                       | Hành động 2            | Hành động 3        | Điểm dừng cứng             |
| --------------- | ---------------------------------- | ---------------------- | ------------------- | --------------------------- |
| Timeout         | Thử lại cùng agent (tạm thời)      | Chuyển nhà cung cấp khác | Nâng cấp premium    | Con người sau lần thứ 4     |
| Giới hạn lặp   | Chuyển nhà cung cấp khác           | Premium + giảm phạm vi  | —                   | Con người sau lần thứ 3     |
| Phân kỳ        | Nâng cấp premium HOẶC giảm phạm vi | —                       | —                   | Con người sau lần thứ 2     |
| Giới hạn chi phí | KHÔNG tự phân công lại             | —                       | —                   | Phê duyệt phân cấp ADR-0012 |
| Tự leo thang    | Theo định tuyến enum leo thang     | Con người               | —                   | Luôn là con người           |

Quy tắc cứng:

- Không bao giờ tái sử dụng đường dẫn đã thất bại (chống vòng lặp, mở rộng Quy tắc 2 ADR-0008)
- Mỗi lần phân công lại được ghi log trong `loop-reassignment-record.md` theo schema trong `templates/collaboration/`
- Ưu tiên chuyển nhà cung cấp khác hơn nâng cấp premium khi cả hai khả thi (rẻ hơn + không tương quan)

## Bản ghi (dấu vết kiểm toán theo ADR-0007)

Mỗi lần lặp vòng tạo ra một bản ghi markdown trong thư mục tính năng:

```
docs/features/<feature>/loop-iterations/
├── iter-001-review-by-<reviewer-handle>.md
├── iter-001-fix-attempt-by-<author-handle>.md
├── iter-002-review-by-<reviewer-handle>.md
├── divergence-check-iter-002-vs-001.md
└── reassignment-iter-002.md   (khi áp dụng)
```

Chỉ thêm vào (theo kỷ luật bất biến ADR-0004). Schema được định nghĩa trong `templates/collaboration/loop-iteration-record.md`.

## Giao thức kiểm tra sức khỏe (thay thế watchdog 600 giây ad-hoc)

```
Cứ mỗi 60 giây trong khi agent thực thi:
  - Ping heartbeat
  - Nếu không có heartbeat trong 120 giây: gửi prompt can thiệp
  - Nếu không phản hồi trong 180 giây: kết thúc agent → kích hoạt phân công lại do timeout
```

Timeout theo từng agent trong `agent-roster.md`:

```yaml
<agent-handle>:
  health_check:
    heartbeat_interval_s: 60
    no_progress_kill_s: 300
    intervention_window_s: 180
  retry_budget:
    transient_max: 1
    total_reassignments_max: 3
```

## Cách ly (dài hạn, liên kết đến ADR-0011)

Agent thất bại >= 5 lần trong cửa sổ trượt 7 ngày trên các tính năng → DevOps tự động mở PR cách ly danh sách (Active → Quarantined theo vòng đời ADR-0011).

## Các phương án thay thế đã xem xét

### A. Chỉ theo sản phẩm bàn giao — Bị loại bỏ

Các vấn đề liên tính năng lọt qua.

### B. Chỉ theo lô — Bị loại bỏ

Lãng phí do chạy lại toàn bộ lô khi chỉ một sản phẩm lỗi.

### C. Chỉ theo tính năng — Bị loại bỏ

Quá thô; agent lặp lại trên nội dung upstream đã Approved.

### D. Không phát hiện phân kỳ tường minh — Bị loại bỏ

Đây chính là chế độ thất bại thực tế của vòng lặp ngây thơ; không có cơ chế này, "vòng lặp agent" chỉ là "thử lại vô hạn."

## Liên quan

- ADR-0006 — A-là-chỉ-con-người (vòng lặp "phê duyệt" vẫn cần con người; bình luận PR tư vấn đủ cho hội tụ vòng trong)
- ADR-0008 — Ma trận phê duyệt phân cấp (bảo vệ chống vòng lặp mở rộng đến chuỗi phân công lại)
- ADR-0009 — Phòng thủ đa tầng (họ R1NNN mở rộng; mới R3NNN cho bản ghi vòng lặp)
- ADR-0011 — Danh tính agent hỗn hợp (tích hợp cách ly)
- ADR-0012 — Quản trị FinOps (giới hạn ngân sách thúc đẩy kết thúc)
- Quy trình làm việc liên vai trò: `workflows/agentic-loop.md`

## Ghi chú cho lần rà soát tới

- **Ngưỡng Jaccard** có thể tinh chỉnh; quan sát trong quý hoạt động đầu tiên, điều chỉnh nếu tỷ lệ dương tính giả >5% hoặc tỷ lệ âm tính giả >10%.
- **Giới hạn thời gian thực ngoài 7 ngày** giả định ngày làm việc của nhóm tính năng; điều chỉnh theo nhịp tổ chức (ví dụ: tổ chức dùng sprint 2 tuần có thể chọn 10).
- **Ngưỡng cách ly (5/7 ngày)** là điểm khởi đầu; siết chặt nếu agent liên tục hoạt động kém.
