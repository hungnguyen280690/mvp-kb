---
name: project-structure
status: active
owner: repo-admin
---

# Project Structure — Single Source of Truth

> Mọi agent, script, CI phải đọc file này để biết cấu trúc hợp lệ.
> Thay đổi cấu trúc → đề xuất qua Gate plan → human duyệt → cập nhật file này.

## Folder Registry

| Path                        | Agent | Gate | Required | Description                              |
| --------------------------- | ----- | ---- | -------- | ---------------------------------------- |
| `features/`                 | BA    | G1   | yes      | Đặc tả nghiệp vụ `.md` từ con người      |
| `features/TEMPLATE.md`      | BA    | G1   | yes      | Template bắt buộc cho mọi đặc tả         |
| `contracts/`                | SA    | G2   | yes      | OpenAPI specs do SA sinh                 |
| `backend/`                  | Dev   | G3   | no       | Java Spring Boot (sinh sau G2)           |
| `frontend/`                 | Dev   | G3   | no       | React app (sinh sau G2)                  |
| `gates/`                    | All   | All  | yes      | Gate plans + signoffs                    |
| `docs/`                     | Human | —    | yes      | Tài liệu cốt lõi, không tự sửa bởi agent |
| `docs/CONTEXT.md`           | All   | —    | yes      | Từ điển thuật ngữ nghiệp vụ              |
| `docs/ARCHITECTURE.md`      | SA    | —    | yes      | Tech stack + DB Schema (frozen)          |
| `docs/CONVENTIONS.md`       | All   | —    | yes      | Quy ước naming                           |
| `docs/RULES.md`             | All   | —    | yes      | Luật chất lượng, bảo mật                 |
| `docs/WORKFLOW.md`          | All   | —    | yes      | Mô tả luồng 3 bước                       |
| `docs/project-structure.md` | Human | —    | yes      | File này — định nghĩa cấu trúc           |
| `scripts/`                  | Human | —    | yes      | Setup, verify, install scripts           |
| `.github/`                  | Human | —    | yes      | CI/CD, CODEOWNERS, branch rules          |
| `.github/workflows/`        | Human | —    | yes      | GitHub Actions                           |
| `.github/rulesets/`         | Human | —    | yes      | Branch protection rules                  |
| `workspaces/`               | All   | —    | yes      | Virtual workspace cho 3 agent            |
| `workspaces/ba/`            | BA    | G1   | yes      | BA agent config                          |
| `workspaces/sa/`            | SA    | G2   | yes      | SA agent config                          |
| `workspaces/dev/`           | Dev   | G3   | yes      | Dev agent config                         |

## Rules

1. **Gate scope**: Agent chỉ được tạo/sửa path trong phạm vi Gate của mình.
   - BA → `features/` (chỉ đọc, không tự sửa file MD của human)
   - SA → `contracts/` (sinh OpenAPI), đề xuất `backend/` layout trong plan
   - Dev → `backend/`, `frontend/` (code trong cấu trúc SA đã duyệt)
2. **New path**: Mọi thư mục/file mới phải đề xuất qua Gate plan → human gõ "Duyệt" → cập nhật bảng trên.
3. **Frozen paths**: `docs/ARCHITECTURE.md` (DB schema) và `docs/project-structure.md` (file này) — chỉ human sửa.
4. **Verification**: `scripts/verify-env.sh` đọc bảng trên để kiểm tra folder tồn tại.
5. **Agent isolation**: Agent chạy từ `workspaces/<role>/`, dùng `../../` trỏ về root. Không truy cập workspace của agent khác.

## Change Log

| Date       | Agent   | Change                          | Approved by      |
| ---------- | ------- | ------------------------------- | ---------------- |
| 2026-05-14 | Initial | Bootstrap 3-agent MVP structure | hungnguyen280690 |
