# Gate G5 — DevOps Sign-off

## Thông tin

- **Gate**: G5 — Stage 5 (DevOps)
- **Reviewer**: DevOps / SRE Lead
- **Ngày ký**: 2026-05-10
- **Trạng thái**: ✅ APPROVED

## Artifacts đã review

| File | Trạng thái |
|------|-----------|
| `.tekton/build-pipeline.yaml` (build → scan → sign) | ✅ Đạt |
| `.tekton/deploy-pipeline.yaml` (helm → argocd → smoke) | ✅ Đạt |
| `.tekton/promote-pipeline.yaml` (manual prod approval) | ✅ Đạt |
| `deploy/argocd/projects/vdbas.yaml` | ✅ Đạt |
| `deploy/argocd/apps/*` (15 apps: 5 services × 3 env) | ✅ Đạt |
| `deploy/helm/_shared/values-{dev,uat,prod}.yaml` | ✅ Đạt |
| `deploy/helm/{bff,ltt-service,gateway-service,audit-service,frontend}/` | ✅ Đạt |
| `observability/otel-collector.yaml` | ✅ Đạt |
| `observability/grafana-dashboard.json` (12 panels) | ✅ Đạt |
| `observability/alerts.yaml` (9 SLO rules) | ✅ Đạt |
| `observability/runbook/outbox-stuck.md` | ✅ Đạt |
| `observability/runbook/mq-down.md` | ✅ Đạt |
| `observability/runbook/gl-failed-dlq.md` | ✅ Đạt |

## Kiểm tra chính

- ✅ GitOps only — ArgoCD, không kubectl edit
- ✅ Cosign sign mọi image (keyless OIDC)
- ✅ Trivy scan block HIGH/CRITICAL
- ✅ Prod sync manual — 5 apps *-prod.yaml không auto sync
- ✅ Sync windows prod: Mon-Fri 08:00-18:00
- ✅ Security contexts: runAsNonRoot, readOnlyRootFilesystem, drop ALL
- ✅ Credentials qua secretRef (External Secrets Operator)
- ✅ 3 runbooks cho high-incident scenarios

---

**Ký duyệt**: ✅ G5 APPROVED — Pipeline sẵn sàng production.

**Chữ ký**: hungnguyen280690
**Ngày**: 2026-05-10
