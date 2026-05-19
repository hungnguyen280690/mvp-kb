package com.kb.ltt.domain.exception;

import com.kb.ltt.domain.enums.OrderStatus;
import lombok.Getter;

/**
 * Nem ra khi state machine transition khong hop le.
 * HTTP 409 MSG-ERR-STATUS.
 */
@Getter
public class InvalidStateTransitionException extends RuntimeException {

    private final OrderStatus fromStatus;
    private final OrderStatus toStatus;

    public InvalidStateTransitionException(OrderStatus fromStatus, OrderStatus toStatus) {
        super(String.format("Invalid state transition: cannot go from '%s' to '%s'",
                fromStatus, toStatus));
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
    }

    public InvalidStateTransitionException(OrderStatus fromStatus, OrderStatus toStatus, String detail) {
        super(String.format("Invalid state transition: cannot go from '%s' to '%s' - %s",
                fromStatus, toStatus, detail));
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
    }
}
