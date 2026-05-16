# 🎭 Cẩm nang Chi tiết: Vai DevOps (SRE) — Stage 5

## 🎯 Sứ mệnh

Đưa ứng dụng lên "mây" (OpenShift) một cách an toàn và bền bỉ. Bạn là người cuối cùng nắm giữ chìa khóa Production.

---

## 🛠️ Công cụ AI của bạn

### 1. Agent: `devops-builder`

- **Kích hoạt:** Gõ `> devops-builder`.
- **Nhiệm vụ:** Sinh Helm Chart, Tekton Pipeline, và các cấu hình ArgoCD.

### 2. Plugin: `kubernetes-operations`

- **Mục đích:** Điều khiển cụm OpenShift mà không cần thuộc lệnh.
- **Lệnh mẫu:**
  - `@k8s-ops kiểm tra tại sao Pod 'integration-gateway' liên tục bị OOMKilled (hết ram).`
  - `@k8s-ops scale deployment 'bff-service' lên 5 replicas trên namespace prod.`
  - `@k8s-ops show log của pod bff, lọc ra các lỗi liên quan đến kết nối Oracle.`

### 3. Plugin: `superpowers`

- **Mục đích:** Quản lý cấu hình tập trung.
- **Lệnh mẫu:**
  - `@superpowers kiểm tra sự khác biệt giữa values-dev.yaml và values-prod.yaml của service core.`

---

## 🔄 Quy trình làm việc (Step-by-Step)

### Bước 1: Thiết lập Pipeline

Yêu cầu Claude:

> "Dùng agent `devops-builder` sinh file `.tekton/build-pipeline.yaml`. Pipeline phải bao gồm: Build Maven -> Scan Trivy -> Sign image bằng Cosign -> Push vào OCP Registry."

### Bước 2: Cấu hình GitOps (ArgoCD)

> "Tạo các ứng dụng ArgoCD trong `deploy/argocd/apps/`. Cấu hình auto-sync cho môi trường DEV và UAT, nhưng giữ manual-sync cho PROD."

### Bước 3: Giám sát & Cảnh báo (OTel)

> "Sinh file `observability/alerts.yaml`. Thiết lập cảnh báo nếu tỉ lệ lỗi 5xx vượt quá 1% trong vòng 5 phút."

### Bước 4: Kiểm tra Hạ tầng thực tế

Sử dụng plugin `k8s-ops`:

> "@k8s-ops kiểm tra xem các NetworkPolicy đã được áp dụng đúng chưa? BFF có bị chặn truy cập trực tiếp vào DB Oracle không? (Chỉ CORE mới được vào DB)."

### Bước 5: Viết Runbook (Cẩm nang xử lý sự cố)

> "Dựa trên thiết kế Saga, hãy viết Runbook xử lý khi 'Lệnh bị kẹt ở trạng thái SENT nhưng không nhận được ACK từ NHNN'."

### Bước 6: Ký duyệt (Sign-off)

> "Xác nhận hạ tầng đã sẵn sàng, các Secret đã được quản lý an toàn trong Vault. Tạo file `gates/G5-devops-signoff.md`."

---

## ⚠️ Lưu ý tử huyệt

1. **NO MANUAL EDIT:** Cấm tuyệt đối việc dùng `oc edit` trên Production. Mọi thứ phải qua Git (GitOps).
2. **SECRET SAFETY:** Đảm bảo không có password nào nằm trong file YAML (dùng SealedSecrets hoặc Vault).
3. **IMAGE SIGNING:** Không bao giờ deploy một image không có chữ ký số (Cosign sign).
