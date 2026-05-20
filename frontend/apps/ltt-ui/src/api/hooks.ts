import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { payOutManualApi, type ListParams } from "./pay-out-manual";

export const queryKeys = {
  list: (params: ListParams) => ["pay-out-manual", "list", params] as const,
  detail: (id: string) => ["pay-out-manual", "detail", id] as const,
  attachments: (id: string) => ["pay-out-manual", "attachments", id] as const,
  auditLog: (id: string) => ["pay-out-manual", "audit-log", id] as const,
  approvalStatus: (id: string) =>
    ["pay-out-manual", "approval-status", id] as const,
};

export function usePayOrderList(params: ListParams) {
  return useQuery({
    queryKey: queryKeys.list(params),
    queryFn: () => payOutManualApi.list(params).then((r) => r.data),
  });
}

export function usePayOrderDetail(id: string) {
  return useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: () => payOutManualApi.getById(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function usePayOrderAttachments(id: string) {
  return useQuery({
    queryKey: queryKeys.attachments(id),
    queryFn: () => payOutManualApi.listAttachments(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useApprovalStatus(id: string) {
  return useQuery({
    queryKey: queryKeys.approvalStatus(id),
    queryFn: () => payOutManualApi.getApprovalStatus(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useAuditLog(id: string) {
  return useQuery({
    queryKey: queryKeys.auditLog(id),
    queryFn: () => payOutManualApi.getAuditLog(id).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreatePayOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: payOutManualApi.create,
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["pay-out-manual", "list"] }),
  });
}

export function useSubmitPayOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      comment,
    }: {
      id: string;
      version: number;
      comment?: string;
    }) => payOutManualApi.submit(id, version, comment),
    onSuccess: (_data, { id }) =>
      qc.invalidateQueries({ queryKey: queryKeys.detail(id) }),
  });
}

export function useWorkflowAction(
  action: "checkApprove" | "approve" | "return" | "reject",
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      version,
      reasonOrComment,
    }: {
      id: string;
      version: number;
      reasonOrComment?: string;
    }) => {
      if (action === "checkApprove")
        return payOutManualApi.checkApprove(id, version, reasonOrComment);
      if (action === "approve")
        return payOutManualApi.approve(id, version, reasonOrComment);
      if (action === "return")
        return payOutManualApi.return(id, version, reasonOrComment!);
      return payOutManualApi.reject(id, version, reasonOrComment!);
    },
    onSuccess: (_data, { id }) =>
      qc.invalidateQueries({ queryKey: queryKeys.detail(id) }),
  });
}

export function useDeletePayOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      reason,
      version,
    }: {
      id: string;
      reason: string;
      version: number;
    }) => payOutManualApi.delete(id, reason, version),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["pay-out-manual", "list"] }),
  });
}

export function useLookup(type: string, q?: string) {
  return useQuery({
    queryKey: ["lookup", type, q],
    queryFn: () => payOutManualApi.lookup(type, q).then((r) => r.data),
    staleTime: 5 * 60 * 1000, // 5 min cache
  });
}
