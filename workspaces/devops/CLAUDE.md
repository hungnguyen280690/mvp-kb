# Workspace: DevOps — SRE / Platform (Stage 5)

Workspace cho **Tekton + ArgoCD + observability** trên OpenShift on-prem.

## Vai trò

Pipeline build → test → scan → sign → deploy. ArgoCD sync auto dev/uat, manual prod.

## Bắt đầu

```bash
cd /home/hung/mvp-kho-bac/workspaces/devops
test -f ../../gates/G4-test-signoff.md || echo "❌ G4 chưa sign-off"
claude code .
# > devops-builder
```

## Đọc trước

- [Root CLAUDE.md](../../CLAUDE.md)
- [docs/QUALITY_GATES.md](../../docs/QUALITY_GATES.md)
- [docs/SAFETY.md § OpenShift](../../docs/SAFETY.md)
- [docs/branch-protection-setup.md](../../docs/branch-protection-setup.md)
- **Dev**: `../dev-be/services/*/Dockerfile`, Helm values

## Output bắt buộc

```
.tekton/
├── build-pipeline.yaml
├── deploy-pipeline.yaml
└── promote-pipeline.yaml

deploy/
├── argocd/
│   ├── projects/vdbas.yaml
│   └── apps/
│       ├── *-dev.yaml          (auto sync)
│       ├── *-uat.yaml          (auto sync)
│       └── *-prod.yaml         (manual sync, gate ✋)
└── helm/
    ├── _shared/values-{dev,uat,prod}.yaml
    └── <service>/

observability/
├── otel-collector.yaml
├── grafana-dashboard.json
├── alerts.yaml                  SLO-based
└── runbook/
    ├── outbox-stuck.md
    ├── mq-down.md
    └── gl-failed-dlq.md
```

## Quy tắc

- **GitOps only** — không kubectl edit prod
- **Cosign sign** mọi image — keyless OIDC
- **Image scan Trivy** — block HIGH/CRITICAL
- **Prod sync manual** — không bao giờ auto
- **Namespace boundary** — cấm thao tác `openshift-*`, `kube-*`, `default`

## Agent & Plugin hỗ trợ

- **Plugin `kubernetes-operations`**:
  - **Kỹ năng**: Thao tác `oc` (OpenShift), `kubectl`, `helm`, kiểm tra log và status của pod.
  - **Cách dùng**: Yêu cầu Claude `"Check status của pod bff-service trên namespace dev"`.
- **Agent `devops-builder`**:
  - **Cách gọi**: `> devops-builder`
  - **Kỹ năng**: Sinh Helm charts, Tekton YAML và Grafana dashboards.
- **Plugin `superpowers`**:
  - **Ứng dụng**: Quản lý ArgoCD App YAML và kiểm tra tính nhất quán của Helm values.

## Output Paths

Tất cả artifacts viết vào: `features/{{FEATURE_NAME}}/` và `deploy/`/`.tekton/`/`observability/`

- [05-runbook.md]: `features/{{FEATURE_NAME}}/05-runbook.md`
- deploy/: `deploy/` (workspace-local)
- .tekton/: `.tekton/` (workspace-local)
- observability/: `observability/` (workspace-local)

## Nhiệm vụ trọng tâm (Day 1)

1. Verify G4 sign-off.
2. Chạy `devops-builder` để khởi tạo pipeline Tekton.
3. Kiểm tra kết nối tới Oracle và IBM MQ trên môi trường Dev.

## KHÔNG được làm

- Sửa CI workflow sau merge mà không qua review
- Skip cosign sign
- Disable security scan
- Push image trực tiếp lên prod registry
