---
name: safety
status: active
owner: repo-admin
---

# Safety Rules — Quy tắc Bảo vệ Dự án

> File này là nguồn chân lý cho mọi quy tắc bảo vệ.
> Pre-commit hooks và CI AI Reviewer triển khai theo file này.
> Sửa file này → cập nhật tương ứng trong `.pre-commit-config.yaml` và `.github/workflows/ci.yml`.

## Cấp 1 — BLOCKING (Chặn tuyệt đối)

Vi phạm cấp 1 = commit bị từ chối, PR không thể merge.

| ID   | Quy tắc                                                                | Enforced by                           |
| ---- | ---------------------------------------------------------------------- | ------------------------------------- |
| S1.1 | Không hard-code credential (`password`, `secret`, `token`, `api_key`)  | pre-commit: `forbid-secrets-pattern`  |
| S1.2 | Không commit private key (`.pem`, `.key`)                              | pre-commit: `detect-private-key`      |
| S1.3 | Không lộ secret qua gitleaks (API key, connection string)              | pre-commit: `gitleaks`                |
| S1.4 | Không sửa DB migration đã merge (`backend/db/migrations/V*__*.sql`)    | pre-commit: `forbid-migration-edit`   |
| S1.5 | Không sửa Gate signoff (`gates/G*-signoff.md`)                         | pre-commit: `forbid-gates-edit`       |
| S1.6 | Không xóa/sửa file quy tắc lõi (`docs/RULES.md`, `docs/SAFETY.md`)     | CI: AI Reviewer                       |
| S1.7 | Không dùng lệnh nguy hiểm trong code (`rm -rf`, `sudo`)                | CI: AI Reviewer                       |
| S1.8 | Không bypass test (`@Disabled` trong Java, `.skip()` trong JS)         | CI: AI Reviewer                       |
| S1.9 | Không commit file môi trường (`.env`, `.env.local`, `.env.production`) | pre-commit: `gitleaks` + `.gitignore` |

## Cấp 2 — WARNING (Cảnh báo)

Vi phạm cấp 2 = PR được gắn cảnh báo, không chặn merge nhưng yêu cầu giải trình.

| ID   | Quy tắc                                                                      | Enforced by                     |
| ---- | ---------------------------------------------------------------------------- | ------------------------------- |
| S2.1 | Code thêm > 50 dòng phải có test đi kèm                                      | CI: AI Reviewer                 |
| S2.2 | Không để debug code (`console.log`, `printStackTrace`, `System.out.println`) | CI: AI Reviewer                 |
| S2.3 | Không dùng hedge phrases trong tài liệu chính thức                           | pre-commit: `hedge-phrase-scan` |
| S2.4 | File `.md` trong `features/` phải có front-matter đúng format                | pre-commit: `doc-front-matter`  |

## Thay đổi Quy tắc

1. Đề xuất sửa/xoá quy tắc → tạo PR với label `safety-change`.
2. Pre-commit hooks phải cập nhật đồng thời khi sửa cấp 1.
3. Chỉ repo-admin được merge thay đổi file này.
