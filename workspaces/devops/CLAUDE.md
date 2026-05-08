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

## Agent có sẵn

- `devops-builder` *(sẽ tạo)*
- Plugin `kubernetes-operations` (từ wshobson/agents)

## KHÔNG được làm

- Sửa CI workflow sau merge mà không qua review
- Skip cosign sign
- Disable security scan
- Push image trực tiếp lên prod registry
