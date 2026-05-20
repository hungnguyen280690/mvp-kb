package com.kb.ltt.domain.exception;

import com.kb.ltt.domain.model.PayOrderStatus;

/**
 * Thrown when a state-machine action is invoked on an order that is not in
 * the expected source status.
 * Code: MSG-ERR-STATUS
 */
public class InvalidStatusTransitionException extends BusinessException {

    private final PayOrderStatus fromStatus;
    private final String action;

    public InvalidStatusTransitionException(PayOrderStatus fromStatus, String action) {
        super("MSG-ERR-STATUS",
                String.format("Cannot perform action '%s' on a PayOrder in status '%s'",
                        action, fromStatus));
        this.fromStatus = fromStatus;
        this.action = action;
    }

    public PayOrderStatus getFromStatus() {
        return fromStatus;
    }

    public String getAction() {
        return action;
    }
}
