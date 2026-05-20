package com.kb.ltt.infrastructure.persistence.mapper;

import com.kb.ltt.application.dto.PayOrderLineResponse;
import com.kb.ltt.application.dto.PayOrderResponse;
import com.kb.ltt.application.dto.PayOrderSummary;
import com.kb.ltt.domain.model.PayOrder;
import com.kb.ltt.domain.model.PayOrderLine;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderAttachmentEntity;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderLineEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

/**
 * MapStruct mapper between domain, entity, and DTO layers.
 * Spring component model — auto-detected and injected as a bean.
 */
@Mapper(componentModel = "spring")
public interface PayOrderMapper {

    // ── Domain ↔ Entity ────────────────────────────────────────────────────

    PayOrderEntity toEntity(PayOrder domain);

    PayOrder toDomain(PayOrderEntity entity);

    PayOrderLineEntity toLineEntity(PayOrderLine line);

    PayOrderLine toLineDomain(PayOrderLineEntity entity);

    // ── Entity → Response DTO ──────────────────────────────────────────────

    /**
     * Maps entity to full response DTO.
     * {@code attachmentCount} is derived from non-deleted attachments.
     */
    @Mapping(target = "attachmentCount", expression = "java(countActiveAttachments(entity))")
    @Mapping(target = "lines", source = "lines")
    PayOrderResponse toResponse(PayOrderEntity entity);

    /**
     * Maps entity to summary DTO for list views.
     */
    @Mapping(target = "attachmentCount", expression = "java(countActiveAttachments(entity))")
    PayOrderSummary toSummary(PayOrderEntity entity);

    // ── Line entity → line response ────────────────────────────────────────

    @Mapping(target = "ccidValid", constant = "false")
    PayOrderLineResponse toLineResponse(PayOrderLineEntity entity);

    List<PayOrderLineResponse> toLineResponseList(List<PayOrderLineEntity> entities);

    // ── Helpers (used in @Mapping expressions) ─────────────────────────────

    default int countActiveAttachments(PayOrderEntity entity) {
        if (entity.getAttachments() == null) {
            return 0;
        }
        return (int) entity.getAttachments().stream()
                .filter(a -> a.getIsDeleted() == null || !a.getIsDeleted())
                .count();
    }
}
