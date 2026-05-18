package com.kb.ltt.api.exception;

import com.kb.ltt.domain.model.enums.OrderStatus;

public class InvalidStateTransitionException extends BusinessException {

    public InvalidStateTransitionException(OrderStatus from, String action) {
        super("MSG-ERR-STATUS",
                String.format("Khong the thuc hien [%s] khi giao dich dang o trang thai [%s]", action, from));
    }
}
