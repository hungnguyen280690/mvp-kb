import { useState, useCallback, useRef } from "react";
import { OptimisticLockError } from "../api/error";

// ---------------------------------------------------------------------------
// ETag store — maps resource ID -> current ETag value
// ---------------------------------------------------------------------------

const etagStore = new Map<string, string>();

/**
 * Hook to manage ETag / If-Match for optimistic locking.
 *
 * - Stores the current ETag for each resource by ID.
 * - Provides `getIfMatchHeader(id)` to retrieve the stored ETag.
 * - Handles 409 Conflict (OptimisticLockError) by clearing stale ETags.
 */
export function useOptimisticLock() {
  const [, forceUpdate] = useState(0);

  const setEtag = useCallback((id: string, etag: string) => {
    etagStore.set(id, etag);
    forceUpdate((n) => n + 1);
  }, []);

  const getEtag = useCallback((id: string): string | undefined => {
    return etagStore.get(id);
  }, []);

  const getIfMatchHeader = useCallback((id: string): Record<string, string> => {
    const etag = etagStore.get(id);
    if (!etag) return {};
    return { "If-Match": etag };
  }, []);

  const removeEtag = useCallback((id: string) => {
    etagStore.delete(id);
    forceUpdate((n) => n + 1);
  }, []);

  const clearAll = useCallback(() => {
    etagStore.clear();
    forceUpdate((n) => n + 1);
  }, []);

  /**
   * Handle an OptimisticLockError (409).
   * Clears the stale ETag for the given resource so the next GET will fetch
   * a fresh version.
   */
  const handleConflict = useCallback(
    (error: unknown, id: string): OptimisticLockError | null => {
      if (error instanceof OptimisticLockError) {
        etagStore.delete(id);
        forceUpdate((n) => n + 1);
        return error;
      }
      return null;
    },
    [],
  );

  return {
    setEtag,
    getEtag,
    getIfMatchHeader,
    removeEtag,
    clearAll,
    handleConflict,
  };
}

// ---------------------------------------------------------------------------
// Per-component instance version
// ---------------------------------------------------------------------------

/**
 * Creates an optimistic lock manager tied to a specific resource ID.
 * Useful when a component deals with a single order.
 */
export function useOrderLock(orderId: string) {
  const lock = useOptimisticLock();
  const orderIdRef = useRef(orderId);
  orderIdRef.current = orderId;

  const setOrderEtag = useCallback(
    (etag: string) => lock.setEtag(orderIdRef.current, etag),
    [lock],
  );

  const getOrderEtag = useCallback(
    (): string | undefined => lock.getEtag(orderIdRef.current),
    [lock],
  );

  const getOrderIfMatch = useCallback((): string => {
    const etag = lock.getEtag(orderIdRef.current);
    return etag || "";
  }, [lock]);

  const handleOrderConflict = useCallback(
    (error: unknown): OptimisticLockError | null =>
      lock.handleConflict(error, orderIdRef.current),
    [lock],
  );

  return {
    setOrderEtag,
    getOrderEtag,
    getOrderIfMatch,
    handleOrderConflict,
    /** underlying general-purpose lock manager */
    lock,
  };
}

export default useOptimisticLock;
