# 🎭 Cẩm nang Chi tiết: Vai BA (Business Analyst) — Stage 1

## 🎯 Sứ mệnh

Biến tài liệu SRS Excel cồng kềnh thành bộ dữ liệu máy đọc được (YAML) và các kịch bản kiểm thử (Gherkin) chuẩn xác. Bạn là người định hình "linh hồn" của hệ thống.

---

## 🛠️ Công cụ AI của bạn

_Lưu ý: Vai BA **KHÔNG CẦN** cài đặt Docker hay Java._

### 1. Agent: `ba-parser`

- **Kích hoạt:** Gõ `> ba-parser` trong Claude Code.
- **Nhiệm vụ:** Đọc 22 sheet Excel và sinh ra 12 file trong thư mục `domain/`.

### 2. Plugin: `superpowers`

- **Mục đích:** Tra cứu nhanh thông tin trong hàng nghìn dòng Excel hoặc tài liệu dự án.
- **Lệnh mẫu:**
  - `@superpowers tìm trong file SRS sheet '5.5', liệt kê tất cả các rule liên quan đến 'Trạng thái LTT'.`
  - `@superpowers kiểm tra xem thuật ngữ 'NDKT' trong SRS có khớp với định nghĩa trong docs/CONTEXT.md không?`

---

## 🔄 Quy trình làm việc (Step-by-Step)

### Bước 1: Khởi động Workspace

```bash
cd workspaces/ba
claude code .
```

### Bước 2: Chạy Parser tự động

Yêu cầu Claude:

> "Chạy agent `ba-parser` để đọc file SRS tại `shared/specs/VDBAS_TT_SRS_III.1.1.2_TT.OUT.MANUAL_v7.xlsx`. Sinh đầy đủ các file trong domain/."

### Bước 3: Giải quyết mâu thuẫn (Inconsistency Triage)

Mở file `workspaces/ba/domain/inconsistencies.md`. AI sẽ liệt kê các điểm SRS viết chồng chéo hoặc thiếu logic.

- **Hành động:** Bạn phải thảo luận với Stakeholder (KBNN), sau đó ra lệnh cho Claude:
  > "Dựa trên phản hồi của nghiệp vụ, hãy cập nhật rule BIZ-005 trong `business-rules.yaml`: Một user không được vừa lập vừa duyệt lệnh."

### Bước 4: Chốt MVP Scope

Mở file `workspaces/ba/domain/scope.yaml`.

- **Hành động:** Kiểm tra xem danh sách các tính năng AI đề xuất làm ở MVP đã đúng chưa. Nếu muốn bỏ bớt:
  > "Loại bỏ kênh thanh toán SP và LKB ra khỏi MVP scope, chỉ tập trung vào LNH."

### Bước 5: Kiểm tra User Stories

Mở các file trong `workspaces/ba/domain/user-stories/*.feature`.

- **Hành động:** Đảm bảo mỗi Scenario đều có tag định danh rule:
  > "Rà soát lại các file .feature, đảm bảo mỗi scenario đều có ít nhất một tag @VAL hoặc @BIZ tương ứng với rule đã định nghĩa."

### Bước 6: Ký duyệt (Sign-off)

Khi mọi thứ đã chuẩn, yêu cầu Claude:

> "Tóm tắt kết quả Stage 1 vào file `gates/G1-summary.md` và tạo file ký duyệt `gates/G1-ba-signoff.md` để tôi commit."

---

## ⚠️ Lưu ý tử huyệt

1. **KHÔNG** tự ý sửa code trong `services/` hay `frontend/`.
2. **KHÔNG** dùng từ ngữ tùy tiện. Luôn đối chiếu với `docs/CONTEXT.md`.
3. **MỌI** thay đổi về nghiệp vụ phải được phản ánh vào file YAML, không được sửa miệng.
