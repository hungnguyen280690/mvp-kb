package com.kb.ltt.domain.service;

import com.kb.ltt.api.exception.InvalidStateTransitionException;
import com.kb.ltt.domain.model.enums.ApprovalAction;
import com.kb.ltt.domain.model.enums.OrderStatus;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

public final class StateMachine {

    private StateMachine() {}

    private static final Map<OrderStatus, Set<OrderStatus>> TRANSITIONS = new EnumMap<>(OrderStatus.class);

    static {
        TRANSITIONS.put(OrderStatus.DRAFT, EnumSet.of(
                OrderStatus.DRAFT,
                OrderStatus.READY_FOR_APPROVAL,
                OrderStatus.DELETED
        ));
        TRANSITIONS.put(OrderStatus.RETURNED_TO_MAKER, EnumSet.of(
                OrderStatus.DRAFT,
                OrderStatus.READY_FOR_APPROVAL,
                OrderStatus.DELETED
        ));
        TRANSITIONS.put(OrderStatus.READY_FOR_APPROVAL, EnumSet.of(
                OrderStatus.PENDING_APPROVER,
                OrderStatus.RETURNED_TO_MAKER,
                OrderStatus.REJECTED
        ));
        TRANSITIONS.put(OrderStatus.PENDING_APPROVER, EnumSet.of(
                OrderStatus.APPROVED,
                OrderStatus.RETURNED_TO_MAKER,
                OrderStatus.REJECTED
        ));
        TRANSITIONS.put(OrderStatus.APPROVED, EnumSet.of(
                OrderStatus.TRANSFERRED_TO_GL
        ));
        TRANSITIONS.put(OrderStatus.TRANSFERRED_TO_GL, EnumSet.of(
                OrderStatus.POSTED
        ));
        TRANSITIONS.put(OrderStatus.REJECTED, EnumSet.noneOf(OrderStatus.class));
        TRANSITIONS.put(OrderStatus.DELETED, EnumSet.noneOf(OrderStatus.class));
        TRANSITIONS.put(OrderStatus.POSTED, EnumSet.noneOf(OrderStatus.class));
    }

    public static void validateTransition(OrderStatus current, OrderStatus target) {
        Set<OrderStatus> allowed = TRANSITIONS.get(current);
        if (allowed == null || !allowed.contains(target)) {
            throw new InvalidStateTransitionException(current, "chuyen sang " + target);
        }
    }

    public static boolean canEdit(OrderStatus status) {
        return status == OrderStatus.DRAFT || status == OrderStatus.RETURNED_TO_MAKER;
    }

    public static boolean canDelete(OrderStatus status) {
        return status == OrderStatus.DRAFT || status == OrderStatus.RETURNED_TO_MAKER;
    }

    public static OrderStatus resolveTargetStatus(ApprovalAction action, OrderStatus current) {
        return switch (action) {
            case CHECK -> {
                if (current != OrderStatus.READY_FOR_APPROVAL) {
                    throw new InvalidStateTransitionException(current, "CHECK");
                }
                yield OrderStatus.PENDING_APPROVER;
            }
            case APPROVE -> {
                if (current != OrderStatus.PENDING_APPROVER) {
                    throw new InvalidStateTransitionException(current, "APPROVE");
                }
                yield OrderStatus.APPROVED;
            }
            case REJECT -> {
                if (current != OrderStatus.READY_FOR_APPROVAL && current != OrderStatus.PENDING_APPROVER) {
                    throw new InvalidStateTransitionException(current, "REJECT");
                }
                yield OrderStatus.REJECTED;
            }
            case RETURN -> {
                if (current != OrderStatus.READY_FOR_APPROVAL && current != OrderStatus.PENDING_APPROVER) {
                    throw new InvalidStateTransitionException(current, "RETURN");
                }
                yield OrderStatus.RETURNED_TO_MAKER;
            }
        };
    }
}
