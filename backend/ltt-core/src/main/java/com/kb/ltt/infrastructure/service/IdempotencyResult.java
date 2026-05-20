package com.kb.ltt.infrastructure.service;

/**
 * Result returned by {@link IdempotencyService#check}.
 *
 * @param shouldReplay    true  → caller should return cachedStatusCode / cachedBody immediately
 *                        false → caller should execute the request and then call store()
 * @param cachedStatusCode HTTP status of the original response (null when shouldReplay=false)
 * @param cachedBody       Response body of the original response (null when shouldReplay=false)
 */
public record IdempotencyResult(boolean shouldReplay,
                                Integer cachedStatusCode,
                                String cachedBody) {

    /** Sentinel for "proceed with execution". */
    public static final IdempotencyResult PROCEED = new IdempotencyResult(false, null, null);
}
