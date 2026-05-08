# Domain Context — VDBAS TT.OUT.MANUAL

Ngôn ngữ chung (ubiquitous language) cho dự án. Mọi agent + người tham gia dùng đúng các từ trong file này. Khi có thay đổi/bổ sung, cập nhật ở đây trước, code/agent đọc lại sau.

## Governance Terms

| Thuật ngữ                 | Định nghĩa                                                             |
| ------------------------- | ---------------------------------------------------------------------- |
| **RACI**                  | Responsible/Accountable/Consulted/Informed — ma trận phân công vai trò |
| **Quality Gate**          | Tiêu chí chất lượng phải pass trước khi merge                          |
| **Feature Lifecycle**     | Quản lý vòng đời feature từ idea → deployment                          |
| **Artifact Traceability** | Khả năng trace artifact từ upstream → downstream                       |
| **ADR**                   | Architectural Decision Record — ghi nhận quyết định kiến trúc          |
| **Severity Tier**         | MUST/SHOULD/MAY — mức độ bắt buộc của quality rule                     |
| **Waiver**                | Cho phép tạm thời bỏ qua MUST rule, có expiry date                     |
| **Escalation**            | Template chuẩn khi AI agent cần human intervention                     |

## Database Terms

| Thuật ngữ              | Định nghĩa                                                         |
| ---------------------- | ------------------------------------------------------------------ |
| **Schema Migration**   | Thay đổi cấu trúc DB qua versioned scripts (V1, V2...)             |
| **Hash Chain Audit**   | Chuỗi audit append-only: prev_hash + payload + timestamp → SHA-256 |
| **Optimistic Locking** | Kiểm soát concurrent update qua version column + If-Match header   |
| **Outbox Pattern**     | Ghi DB write + queue message trong cùng transaction                |
| **Idempotency Key**    | Mã unique đảm bảo request không bị xử lý 2 lần                     |

## Security Terms

| Thuật ngữ                    | Định nghĩa                                                                                     |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| **STRIDE**                   | Spoofing/Tampering/Repudiation/Information Disclosure/Denial of Service/Elevation of Privilege |
| **OWASP Top 10**             | 10 rủi ro bảo mật web phổ biến nhất                                                            |
| **SoD**                      | Separation of Duties — maker ≠ checker ≠ approver                                              |
| **Threat Model**             | Phân tích mối đe dọa hệ thống                                                                  |
| **Two-Tier Confidentiality** | Public repo + locked confidential docs                                                         |

## UI/UX Terms

| Thuật ngữ             | Định nghĩa                                              |
| --------------------- | ------------------------------------------------------- |
| **Design System**     | Bộ components + guidelines nhất quán cho UI             |
| **WCAG 2.1 AA**       | Tiêu chuẩn accessibility — minimum baseline             |
| **shadcn/ui**         | Component library React + Tailwind (locked by ADR-0014) |
| **Component Library** | Bộ reusable components cho frontend                     |

## Hệ thống

| Mã                  | Tên đầy đủ                                  | Vai trò                           |
| ------------------- | ------------------------------------------- | --------------------------------- |
| **VDBAS**           | Vietnam Development Bank Application System | Hệ thống ứng dụng KBNN (đang xây) |
| **KBNN**            | Kho bạc Nhà nước                            | Cơ quan nhà nước quản lý NSNN     |
| **NHNN**            | Ngân hàng Nhà nước Việt Nam                 | Ngân hàng trung ương              |
| **NHTM**            | Ngân hàng thương mại                        | NH thương mại nhận thanh toán     |
| **CITAD**           | Hệ thống thanh toán liên ngân hàng của NHNN | Gateway kênh LNH                  |
| **TABMIS** / **GL** | Sổ cái legacy KBNN                          | Nguồn sự thật kế toán, KHÔNG SỬA  |
| **QLT**             | Quản lý thu                                 | Module quản lý thu NSNN           |
| **QLChi**           | Quản lý chi                                 | Module quản lý chi NSNN, hợp đồng |
| **ECM**             | Enterprise Content Management               | Lưu trữ chứng từ điện tử          |

## Khái niệm chính

