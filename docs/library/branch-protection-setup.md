# Branch Protection Setup — One-time

Hướng dẫn cấu hình GitHub branch protection để khớp với `CODEOWNERS` + `ci.yml` + `QUALITY_GATES.md`. Làm 1 lần khi tạo repo, sau đó pipeline tự enforce.

## Yêu cầu

- Repo đã push lên GitHub
- Bạn là repo admin (hoặc có quyền `manage repository`)
- Cài `gh` CLI: `brew install gh` / `apt install gh`
- Đăng nhập: `gh auth login`

## Bước 1 — Bật ruleset chính cho `main`

Tạo file `.github/rulesets/main.json`:

```json
{
  "name": "main-protected",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "required_signatures" },
    { "type": "required_linear_history" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": true,
        "require_last_push_approval": true,
        "required_review_thread_resolution": true
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "Static checks" },
          { "context": "Unit test (Java)" },
          { "context": "Unit test (React)" },
          { "context": "Integration test (Oracle + IBM MQ)" },
          { "context": "Contract test (Pact)" },
          { "context": "SAST (Semgrep)" },
          { "context": "Dependency scan (Trivy)" },
          { "context": "E2E test (Playwright)" },
          { "context": "Claude AI reviewer" }
        ]
      }
    }
  ],
  "bypass_actors": []
}
```

Apply:
```bash
gh api --method POST \
  /repos/{OWNER}/{REPO}/rulesets \
  --input .github/rulesets/main.json
```

## Bước 2 — Bật auto-merge

Repo settings → General → tick:
- ✅ Allow auto-merge
- ✅ Automatically delete head branches
- ✅ Allow squash merging (default)
- ❌ Allow merge commits
- ❌ Allow rebase merging

CLI tương đương:
```bash
gh api --method PATCH /repos/{OWNER}/{REPO} \
  -f allow_auto_merge=true \
  -f delete_branch_on_merge=true \
  -f allow_squash_merge=true \
  -f allow_merge_commit=false \
  -f allow_rebase_merge=false
```

## Bước 3 — Required signed commits

Bắt buộc commit có GPG/SSH signature (audit trail). Đã có trong ruleset (`required_signatures`).

Mỗi dev cấu hình local:
```bash
git config --global user.signingkey <KEY_ID>
git config --global commit.gpgsign true
git config --global tag.gpgsign true
```

## Bước 4 — Secret cho CI

Repo Settings → Secrets and variables → Actions:

| Secret | Mục đích |
|---|---|
| `ANTHROPIC_API_KEY` | Cho `claude-review` job |
| `REGISTRY_USER` | Push image tới registry KBNN |
| `REGISTRY_PASS` | - |
| `COSIGN_PASSWORD` | Nếu dùng cosign keyed (không cần với keyless OIDC) |
| `PACT_BROKER_URL` | Pact broker (nếu có) |
| `PACT_BROKER_TOKEN` | - |
| `SLACK_WEBHOOK` | Notify pipeline events |
| `SONAR_TOKEN` | Optional — nếu dùng SonarQube nội bộ |

CLI:
```bash
gh secret set ANTHROPIC_API_KEY --body "sk-ant-..."
gh secret set REGISTRY_USER --body "ci-bot"
# ...
```

## Bước 5 — Team & permission

Tạo các team trong GitHub Org tương ứng `CODEOWNERS`:

| Team | Member |
|---|---|
| `@tech-lead` | Tech lead chính |
| `@ba-lead` | BA lead |
| `@sa-lead` | Solution architect |
| `@backend-lead` | Senior Java |
| `@frontend-lead` | Senior FE |
| `@dba-lead` | Oracle DBA |
| `@qa-lead` | Test architect |
| `@sre-lead` | SRE / DevOps |
| `@security-lead` | AppSec |
| `@repo-admin` | Admin (super-set) |

Permission: `Write` cho team, `Admin` chỉ cho `@repo-admin`.

```bash
gh api --method PUT /orgs/{ORG}/teams/tech-lead/repos/{ORG}/{REPO} -f permission=write
# ...
```

## Bước 6 — Auto-merge labels

Tạo 3 label:

```bash
gh label create "auto-merge" --description "Trigger auto-merge khi tất cả gate pass" --color 0E8A16
gh label create "breaking-change-approved" --description "Breaking OpenAPI change đã được G2 approve" --color D93F0B
gh label create "needs-human" --description "Claude reviewer không kết luận được, cần human" --color FBCA04
```

## Bước 7 — Test branch protection

PR test:
```bash
git checkout -b test/branch-protection
echo "test" > /tmp/test.txt
git add /tmp/test.txt
git commit -m "test" --no-gpg-sign  # SẼ FAIL nếu protection đúng
```

Expect: pre-commit hook chặn vì commit không sign.

## Quy tắc tuyệt đối — đừng đổi sau

1. **Không tắt branch protection** dù tạm thời "để fix gấp"
2. **Không add bypass actor** — kể cả admin
3. **Không skip required check** — nếu CI sai, fix CI, không bypass
4. **Mọi thay đổi ruleset** phải qua PR — file `.github/rulesets/main.json` được CODEOWNERS bảo vệ
5. **Audit định kỳ** — mỗi quý xem lại có ai bypass không

## Kiểm tra hiện trạng

```bash
# Xem ruleset hiện tại
gh api /repos/{OWNER}/{REPO}/rulesets

# Xem branch protection cũ kiểu (nếu chưa migrate sang ruleset)
gh api /repos/{OWNER}/{REPO}/branches/main/protection

# Liệt kê PR đang chờ check
gh pr list --json number,title,statusCheckRollup,reviewDecision
```

## Khi GitLab / Gitea thay vì GitHub

- **GitLab**: dùng "Push Rules" + "Approval Rules" + Protected Branches. Cấu trúc YAML khác nhưng concept tương tự.
- **Gitea**: branch protection settings UI. Cần plugin cho signed commit.
- **OpenShift Pipelines (Tekton)** thay GitHub Actions — pipeline khác file nhưng vẫn dùng `claude-review` task tương tự.
