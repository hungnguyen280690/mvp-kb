package com.kb.ltt.port.in;

/**
 * Command record cho return/reject actions.
 */
public record ReturnRejectCommand(
        String id,
        long expectedVersion,
        String userId,
        String userIp,
        String reason
) {}
