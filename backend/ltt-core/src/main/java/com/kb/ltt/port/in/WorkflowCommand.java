package com.kb.ltt.port.in;

/**
 * Command record cho workflow actions (check-approve, approve).
 */
public record WorkflowCommand(
        String id,
        long expectedVersion,
        String userId,
        String userIp
) {}
