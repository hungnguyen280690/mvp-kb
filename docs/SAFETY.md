# Safety Policy — Hành vi cấm trong codebase

File này định nghĩa **hành vi cấm tuyệt đối** với cả người và AI agent. Vi phạm dù 1 lần đều block PR và mở post-mortem.

> **Tham chiếu kỹ thuật**: deny list cụ thể trong [`.claude/settings.json`](../.claude/settings.json). File này là phần **giải thích** — tại sao cấm và làm sao thay thế.

---

## 🔴 Cấp độ 1 — TUYỆT ĐỐI KHÔNG (block ngay)

| Hành vi | Vì sao cấm | Thay bằng |
|---|---|---|
| `rm -rf /`, `rm -rf ~`, `rm -rf $HOME` | Xoá toàn bộ hệ thống / home | Xoá đúng path tương đối, có confirm |
| `sudo *` mọi loại | Quyền root → mất kiểm soát | Yêu cầu admin chạy thủ công nếu cần |
| `git push --force` lên `main`/`master` | Mất commit của người khác | `git push --force-with-lease` lên branch riêng |
| `git reset --hard origin/main` (khi có local commit) | Mất commit chưa push | `git stash` rồi `git pull --rebase` |
| `curl X | sh`, `wget Y | bash` | Chạy code không kiểm tra → supply chain attack | Tải về, kiểm tra hash, rồi mới chạy |
| `chmod 777` | Mở quyền cho mọi user | `chmod 644/755` đúng vai trò |
| Commit `.env`, `.pem`, `.key`, `id_rsa` | Lộ secret → revoke khẩn cấp | Vault/External Secrets, `.gitignore` |
| Edit `db/migrations/V*__*.sql` đã merge | Migration là **forward-only**, sửa lại = lệch DB prod | Tạo migration mới `V{N+1}__fix.sql` |
| Sửa `gates/G*-signoff.md` đã ký | Phá audit trail, gian lận quy trình | Tạo gate mới `G{N}-v2-signoff.md` |
| Disable test / `@Ignore` để CI xanh | Bypass quality gate | Fix test hoặc xoá test với approval G4 |
| Hard-code credential trong code | Lộ + không revoke được | Inject qua env / Vault |

## 🟠 Cấp độ 2 — KHÔNG ĐƯỢC PHÉP (cần approval đặc biệt)

| Hành vi | Vì sao | Approval cần |
|---|---|---|
| Drop/truncate bảng | Mất dữ liệu | G2 (SA) + DBA |
| Sửa cấu hình `oc/kubectl` namespace `openshift-*`, `kube-*`, `default` | Hệ thống lõi cluster | G5 (SRE) |
| `oc patch --force`, `--grace-period=0` | Bypass safe deletion | G5 (SRE) |
| Push image lên prod registry | Có thể chạy ngay prod | G5 + cosign signed |
| Disable security scanner / SAST rule | Có thể che lỗ hổng | G2 + lý do file `docs/security-exception.md` |
| Sửa branch protection rule | Phá quy trình review | Repo admin + log change |
| `npm install -g` global | Ô nhiễm máy người khác | Dùng project-local hoặc `npx` |
| Modify CI workflow `*-prod.yml` | Có thể bypass gate prod | G5 (SRE) + 2 reviewer |
| Tắt feature flag prod không qua quy trình | Mất kiểm soát rollout | Thông qua dashboard FF, không edit code |

## 🟡 Cấp độ 3 — CẢNH BÁO (nên tránh, log lại)

| Hành vi | Vì sao tránh |
|---|---|
| `git commit --no-verify` | Bỏ pre-commit hook → có thể commit junk |
| `git rebase -i` trên branch shared | Người khác đang base trên đó |
| Edit code trực tiếp trên prod (kubectl edit) | Drift khỏi GitOps |
| Sửa file generated (OpenAPI codegen output) | Sẽ bị overwrite lần sau, sửa nguồn |
| Comment-out code thay vì xoá | Tích luỹ rác |
| `TODO` không có ticket / owner | Trở thành nợ vĩnh viễn |
| Catch `Exception` rồi swallow | Che lỗi runtime |
| `printStackTrace()` trong code prod | Log không structured, lộ thông tin |

---

## 🛡️ Quy tắc dữ liệu nhạy cảm (KBNN domain)

1. **Không bao giờ log số tài khoản đầy đủ** — mask 4 số đầu/cuối: `1234****5678`.
2. **Không log số CMND/CCCD** — chỉ log hash SHA-256.
3. **Không log số tiền** trong DEBUG log — chỉ ở INFO/AUDIT có structured field.
4. **Không expose `internal/*` API ra ngoài Route OpenShift** — chỉ ClusterIP.
5. **Không gửi email/notify chứa nội dung LTT chi tiết** — chỉ link tới UI có auth.
6. **Audit log không xoá / không sửa** — mọi thay đổi là append.
7. **Hash chain audit** không được ghi đè previous hash — phát hiện vi phạm = alert ngay.

## 🔐 Quy tắc với AI agent

1. **Không tự duyệt PR** mà agent tự tạo. Cần reviewer agent độc lập + người.
2. **Không bypass gate** Stage trước chưa sign-off → không bắt đầu Stage sau.
3. **Không sửa file gate signoff** — chỉ tạo signoff mới.
4. **Không commit thay người** — nếu cần commit, luôn ghi `Co-Authored-By: Claude <noreply@anthropic.com>`.
5. **Không tự khai báo tool mới** vào allowlist `settings.json` — yêu cầu người sửa.
6. **Không đọc file ngoài working directory** trừ khi user chỉ định.
7. **Không gọi API ngoài** ngoài whitelist `WebFetch(domain:*)`.
8. **Không tạo file `.md` rác** (planning, decisions, summary) trừ khi user yêu cầu — làm việc từ context conversation.

## ⚠️ Quy trình khi vi phạm

1. **CI tự block** PR nếu detect vi phạm cấp 1 (qua `git secrets` + `gitleaks` + custom check)
2. **Log vào `audit/violations.log`** (kèm user, time, command)
3. **Notify gatekeeper liên quan** trong < 5 phút
4. **Post-mortem** trong 24h nếu cấp 1 lọt vào main
5. **Update SAFETY.md** nếu phát hiện loại vi phạm mới

## 📋 Checklist trước commit (auto qua pre-commit hook)

- [ ] Không có file `.env`, `.pem`, `.key`
- [ ] Không có credential hard-code (regex check)
- [ ] Không có `console.log` hoặc `printStackTrace` trong code prod
- [ ] Migration file mới (không sửa file đã merge)
- [ ] Test xanh local
- [ ] Lint pass
- [ ] OpenAPI khớp với code (nếu có)
