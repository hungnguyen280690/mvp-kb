import { useState, useEffect, useCallback, useRef } from "react";
import { payOutManualClient } from "../api/pay-out-manual-client";
import { useOptimisticLock } from "./useOptimisticLock";
import type {
  PayOutManual,
  PayOrderAttachment,
  AuditLogEntry,
  ApprovalStatusEntry,
  CreateOrderRequest,
  UpdateOrderRequest,
  DeleteOrderRequest,
  ListOrdersParams,
  ExportRequest,
  PageResponse,
  PayOrderListItem,
  OrderStatus,
} from "../types/pay-out-manual";
import { ApiError } from "../api/error";

// ---------------------------------------------------------------------------
// Generic async state helpers
// ---------------------------------------------------------------------------

interface QueryState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

interface MutationState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

function initialQuery<T>(): QueryState<T> {
  return { data: null, loading: false, error: null };
}

function initialMutation<T>(): MutationState<T> {
  return { data: null, loading: false, error: null };
}

// ---------------------------------------------------------------------------
// 1. useOrder — fetch a single order by ID
// ---------------------------------------------------------------------------

export function useOrder(id: string | null) {
  const [state, setState] = useState<QueryState<PayOutManual>>(initialQuery);
  const lock = useOptimisticLock();
  const abortRef = useRef<AbortController | null>(null);

  const fetchOrder = useCallback(async () => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const { data, etag } = await payOutManualClient.getById(id);
      if (controller.signal.aborted) return;
      lock.setEtag(id, etag);
      setState({ data, loading: false, error: null });
    } catch (err) {
      if (controller.signal.aborted) return;
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, [id, lock]);

  useEffect(() => {
    fetchOrder();
    return () => {
      abortRef.current?.abort();
    };
  }, [fetchOrder]);

  return {
    ...state,
    etag: id ? lock.getEtag(id) : undefined,
    refetch: fetchOrder,
  };
}

// ---------------------------------------------------------------------------
// 2. useOrders — fetch paginated list
// ---------------------------------------------------------------------------

export function useOrders(params: ListOrdersParams) {
  const [state, setState] =
    useState<QueryState<PageResponse<PayOrderListItem>>>(initialQuery);
  const paramsRef = useRef(params);
  paramsRef.current = params;
  const abortRef = useRef<AbortController | null>(null);

  const fetchList = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const data = await payOutManualClient.list(paramsRef.current);
      if (controller.signal.aborted) return;
      setState({ data, loading: false, error: null });
    } catch (err) {
      if (controller.signal.aborted) return;
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, []);

  useEffect(() => {
    fetchList();
    return () => {
      abortRef.current?.abort();
    };
  }, [
    fetchList,
    params.page,
    params.size,
    params.STATUS,
    params.CHANNEL,
    params.PAYMENT_DATE_FROM,
    params.PAYMENT_DATE_TO,
    params.AMOUNT_FROM,
    params.AMOUNT_TO,
    params.REF_NO,
    params.CREATED_BY,
    params.KBNN_ID,
    params.sort?.join(","),
  ]);

  return { ...state, refetch: fetchList };
}

// ---------------------------------------------------------------------------
// 3. useCreateOrder — mutation hook for creating a new order
// ---------------------------------------------------------------------------

export function useCreateOrder() {
  const [state, setState] =
    useState<MutationState<PayOutManual>>(initialMutation);

  const create = useCallback(
    async (data: CreateOrderRequest): Promise<PayOutManual> => {
      setState({ data: null, loading: true, error: null });
      try {
        const idempotencyKey = crypto.randomUUID();
        const result = await payOutManualClient.create(data, idempotencyKey);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, loading: false, error });
        throw err;
      }
    },
    [],
  );

  const reset = useCallback(() => setState(initialMutation()), []);

  return { ...state, create, reset };
}

// ---------------------------------------------------------------------------
// 4. useUpdateOrder — mutation with optimistic lock
// ---------------------------------------------------------------------------

export function useUpdateOrder() {
  const [state, setState] =
    useState<MutationState<PayOutManual>>(initialMutation);
  const lock = useOptimisticLock();

  const update = useCallback(
    async (id: string, data: UpdateOrderRequest): Promise<PayOutManual> => {
      setState({ data: null, loading: true, error: null });
      try {
        const etag = lock.getEtag(id) || "";
        const idempotencyKey = crypto.randomUUID();
        const result = await payOutManualClient.update(
          id,
          data,
          etag,
          idempotencyKey,
        );
        // After a successful update the version changes; we don't have the
        // new ETag here directly (the client method returns the body), so
        // we rely on the caller to refetch or we store a placeholder.
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        lock.handleConflict(err, id);
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, loading: false, error });
        throw err;
      }
    },
    [lock],
  );

  const reset = useCallback(() => setState(initialMutation()), []);

  return { ...state, update, reset };
}

// ---------------------------------------------------------------------------
// 5. useDeleteOrder — mutation for soft-delete
// ---------------------------------------------------------------------------

export function useDeleteOrder() {
  const [state, setState] =
    useState<MutationState<PayOutManual>>(initialMutation);
  const lock = useOptimisticLock();

  const deleteOrder = useCallback(
    async (id: string, data: DeleteOrderRequest): Promise<PayOutManual> => {
      setState({ data: null, loading: true, error: null });
      try {
        const etag = lock.getEtag(id) || "";
        const idempotencyKey = crypto.randomUUID();
        const result = await payOutManualClient.delete(
          id,
          data,
          etag,
          idempotencyKey,
        );
        lock.removeEtag(id);
        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        lock.handleConflict(err, id);
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, loading: false, error });
        throw err;
      }
    },
    [lock],
  );

  const reset = useCallback(() => setState(initialMutation()), []);

  return { ...state, deleteOrder, reset };
}

