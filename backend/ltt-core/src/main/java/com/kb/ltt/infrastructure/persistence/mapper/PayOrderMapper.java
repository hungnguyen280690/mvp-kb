package com.kb.ltt.infrastructure.persistence.mapper;

import com.kb.ltt.domain.*;
import com.kb.ltt.domain.enums.*;
import com.kb.ltt.infrastructure.persistence.entity.*;
import org.mapstruct.*;

import java.util.List;

/**
 * MapStruct mapper: Domain PayOrder <-> JPA PayOrderEntity.
 * Bao gom lines, attachments, approvals.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PayOrderMapper {

    // ===== Domain -> Entity =====

    @Mapping(target = "lines", ignore = true)
    @Mapping(target = "attachments", ignore = true)
    @Mapping(target = "approvals", ignore = true)
    PayOrderEntity toEntity(PayOrder domain);

    @Mapping(target = "order", ignore = true)
    PayOrderLineEntity toLineEntity(PayOrderLine domain);

    @Mapping(target = "order", ignore = true)
    PayOrderAttachmentEntity toAttachmentEntity(PayOrderAttachment domain);

    @Mapping(target = "order", ignore = true)
    PayOrderApprovalEntity toApprovalEntity(PayOrderApproval domain);

    // ===== Entity -> Domain =====

    @Mapping(target = "lines", source = "lines", qualifiedByName = "mapLines")
    @Mapping(target = "attachments", source = "attachments", qualifiedByName = "mapAttachments")
    @Mapping(target = "approvals", source = "approvals", qualifiedByName = "mapApprovals")
    PayOrder toDomain(PayOrderEntity entity);

    @Named("mapLines")
    default List<PayOrderLine> mapLines(List<PayOrderLineEntity> entities) {
        if (entities == null) return new java.util.ArrayList<>();
        return new java.util.ArrayList<>(entities.stream().map(this::toLineDomain).toList());
    }

    @Named("mapAttachments")
    default List<PayOrderAttachment> mapAttachments(List<PayOrderAttachmentEntity> entities) {
        if (entities == null) return new java.util.ArrayList<>();
        return new java.util.ArrayList<>(entities.stream().map(this::toAttachmentDomain).toList());
    }

    @Named("mapApprovals")
    default List<PayOrderApproval> mapApprovals(List<PayOrderApprovalEntity> entities) {
        if (entities == null) return new java.util.ArrayList<>();
        return new java.util.ArrayList<>(entities.stream().map(this::toApprovalDomain).toList());
    }

    PayOrderLine toLineDomain(PayOrderLineEntity entity);

    PayOrderAttachment toAttachmentDomain(PayOrderAttachmentEntity entity);

    PayOrderApproval toApprovalDomain(PayOrderApprovalEntity entity);

    // ===== Enum mapping helpers =====

    default String map(OrderStatus status) {
        return status != null ? status.name() : null;
    }

    default OrderStatus mapOrderStatus(String status) {
        return status != null ? OrderStatus.valueOf(status) : null;
    }

    default String map(OrderChannel channel) {
        return channel != null ? channel.name() : null;
    }

    default OrderChannel mapOrderChannel(String channel) {
        return channel != null ? OrderChannel.valueOf(channel) : null;
    }

    default String map(LnhTransactionType type) {
        return type != null ? type.name() : null;
    }

    default LnhTransactionType mapLnhTransactionType(String type) {
        return type != null ? LnhTransactionType.valueOf(type) : null;
    }

    default String map(ExpType type) {
        return type != null ? type.name() : null;
    }

    default ExpType mapExpType(String type) {
        return type != null ? ExpType.valueOf(type) : null;
    }

    default String map(DocType type) {
        return type != null ? type.name() : null;
    }

    default DocType mapDocType(String type) {
        return type != null ? DocType.valueOf(type) : null;
    }

    default String map(ApprovalAction action) {
        return action != null ? action.name() : null;
    }

    default ApprovalAction mapApprovalAction(String action) {
        return action != null ? ApprovalAction.valueOf(action) : null;
    }

    default String map(PerformedRole role) {
        return role != null ? role.name() : null;
    }

    default PerformedRole mapPerformedRole(String role) {
        return role != null ? PerformedRole.valueOf(role) : null;
    }

    // Boolean mapping for attachment isDeleted (Integer 0/1 -> boolean)
    default boolean mapIsDeleted(Integer isDeleted) {
        return isDeleted != null && isDeleted == 1;
    }

    default Integer mapIsDeleted(Boolean isDeleted) {
        return isDeleted != null && isDeleted ? 1 : 0;
    }

    // After mapping entity -> domain, set orderId from entity relationship
    @AfterMapping
    default void afterToLineDomain(@MappingTarget PayOrderLine.PayOrderLineBuilder target, PayOrderLineEntity entity) {
        if (entity.getOrder() != null) {
            target.orderId(entity.getOrder().getId());
        }
    }

    @AfterMapping
    default void afterToAttachmentDomain(@MappingTarget PayOrderAttachment.PayOrderAttachmentBuilder target, PayOrderAttachmentEntity entity) {
        if (entity.getOrder() != null) {
            target.orderId(entity.getOrder().getId());
        }
    }

    @AfterMapping
    default void afterToApprovalDomain(@MappingTarget PayOrderApproval.PayOrderApprovalBuilder target, PayOrderApprovalEntity entity) {
        if (entity.getOrder() != null) {
            target.orderId(entity.getOrder().getId());
        }
    }

    /**
     * Update entity from domain (for updates). Does NOT touch version (handled by JPA @Version).
     */
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "version", ignore = true)  // Managed by JPA @Version
    @Mapping(target = "lines", ignore = true)
    @Mapping(target = "attachments", ignore = true)
    @Mapping(target = "approvals", ignore = true)
    void updateEntityFromDomain(PayOrder domain, @MappingTarget PayOrderEntity entity);
}
