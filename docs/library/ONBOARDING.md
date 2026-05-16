# 👋 Chào mừng đến với Vibe-code MVP Kho Bạc!

Dự án này không phát triển theo cách truyền thống. Chúng ta dùng **AI làm Bulk-work (làm phần lớn việc chân tay)** và **Con người làm Gatekeeper (người gác cổng tri thức)**.

Tài liệu này giúp bạn bắt nhịp với "vibe" của dự án trong 24 giờ đầu tiên.

---

## 🏗️ Lộ trình 24 giờ đầu tiên

### Giờ 0: Chuẩn bị "Vũ khí"

Làm theo đúng các bước kỹ thuật trong `README.md` > **Onboarding cho thành viên mới**:

1. `gh auth login`
2. `git clone`
3. `./scripts/setup.sh` (Mise + Pre-commit)
4. `./scripts/install-claude-plugins.sh`
5. `./scripts/verify-env.sh` (Phải pass hết ✅)
6. `make infra-up` (Nếu máy đủ khoẻ, để chạy Oracle/MQ)

**Option: Dev Container** (VS Code + Docker):

1. Mở folder trong VS Code
2. `Ctrl+Shift+P` → "Dev Containers: Reopen in Container"
3. Container tự động cài đặt mọi thứ theo `.mise.toml` + `plugins.lock`
4. Không cần chạy `./scripts/setup.sh` thủ công — `postCreateCommand` làm tự động.

### Giờ 1: Thấm nhuần "Vibe"

Đọc các file cốt lõi trong thư mục `docs/`:

1. `CONTEXT.md`: Để không bị "ngáo" thuật ngữ (LTT là gì? COA là gì?).
2. `WORKFLOW.md`: Hiểu pipeline 5 Stage với 9 roles. PR của bạn đang ở Stage nào? Ai gác cổng?
3. `SAFETY.md`: Các quy tắc "Tử huyệt". Vi phạm cái này là CI block ngay lập tức.
4. `adr/`: 18 ADRs giải thích TẠI SAO chọn cách này, không phải cách khác.
5. `quality-rules/`: Quality rules (R0010–R0246) enforced bởi CI doc-lint.

### Giờ 2: Nhận vai (Role)

Mỗi thành viên khi join sẽ vào 1 trong 9 workspace tại `workspaces/`.

- `cd workspaces/<vai-tro-cua-ban>`
- `claude code .`
- Đọc file `CLAUDE.md` tại đó. Nó là "bí kíp riêng" cho vai trò của bạn.

**9 roles**: BA, SA, DBA, Security, UI/UX, Dev-BE, Dev-FE, QA, DevOps.

---

## 🎭 Playbook: Cách làm việc với AI (Vibe-code style)

### 1. AI là "Thợ", Bạn là "Thầy"

- Đừng tự viết code boilerplate. Hãy ra lệnh cho Claude: `"Dựa trên contract Stage 2, sinh scaffold cho service core"`.
- Đừng tự sửa logic nghiệp vụ phức tạp. Hãy yêu cầu AI: `"Review lại rule BIZ-005 trong domain/ xem logic này đã cover chưa"`.

### 2. Mọi thứ bắt đầu từ Stage trước

- Bạn ở Stage 3? Đừng code nếu Stage 2 chưa sign-off.
- Bạn ở Stage 2? Đọc kỹ output của Stage 1 tại `workspaces/ba/domain/`.

### 3. Quy trình PR "3 tầng lọc"

1. **Tầng 1 (Lint/Test)**: CI tự chạy. Đỏ là sửa, không giải thích.
2. **Tầng 2 (AI Review)**: Agent `ci-reviewer` sẽ soi diff của bạn. Nếu nó bảo `LGTM=false`, hãy đọc kỹ lý do (thường là vi phạm `SAFETY.md`).
3. **Tầng 3 (Human)**: Đồng đội của bạn review và approve.

---

## 🛠️ Nhiệm vụ "Day 1" cho từng Role

| Role       | Nhiệm vụ đầu tiên                                                 |
| ---------- | ----------------------------------------------------------------- |
| **BA**     | Chạy `ba-parser` để AI đọc SRS → Kiểm tra `domain/scope.yaml`.    |
| **SA**     | Kiểm tra G1 đã sign-off chưa → Chạy `sa-designer` sinh OpenAPI.   |
| **Dev BE** | Kiểm tra contract OpenAPI → Chạy agent sinh Spring Boot scaffold. |
| **Dev FE** | Kiểm tra API mockup → Chạy agent sinh màn hình React tương ứng.   |
| **QA**     | Đọc Gherkin feature của BA → Sinh script Playwright/Pact.         |
| **DevOps** | Check Helm chart shared → Setup pipeline Tekton cho service mới.  |

---

## 🆘 Cần hỗ trợ?

1. Hỏi Claude: `@claude làm sao để chạy test cho module này?`
2. Check `make help` để xem các lệnh tắt.
3. Liên hệ lead của Stage tương ứng (xem `docs/GATEKEEPERS.md`).

**Chào mừng bạn gia nhập đội ngũ "Gatekeepers"!** 🚀