// ---------------------------------------------------------------------------
// 6. useWorkflowAction — submit / approve / return / reject / copy
// ---------------------------------------------------------------------------

type WorkflowActionType =
  | "submit"
  | "checkApprove"
  | "approve"
  | "return"
  | "reject"
  | "copy";

interface WorkflowActionParams {
  action: WorkflowActionType;
  id: string;
  reason?: string;
  comment?: string;
}

export function useWorkflowAction() {
  const [state, setState] =
    useState<MutationState<PayOutManual>>(initialMutation);
  const lock = useOptimisticLock();

  const execute = useCallback(
    async (params: WorkflowActionParams): Promise<PayOutManual> => {
      setState({ data: null, loading: true, error: null });
      const { action, id, reason, comment } = params;
      const idempotencyKey = crypto.randomUUID();
      const etag = lock.getEtag(id) || "";

      try {
        let result: PayOutManual;

        switch (action) {
          case "submit":
            result = await payOutManualClient.submit(id, etag, idempotencyKey);
            break;
          case "checkApprove":
            result = await payOutManualClient.checkApprove(
              id,
              etag,
              idempotencyKey,
              comment ? { COMMENT: comment } : undefined,
            );
            break;
          case "approve":
            result = await payOutManualClient.approve(
              id,
              etag,
              idempotencyKey,
              comment ? { COMMENT: comment } : undefined,
            );
            break;
          case "return":
            result = await payOutManualClient.returnOrder(
              id,
              reason || "",
              etag,
              idempotencyKey,
            );
            break;
          case "reject":
            result = await payOutManualClient.reject(
              id,
              reason || "",
              etag,
              idempotencyKey,
            );
            break;
          case "copy":
            result = await payOutManualClient.copy(id, idempotencyKey);
            break;
          default:
            throw new Error(`Unknown workflow action: ${action}`);
        }

        setState({ data: result, loading: false, error: null });
        return result;
      } catch (err) {
        lock.handleConflict(err, id);
        const error = err instanceof Error ? err : new Error(String(err));
        setState({ data: null, loading: false, error });
        throw err;
      }
    },
    [lock],
  );

  const reset = useCallback(() => setState(initialMutation()), []);

  return { ...state, execute, reset };
}

// ---------------------------------------------------------------------------
// 7. useExport — export trigger
// ---------------------------------------------------------------------------

export function useExport() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const exportOrders = useCallback(
    async (params: ExportRequest): Promise<Blob> => {
      setLoading(true);
      setError(null);
      try {
        const blob = await payOutManualClient.exportOrders(params);

        // Trigger browser download
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const extensions: Record<string, string> = {
          XLSX: "xlsx",
          PDF: "pdf",
          CSV: "csv",
        };
        const ext = extensions[params.FORMAT] || "bin";
        a.download = `pay-out-manual-export.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setLoading(false);
        return blob;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        setLoading(false);
        throw err;
      }
    },
    [],
  );

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return { loading, error, exportOrders, reset };
}

// ---------------------------------------------------------------------------
// 8. useAttachments — attachment CRUD for a specific order
// ---------------------------------------------------------------------------

export function useAttachments(orderId: string | null) {
  const [attachments, setAttachments] = useState<PayOrderAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAttachments = useCallback(async () => {
    if (!orderId) {
      setAttachments([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await payOutManualClient.listAttachments(orderId);
      setAttachments(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const upload = useCallback(
    async (
      file: File,
      docType: string,
      note?: string,
    ): Promise<PayOrderAttachment> => {
      if (!orderId) throw new Error("orderId is required");
      const result = await payOutManualClient.uploadAttachment(
        orderId,
        file,
        docType,
        note,
      );
      setAttachments((prev) => [...prev, result]);
      return result;
    },
    [orderId],
  );

  const download = useCallback(
    async (attachId: string): Promise<Blob> => {
      if (!orderId) throw new Error("orderId is required");
      return payOutManualClient.downloadAttachment(orderId, attachId);
    },
    [orderId],
  );

  const remove = useCallback(
    async (attachId: string): Promise<void> => {
      if (!orderId) throw new Error("orderId is required");
      await payOutManualClient.deleteAttachment(orderId, attachId);
      setAttachments((prev) => prev.filter((a) => a.ID !== attachId));
    },
    [orderId],
  );

  return {
    attachments,
    loading,
    error,
    refetch: fetchAttachments,
    upload,
    download,
    remove,
  };
}

// ---------------------------------------------------------------------------
// 9. useAuditLog — audit log for a specific order
// ---------------------------------------------------------------------------

export function useAuditLog(
  orderId: string | null,
  page?: number,
  size?: number,
) {
  const [state, setState] =
    useState<QueryState<PageResponse<AuditLogEntry>>>(initialQuery);

  const fetchAuditLog = useCallback(async () => {
    if (!orderId) {
      setState({ data: null, loading: false, error: null });
      return;
    }
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await payOutManualClient.getAuditLog(orderId, page, size);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, [orderId, page, size]);

  useEffect(() => {
    fetchAuditLog();
  }, [fetchAuditLog]);

  return { ...state, refetch: fetchAuditLog };
}

// ---------------------------------------------------------------------------
// 10. useApprovalStatus — workflow stepper data
// ---------------------------------------------------------------------------

export function useApprovalStatus(orderId: string | null) {
  const [steps, setSteps] = useState<ApprovalStatusEntry[]>([]);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!orderId) {
      setSteps([]);
      setCurrentStatus(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await payOutManualClient.getApprovalStatus(orderId);
      setSteps(result);
      // Derive current status from the last step
      if (result.length > 0) {
        setCurrentStatus(result[result.length - 1].TO_STATUS);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  return { steps, currentStatus, loading, error, refetch: fetchStatus };
}