| Mã                | Tên đầy đủ                       | Định nghĩa ngắn                                      |
| ----------------- | -------------------------------- | ---------------------------------------------------- |
| **LTT**           | Lệnh thanh toán                  | Chứng từ điện tử yêu cầu chuyển tiền                 |
| **TT.OUT.MANUAL** | Lệnh thanh toán đi NHNN thủ công | Module hiện tại — Maker nhập tay (không từ STP/auto) |
| **YCTT**          | Yêu cầu thanh toán               | Số định danh duy nhất 1 LTT                          |
| **NSNN**          | Ngân sách Nhà nước               | -                                                    |
| **DVQHNS**        | Đơn vị có quan hệ ngân sách      | Đơn vị có mã trong hệ thống NSNN                     |
| **ĐVSDNS**        | Đơn vị sử dụng ngân sách         | Đơn vị được giao dự toán                             |
| **NDKT**          | Nội dung kinh tế                 | Mã phân loại khoản chi (vd: lương, công tác phí)     |
| **COA**           | Chart of Accounts                | Hệ thống mã tài khoản kế toán                        |
| **TPCP**          | Trái phiếu chính phủ             | Loại lệnh đặc thù                                    |
| **CKS**           | Chữ ký số                        | Ký bằng chứng thư cá nhân hợp lệ                     |
| **SoD**           | Separation of Duties             | Phân tách trách nhiệm (1 user không thao tác chéo)   |

## Vai trò người dùng

| Vai trò                        | Mô tả                           | Quyền chính                                 |
| ------------------------------ | ------------------------------- | ------------------------------------------- |
| **Maker (Người lập)**          | Cán bộ ĐVSDNS / KBNN nhập LTT   | Tạo / Sửa / Xoá / Submit LTT của chính mình |
| **Checker (Người kiểm soát)**  | Cán bộ KBNN duyệt cấp 1         | Approve / Reject sau Submit                 |
| **Approver (Người phê duyệt)** | Cán bộ KBNN duyệt cấp 2 + ký số | Approve cuối / Sign / Send / Cancel         |
| **Admin**                      | Quản trị viên đơn vị            | Tra cứu, không thao tác nghiệp vụ           |

**Ràng buộc SoD**: 1 LTT thì `maker_id ≠ checker_id ≠ approver_id`.

## Kênh thanh toán

| Kênh    | Tên                    | Đối tượng | Pattern Số YCTT          | MQ                         |
| ------- | ---------------------- | --------- | ------------------------ | -------------------------- |
| **LNH** | Liên ngân hàng (CITAD) | NHNN      | `ddMMyyyy + 6-digit seq` | `LNH.SEND.Q` / `LNH.ACK.Q` |
| **SP**  | Thanh toán song phương | NHTM      | `<maNH>YYYYMMDD<seq>`    | `SP.SEND.Q` / `SP.ACK.Q`   |
| **LKB** | Liên kho bạc           | KBNN khác | `<maKB>YYYY<seq>`        | `LKB.SEND.Q` / `LKB.ACK.Q` |

**MVP scope** (đề xuất): **chỉ LNH** — chờ Stage 1 Gate xác nhận.

## Trạng thái LTT (15 trạng thái)

Tham chiếu chi tiết: [STATES.md](STATES.md) (sinh ở Stage 1). Tóm tắt:

```
DRAFT → SUBMITTED → IN_CONTROL → APPROVED → SIGNED → SENT → CONFIRMED → POSTED
                ↓             ↓
        RETURNED_TO_MAKER  RETURNED_TO_CHECKER
                                    ↓
                              CANCELLED / SEND_FAILED / POST_FAILED / REVERSED / BLOCKED
```

## Touchpoint tích hợp

| Touchpoint           | Vai trò                  | Trong MVP? |
| -------------------- | ------------------------ | ---------- |
| **NHNN/CITAD (LNH)** | Gửi LTT đi               | ✓          |
| **NHTM (SP)**        | Gửi LTT đi               | ✗ phase 2  |
| **LKB**              | Gửi LTT đi               | ✗ phase 2  |
| **GL (sổ cái)**      | Hạch toán sau CONFIRMED  | ✓          |
| **QLT**              | Cập nhật module thu      | ✗ phase 2  |
| **QLChi**            | Giảm dư hợp đồng         | ✗ phase 2  |
| **ECM**              | Lưu trữ chứng từ điện tử | ✗ phase 2  |

## Quy ước viết

- **PascalCase** cho entity Java (`PaymentOrder`, `LineItem`)
- **snake_case** cho bảng Oracle (`payment_order`, `line_item`)
- **kebab-case** cho REST endpoint (`/api/payment-orders`)
- **SCREAMING_SNAKE** cho state (`DRAFT`, `IN_CONTROL`)
- **camelCase** cho field JSON
- Dùng tiếng Việt **chỉ** trong UI text + comment domain. Code + log + audit dùng tiếng Anh.
