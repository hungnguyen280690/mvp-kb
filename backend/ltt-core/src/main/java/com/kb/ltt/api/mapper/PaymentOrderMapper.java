package com.kb.ltt.api.mapper;

import com.kb.ltt.api.dto.CreatePaymentOrderRequest;
import com.kb.ltt.api.dto.PageResponse;
import com.kb.ltt.api.dto.PaymentOrderListResponse;
import com.kb.ltt.api.dto.PaymentOrderResponse;
import com.kb.ltt.domain.model.PaymentOrder;
import com.kb.ltt.domain.model.PaymentOrderDetail;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import org.mapstruct.Named;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PaymentOrderMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "uuid", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "lastUpdatedBy", ignore = true)
    @Mapping(target = "lastUpdatedDate", ignore = true)
    @Mapping(target = "checkedBy", ignore = true)
    @Mapping(target = "checkedDate", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvedDate", ignore = true)
    @Mapping(target = "deletedBy", ignore = true)
    @Mapping(target = "deletedDate", ignore = true)
    @Mapping(target = "deleteReason", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "idempotencyKey", ignore = true)
    @Mapping(target = "accountingDate", ignore = true)
    @Mapping(target = "details", ignore = true)
    @Mapping(target = "approvalLogs", ignore = true)
    @Mapping(source = "originNum", target = "orgNum")
    @Mapping(source = "senderInfo.senderName", target = "senderName")
    @Mapping(source = "senderInfo.senderAddress", target = "senderAddress")
    @Mapping(source = "senderInfo.senderGlSegment2", target = "senderGlSegment2")
    @Mapping(source = "senderInfo.senderNum", target = "senderNum")
    @Mapping(source = "senderInfo.senderBankCode", target = "senderBankCode")
    @Mapping(source = "senderInfo.senderIdentifyId", target = "senderIdentifyId")
    @Mapping(source = "senderInfo.senderIssuedDate", target = "senderIssuedDate")
    @Mapping(source = "senderInfo.senderIssuedPlace", target = "senderIssuedPlace")
    @Mapping(source = "senderInfo.tpcpCode", target = "tpcpCode")
    @Mapping(source = "receiverInfo.receiverName", target = "receiverName")
    @Mapping(source = "receiverInfo.receiverAddress", target = "receiverAddress")
    @Mapping(source = "receiverInfo.receiverGlSegment2", target = "receiverGlSegment2")
    @Mapping(source = "receiverInfo.receiverBankName", target = "receiverBankName")
    @Mapping(source = "receiverInfo.receiverBankCode", target = "receiverBankCode")
    @Mapping(source = "receiverInfo.receiverIdentifyId", target = "receiverIdentifyId")
    @Mapping(source = "receiverInfo.receiverIssuedDate", target = "receiverIssuedDate")
    @Mapping(source = "receiverInfo.receiverIssuedPlace", target = "receiverIssuedPlace")
    PaymentOrder toEntity(CreatePaymentOrderRequest request);

    @Mapping(source = "originNum", target = "orgNum")
    @Mapping(source = "senderInfo.senderName", target = "senderName")
    @Mapping(source = "senderInfo.senderAddress", target = "senderAddress")
    @Mapping(source = "senderInfo.senderGlSegment2", target = "senderGlSegment2")
    @Mapping(source = "senderInfo.senderNum", target = "senderNum")
    @Mapping(source = "senderInfo.senderBankCode", target = "senderBankCode")
    @Mapping(source = "senderInfo.senderIdentifyId", target = "senderIdentifyId")
    @Mapping(source = "senderInfo.senderIssuedDate", target = "senderIssuedDate")
    @Mapping(source = "senderInfo.senderIssuedPlace", target = "senderIssuedPlace")
    @Mapping(source = "senderInfo.tpcpCode", target = "tpcpCode")
    @Mapping(source = "receiverInfo.receiverName", target = "receiverName")
    @Mapping(source = "receiverInfo.receiverAddress", target = "receiverAddress")
    @Mapping(source = "receiverInfo.receiverGlSegment2", target = "receiverGlSegment2")
    @Mapping(source = "receiverInfo.receiverBankName", target = "receiverBankName")
    @Mapping(source = "receiverInfo.receiverBankCode", target = "receiverBankCode")
    @Mapping(source = "receiverInfo.receiverIdentifyId", target = "receiverIdentifyId")
    @Mapping(source = "receiverInfo.receiverIssuedDate", target = "receiverIssuedDate")
    @Mapping(source = "receiverInfo.receiverIssuedPlace", target = "receiverIssuedPlace")
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "uuid", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "version", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "createdDate", ignore = true)
    @Mapping(target = "lastUpdatedBy", ignore = true)
    @Mapping(target = "lastUpdatedDate", ignore = true)
    @Mapping(target = "checkedBy", ignore = true)
    @Mapping(target = "checkedDate", ignore = true)
    @Mapping(target = "approvedBy", ignore = true)
    @Mapping(target = "approvedDate", ignore = true)
    @Mapping(target = "deletedBy", ignore = true)
    @Mapping(target = "deletedDate", ignore = true)
    @Mapping(target = "deleteReason", ignore = true)
    @Mapping(target = "isDeleted", ignore = true)
    @Mapping(target = "idempotencyKey", ignore = true)
    @Mapping(target = "accountingDate", ignore = true)
    @Mapping(target = "details", ignore = true)
    @Mapping(target = "approvalLogs", ignore = true)
    void updateEntityFromRequest(CreatePaymentOrderRequest request, @MappingTarget PaymentOrder entity);

    @Mapping(target = "details", source = "details", qualifiedByName = "toDetailResponses")
    @Mapping(source = "orgNum", target = "originNum")
    PaymentOrderResponse toResponse(PaymentOrder entity);

    @Named("toDetailResponses")
    default List<PaymentOrderResponse.DetailLineResponse> toDetailResponses(List<PaymentOrderDetail> details) {
        if (details == null) return List.of();
        return details.stream()
                .filter(d -> !Boolean.TRUE.equals(d.getIsDeleted()))
                .map(this::toDetailLineResponse)
                .toList();
    }

    @Mapping(target = "lineNo", source = "lineNo")
    PaymentOrderResponse.DetailLineResponse toDetailLineResponse(PaymentOrderDetail detail);

    PaymentOrderListResponse toListResponse(PaymentOrder entity);

    default PageResponse<PaymentOrderListResponse> toPageResponse(
            List<PaymentOrder> entities, int number, int size, long totalElements, int totalPages) {
        return PageResponse.<PaymentOrderListResponse>builder()
                .content(entities.stream().map(this::toListResponse).toList())
                .page(PageResponse.PageInfo.builder()
                        .number(number)
                        .size(size)
                        .totalElements(totalElements)
                        .totalPages(totalPages)
                        .build())
                .build();
    }
}
