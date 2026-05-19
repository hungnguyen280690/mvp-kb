package com.kb.ltt.interfaces.rest;

import com.kb.ltt.domain.enums.DocType;
import com.kb.ltt.domain.enums.ExpType;
import com.kb.ltt.domain.enums.LnhTransactionType;
import com.kb.ltt.domain.enums.OrderChannel;
import com.kb.ltt.domain.enums.OrderStatus;
import com.kb.ltt.interfaces.rest.dto.CcidValidationRequest;
import com.kb.ltt.interfaces.rest.dto.CcidValidationResponse;
import com.kb.ltt.interfaces.rest.dto.CreateOrderRequest;
import com.kb.ltt.interfaces.rest.dto.DeleteOrderRequest;
import com.kb.ltt.interfaces.rest.dto.ExportRequest;
import com.kb.ltt.interfaces.rest.dto.ReturnRejectRequest;
import com.kb.ltt.interfaces.rest.dto.UpdateOrderRequest;
import com.kb.ltt.interfaces.rest.dto.WorkflowActionRequest;
import com.kb.ltt.port.in.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

/**
 * REST controller for FT-001 PAY.OUT.MANUAL — internal API.
 * All endpoints are prefixed with /internal/ for BFF-to-service communication.
 * <p>
 * Endpoints map 1:1 to openapi.yaml contract (20 endpoints).
 */
@Slf4j
@RestController
@RequestMapping("/internal/pay-out-manual")
@RequiredArgsConstructor
public class PayOrderController {

    private final CreateOrderUseCase createOrderUseCase;
    private final UpdateOrderUseCase updateOrderUseCase;
    private final DeleteOrderUseCase deleteOrderUseCase;
    private final SubmitOrderUseCase submitOrderUseCase;
    private final CheckApproveUseCase checkApproveUseCase;
    private final ApproveOrderUseCase approveOrderUseCase;
    private final ReturnOrderUseCase returnOrderUseCase;
    private final RejectOrderUseCase rejectOrderUseCase;
    private final CopyOrderUseCase copyOrderUseCase;
    private final ListOrdersUseCase listOrdersUseCase;
    private final ExportOrdersUseCase exportOrdersUseCase;
    private final ManageAttachmentUseCase manageAttachmentUseCase;
    private final GetAuditLogUseCase getAuditLogUseCase;
    private final GetOrderUseCase getOrderUseCase;
    private final GetApprovalStatusUseCase getApprovalStatusUseCase;
    private final ValidateCcidUseCase validateCcidUseCase;
    private final LookupUseCase lookupUseCase;

    // =========================================================================
    // 1. POST /internal/pay-out-manual — Create
    // =========================================================================

    @PostMapping(
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<PayOrderResponse> create(
            @Valid @RequestBody CreateOrderRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Ip", required = false) String userIp,
            @RequestHeader(value = "X-Kbnn-Id", required = false) String kbnnId,
            HttpServletRequest httpRequest
    ) {
        log.debug("Creating pay order, idempotencyKey={}", idempotencyKey);

        CreateOrderUseCase.CreateOrderCommand command = new CreateOrderUseCase.CreateOrderCommand(
                parseEnum(OrderChannel.class, request.getChannel()),
                request.getOrderType(),
                parseEnum(LnhTransactionType.class, request.getLnhTransactionType()),
                request.getSender(),
                request.getReceiver(),
                request.getPaymentDate(),
                request.getAmount(),
                request.getCurrencyCode(),
                request.getExchangeRate(),
                request.getOriginNum(),
                request.getTransactionDate(),
                parseEnum(ExpType.class, request.getExpType()),
                request.getFnCode1(),
                request.getFnCode2(),
                request.getFnAmount(),
                request.getDescription(),
                request.getSenderName(),
                request.getSenderAddress(),
                request.getSenderGlSegment2(),
                request.getSenderNum(),
                request.getSenderBankCode(),
                request.getSenderIdentifyId(),
                request.getSenderIssuedDate(),
                request.getSenderIssuedPlace(),
                request.getTpcpCode(),
                request.getReceiverName(),
                request.getReceiverAddress(),
                request.getReceiverGlSegment2(),
                request.getReceiverBankCode(),
                request.getReceiverAccountName(),
                request.getReceiverIdentifyId(),
                request.getReceiverIssuedDate(),
                request.getReceiverIssuedPlace(),
                kbnnId,
                userId,
                userIp,
                idempotencyKey
        );

        PayOrderResponse response = createOrderUseCase.create(command);

        return ResponseEntity
                .status(201)
                .header(HttpHeaders.ETAG, formatEtag(response.version()))
                .body(response);
    }

    // =========================================================================
    // 2. GET /internal/pay-out-manual/{id} — GetById
    // =========================================================================

    @GetMapping(
            value = "/{id}",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<PayOrderResponse> getById(
            @PathVariable String id,
            HttpServletRequest httpRequest
    ) {
        log.debug("Getting pay order by id={}", id);

        PayOrderResponse response = getOrderUseCase.getById(id);

        return ResponseEntity
                .ok()
                .header(HttpHeaders.ETAG, formatEtag(response.version()))
                .body(response);
    }

    // =========================================================================
    // 3. PUT /internal/pay-out-manual/{id} — Update
    // =========================================================================

    @PutMapping(
            value = "/{id}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<PayOrderResponse> update(
            @PathVariable String id,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody UpdateOrderRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Ip", required = false) String userIp,
            HttpServletRequest httpRequest
    ) {
        log.debug("Updating pay order id={}, ifMatch={}", id, ifMatch);

        long expectedVersion = parseEtag(ifMatch);

        List<UpdateOrderUseCase.LineItem> lines = null;
        if (request.getLines() != null) {
            lines = request.getLines().stream()
                    .map(line -> new UpdateOrderUseCase.LineItem(
                            line.getGlSegment1(),
                            line.getGlSegment2(),
                            line.getGlSegment3(),
                            line.getGlSegment4(),
                            line.getGlSegment5(),
                            line.getGlSegment6(),
                            line.getGlSegment7(),
                            line.getGlSegment8(),
                            line.getGlSegment9(),
                            line.getGlSegment10(),
                            line.getGlSegment11(),
                            line.getGlSegment12(),
                            line.getLineDescription(),
                            line.getLineAmount()
                    ))
                    .collect(Collectors.toList());
        }

        UpdateOrderUseCase.UpdateOrderCommand command = new UpdateOrderUseCase.UpdateOrderCommand(
                id,
                expectedVersion,
                parseEnum(OrderChannel.class, request.getChannel()),
                request.getOrderType(),
                parseEnum(LnhTransactionType.class, request.getLnhTransactionType()),
                request.getSender(),
                request.getReceiver(),
                request.getPaymentDate(),
                request.getAmount(),
                request.getCurrencyCode(),
                request.getExchangeRate(),
                request.getOriginNum(),
                request.getTransactionDate(),
                parseEnum(ExpType.class, request.getExpType()),
                request.getFnCode1(),
                request.getFnCode2(),
                request.getFnAmount(),
                request.getDescription(),
                request.getSenderName(),
                request.getSenderAddress(),
                request.getSenderGlSegment2(),
                request.getSenderNum(),
                request.getSenderBankCode(),
                request.getSenderIdentifyId(),
                request.getSenderIssuedDate(),
                request.getSenderIssuedPlace(),
                request.getTpcpCode(),
                request.getReceiverName(),
                request.getReceiverAddress(),
                request.getReceiverGlSegment2(),
                request.getReceiverBankCode(),
                request.getReceiverAccountName(),
                request.getReceiverIdentifyId(),
                request.getReceiverIssuedDate(),
                request.getReceiverIssuedPlace(),
                lines,
                userId,
                userIp
        );

        PayOrderResponse response = updateOrderUseCase.update(command);

        return ResponseEntity
                .ok()
                .header(HttpHeaders.ETAG, formatEtag(response.version()))
                .body(response);
    }

    // =========================================================================
    // 4. DELETE /internal/pay-out-manual/{id} — Delete
    // =========================================================================

    @DeleteMapping(
            value = "/{id}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<PayOrderResponse> delete(
            @PathVariable String id,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody DeleteOrderRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Ip", required = false) String userIp,
            HttpServletRequest httpRequest
    ) {
        log.debug("Deleting pay order id={}, ifMatch={}", id, ifMatch);

        long expectedVersion = parseEtag(ifMatch);

        DeleteOrderUseCase.DeleteOrderCommand command = new DeleteOrderUseCase.DeleteOrderCommand(
                id,
                expectedVersion,
                request.getDeleteReason(),
                request.getConfirmed(),
                userId,
                userIp
        );

        deleteOrderUseCase.delete(command);

        // Return the updated (deleted) state
        PayOrderResponse response = getOrderUseCase.getById(id);

        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // 5. POST /internal/pay-out-manual/{id}/submit — Submit
    // =========================================================================

    @PostMapping(
            value = "/{id}/submit",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<PayOrderResponse> submit(
            @PathVariable String id,
            @RequestHeader("If-Match") String ifMatch,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Ip", required = false) String userIp,
            HttpServletRequest httpRequest
    ) {
        log.debug("Submitting pay order id={}, ifMatch={}", id, ifMatch);

        long expectedVersion = parseEtag(ifMatch);

        SubmitOrderUseCase.SubmitCommand command = new SubmitOrderUseCase.SubmitCommand(
                id, expectedVersion, userId, userIp
        );

        PayOrderResponse response = submitOrderUseCase.submit(command);

        return ResponseEntity
                .ok()
                .header(HttpHeaders.ETAG, formatEtag(response.version()))
                .body(response);
    }

    // =========================================================================
    // 6. POST /internal/pay-out-manual/{id}/check-approve — Checker approve
    // =========================================================================

    @PostMapping(
            value = "/{id}/check-approve",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<PayOrderResponse> checkApprove(
            @PathVariable String id,
            @RequestHeader("If-Match") String ifMatch,
            @RequestBody(required = false) WorkflowActionRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Ip", required = false) String userIp,
            HttpServletRequest httpRequest
    ) {
        log.debug("Check-approving pay order id={}, ifMatch={}", id, ifMatch);

        long expectedVersion = parseEtag(ifMatch);

        WorkflowCommand command = new WorkflowCommand(id, expectedVersion, userId, userIp);

        PayOrderResponse response = checkApproveUseCase.checkApprove(command);

        return ResponseEntity
                .ok()
                .header(HttpHeaders.ETAG, formatEtag(response.version()))
                .body(response);
    }

    // =========================================================================
    // 7. POST /internal/pay-out-manual/{id}/approve — Approver approve
    // =========================================================================

    @PostMapping(
            value = "/{id}/approve",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<PayOrderResponse> approve(
            @PathVariable String id,
            @RequestHeader("If-Match") String ifMatch,
            @RequestBody(required = false) WorkflowActionRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Ip", required = false) String userIp,
            HttpServletRequest httpRequest
    ) {
        log.debug("Approving pay order id={}, ifMatch={}", id, ifMatch);

        long expectedVersion = parseEtag(ifMatch);

        WorkflowCommand command = new WorkflowCommand(id, expectedVersion, userId, userIp);

        PayOrderResponse response = approveOrderUseCase.approve(command);

        return ResponseEntity
                .ok()
                .header(HttpHeaders.ETAG, formatEtag(response.version()))
                .body(response);
    }

    // =========================================================================
    // 8. POST /internal/pay-out-manual/{id}/return — Return to Maker
    // =========================================================================

    @PostMapping(
            value = "/{id}/return",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<PayOrderResponse> returnOrder(
            @PathVariable String id,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody ReturnRejectRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Ip", required = false) String userIp,
            HttpServletRequest httpRequest
    ) {
        log.debug("Returning pay order id={}, ifMatch={}", id, ifMatch);

        long expectedVersion = parseEtag(ifMatch);

        ReturnRejectCommand command = new ReturnRejectCommand(
                id, expectedVersion, userId, userIp, request.getReason()
        );

        PayOrderResponse response = returnOrderUseCase.returnOrder(command);

        return ResponseEntity
                .ok()
                .header(HttpHeaders.ETAG, formatEtag(response.version()))
                .body(response);
    }

    // =========================================================================
    // 9. POST /internal/pay-out-manual/{id}/reject — Reject
    // =========================================================================

    @PostMapping(
            value = "/{id}/reject",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<PayOrderResponse> reject(
            @PathVariable String id,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody ReturnRejectRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Ip", required = false) String userIp,
            HttpServletRequest httpRequest
    ) {
        log.debug("Rejecting pay order id={}, ifMatch={}", id, ifMatch);

        long expectedVersion = parseEtag(ifMatch);

        ReturnRejectCommand command = new ReturnRejectCommand(
                id, expectedVersion, userId, userIp, request.getReason()
        );

        PayOrderResponse response = rejectOrderUseCase.reject(command);

        return ResponseEntity
                .ok()
                .header(HttpHeaders.ETAG, formatEtag(response.version()))
                .body(response);
    }

    // =========================================================================
    // 10. POST /internal/pay-out-manual/{id}/copy — Copy/Clone
    // =========================================================================

    @PostMapping(
            value = "/{id}/copy",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<PayOrderResponse> copy(
            @PathVariable String id,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Ip", required = false) String userIp,
            HttpServletRequest httpRequest
    ) {
        log.debug("Copying pay order id={}", id);

        CopyOrderUseCase.CopyCommand command = new CopyOrderUseCase.CopyCommand(
                id, userId, userIp, idempotencyKey
        );

        PayOrderResponse response = copyOrderUseCase.copy(command);

        return ResponseEntity
                .status(201)
                .header(HttpHeaders.ETAG, formatEtag(response.version()))
                .body(response);
    }

    // =========================================================================
    // 11. GET /internal/pay-out-manual — List
    // =========================================================================

    @GetMapping(
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ListOrdersUseCase.PageResponse> list(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sort", required = false) List<String> sort,
            @RequestParam(value = "status", required = false) List<String> statuses,
            @RequestParam(value = "channel", required = false) String channel,
            @RequestParam(value = "orderType", required = false) String orderType,
            @RequestParam(value = "kbnnId", required = false) String kbnnId,
            @RequestParam(value = "createdBy", required = false) String createdBy,
            @RequestParam(value = "keyword", required = false) String keyword,
            @RequestParam(value = "paymentDateFrom", required = false) LocalDate paymentDateFrom,
            @RequestParam(value = "paymentDateTo", required = false) LocalDate paymentDateTo,
            @RequestParam(value = "createdDateFrom", required = false) LocalDate createdDateFrom,
            @RequestParam(value = "createdDateTo", required = false) LocalDate createdDateTo,
            HttpServletRequest httpRequest
    ) {
        log.debug("Listing pay orders, page={}, size={}", page, size);

        List<OrderStatus> statusEnums = null;
        if (statuses != null && !statuses.isEmpty()) {
            statusEnums = statuses.stream()
                    .map(s -> OrderStatus.valueOf(s))
                    .collect(Collectors.toList());
        }

        String sortBy = "createdAt";
        String sortDirection = "DESC";
        if (sort != null && !sort.isEmpty()) {
            String firstSort = sort.get(0);
            String[] parts = firstSort.split(",", 2);
            sortBy = parts[0];
            sortDirection = parts.length > 1 ? parts[1] : "DESC";
        }

        ListOrdersUseCase.ListQuery query = new ListOrdersUseCase.ListQuery(
                statusEnums,
                channel,
                orderType,
                kbnnId,
                createdBy,
                keyword,
                paymentDateFrom,
                paymentDateTo,
                createdDateFrom,
                createdDateTo,
                sortBy,
                sortDirection,
                page,
                Math.min(size, 100)
        );

        ListOrdersUseCase.PageResponse response = listOrdersUseCase.list(query);

        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // 12. POST /internal/pay-out-manual/export — Export
    // =========================================================================

    @PostMapping(
            value = "/export",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<byte[]> export(
            @Valid @RequestBody ExportRequest request,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            HttpServletRequest httpRequest
    ) {
        log.debug("Exporting pay orders, format={}", request.getFormat());

        ExportOrdersUseCase.ExportQuery query = buildExportQuery(request);

        byte[] data = exportOrdersUseCase.export(query);

        MediaType contentType = switch (request.getFormat().toUpperCase()) {
            case "XLSX" -> MediaType.parseMediaType(
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
            case "PDF" -> MediaType.APPLICATION_PDF;
            case "CSV" -> MediaType.parseMediaType("text/csv");
            default -> MediaType.APPLICATION_OCTET_STREAM;
        };

        String filename = "pay-out-manual-export." + request.getFormat().toLowerCase();

        return ResponseEntity
                .ok()
                .contentType(contentType)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"" + filename + "\"")
                .body(data);
    }

    // =========================================================================
    // 13. POST /internal/pay-out-manual/{id}/attachments — Upload
    // =========================================================================

    @PostMapping(
            value = "/{id}/attachments",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<ManageAttachmentUseCase.PayOrderAttachmentResponse> uploadAttachment(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("docType") String docType,
            @RequestParam(value = "note", required = false) String note,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Ip", required = false) String userIp,
            HttpServletRequest httpRequest
    ) {
        log.debug("Uploading attachment for order id={}, docType={}", id, docType);

        try {
            ManageAttachmentUseCase.UploadAttachmentCommand command =
                    new ManageAttachmentUseCase.UploadAttachmentCommand(
                            id,
                            file.getOriginalFilename(),
                            DocType.valueOf(docType),
                            note,
                            file.getContentType(),
                            file.getSize(),
                            file.getInputStream(),
                            userId,
                            userIp,
                            idempotencyKey
                    );

            ManageAttachmentUseCase.PayOrderAttachmentResponse response =
                    manageAttachmentUseCase.upload(command);

            return ResponseEntity.status(201).body(response);
        } catch (Exception e) {
            throw new RuntimeException("Failed to read uploaded file", e);
        }
    }

    // =========================================================================
    // 14. GET /internal/pay-out-manual/{id}/attachments — List attachments
    // =========================================================================

    @GetMapping(
            value = "/{id}/attachments",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<List<ManageAttachmentUseCase.PayOrderAttachmentResponse>> listAttachments(
            @PathVariable String id,
            HttpServletRequest httpRequest
    ) {
        log.debug("Listing attachments for order id={}", id);

        List<ManageAttachmentUseCase.PayOrderAttachmentResponse> attachments =
                manageAttachmentUseCase.list(id);

        return ResponseEntity.ok(attachments);
    }

    // =========================================================================
    // 15. GET /internal/pay-out-manual/{id}/attachments/{attachId} — Download
    // =========================================================================

    @GetMapping(
            value = "/{id}/attachments/{attachId}",
            produces = MediaType.APPLICATION_OCTET_STREAM_VALUE
    )
    public ResponseEntity<byte[]> downloadAttachment(
            @PathVariable String id,
            @PathVariable String attachId,
            HttpServletRequest httpRequest
    ) {
        log.debug("Downloading attachment id={} for order id={}", attachId, id);

        ManageAttachmentUseCase.DownloadAttachmentResponse download =
                manageAttachmentUseCase.download(id, attachId);

        try {
            byte[] data = download.inputStream().readAllBytes();

            return ResponseEntity
                    .ok()
                    .contentType(MediaType.parseMediaType(download.contentType()))
                    .header(HttpHeaders.CONTENT_DISPOSITION,
                            "attachment; filename=\"" + download.fileName() + "\"")
                    .header(HttpHeaders.CONTENT_LENGTH, String.valueOf(data.length))
                    .body(data);
        } catch (Exception e) {
            throw new RuntimeException("Failed to read attachment file", e);
        }
    }

    // =========================================================================
    // 16. DELETE /internal/pay-out-manual/{id}/attachments/{attachId} — Delete
    // =========================================================================

    @DeleteMapping(
            value = "/{id}/attachments/{attachId}",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<Void> deleteAttachment(
            @PathVariable String id,
            @PathVariable String attachId,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-User-Id", required = false) String userId,
            @RequestHeader(value = "X-User-Ip", required = false) String userIp,
            HttpServletRequest httpRequest
    ) {
        log.debug("Deleting attachment id={} for order id={}", attachId, id);

        manageAttachmentUseCase.delete(id, attachId, userId, userIp);

        return ResponseEntity.ok().build();
    }

    // =========================================================================
    // 17. GET /internal/pay-out-manual/{id}/audit-log — Audit log
    // =========================================================================

    @GetMapping(
            value = "/{id}/audit-log",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<List<GetAuditLogUseCase.AuditLogEntry>> getAuditLog(
            @PathVariable String id,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            HttpServletRequest httpRequest
    ) {
        log.debug("Getting audit log for order id={}", id);

        GetAuditLogUseCase.AuditLogQuery query = new GetAuditLogUseCase.AuditLogQuery(
                id, "PAY_ORDER", page, size
        );

        List<GetAuditLogUseCase.AuditLogEntry> entries = getAuditLogUseCase.getAuditLog(query);

        return ResponseEntity.ok(entries);
    }

    // =========================================================================
    // 18. GET /internal/pay-out-manual/{id}/approval-status — Approval status
    // =========================================================================

    @GetMapping(
            value = "/{id}/approval-status",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<GetApprovalStatusUseCase.ApprovalStatusResponse> getApprovalStatus(
            @PathVariable String id,
            HttpServletRequest httpRequest
    ) {
        log.debug("Getting approval status for order id={}", id);

        GetApprovalStatusUseCase.ApprovalStatusResponse response =
                getApprovalStatusUseCase.getApprovalStatus(id);

        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // 19. POST /internal/pay-out-manual/{id}/validate-ccid — Validate CCID
    // =========================================================================

    @PostMapping(
            value = "/{id}/validate-ccid",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<CcidValidationResponse> validateCcid(
            @PathVariable String id,
            @Valid @RequestBody CcidValidationRequest request,
            HttpServletRequest httpRequest
    ) {
        log.debug("Validating CCID for order id={}, lines={}", id, request.getLines().size());

        boolean allValid = true;
        List<CcidValidationResponse.CcidLineResult> results = new java.util.ArrayList<>();

        for (int i = 0; i < request.getLines().size(); i++) {
            CcidValidationRequest.CcidLineRequest line = request.getLines().get(i);

            ValidateCcidUseCase.CcidValidationRequest validationRequest =
                    new ValidateCcidUseCase.CcidValidationRequest(
                            line.getGlSegment1(),
                            line.getGlSegment2(),
                            line.getGlSegment3(),
                            line.getGlSegment4(),
                            line.getGlSegment5(),
                            line.getGlSegment6(),
                            line.getGlSegment7(),
                            line.getGlSegment8(),
                            line.getGlSegment9(),
                            line.getGlSegment10(),
                            line.getGlSegment11(),
                            line.getGlSegment12()
                    );

            ValidateCcidUseCase.CcidValidationResponse result =
                    validateCcidUseCase.validate(validationRequest);

            if (!result.valid()) {
                allValid = false;
            }

            List<CcidValidationResponse.CcidError> errors = result.errors() != null
                    ? result.errors().stream()
                        .map(err -> CcidValidationResponse.CcidError.builder()
                                .segment(err.segment())
                                .message(err.message())
                                .build())
                        .collect(Collectors.toList())
                    : List.of();

            results.add(CcidValidationResponse.CcidLineResult.builder()
                    .lineIndex(i)
                    .ccidKey(result.ccidKey())
                    .valid(result.valid())
                    .errors(errors)
                    .build());
        }

        CcidValidationResponse response = CcidValidationResponse.builder()
                .valid(allValid)
                .results(results)
                .build();

        return ResponseEntity.ok(response);
    }

    // =========================================================================
    // 20. GET /internal/pay-out-manual/lookup/{type} — Lookup
    // =========================================================================

    @GetMapping(
            value = "/lookup/{type}",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<List<LookupUseCase.LookupEntry>> lookup(
            @PathVariable String type,
            @RequestParam(value = "q", required = false) String query,
            HttpServletRequest httpRequest
    ) {
        log.debug("Lookup type={}, query={}", type, query);

        List<LookupUseCase.LookupEntry> results = lookupUseCase.lookup(type, query);

        return ResponseEntity.ok(results);
    }

    // =========================================================================
    // Helper methods
    // =========================================================================

    /**
     * Parse ETag header value to extract the version number.
     * Handles both quoted ("3") and unquoted (3) formats.
     */
    private long parseEtag(String ifMatch) {
        if (ifMatch == null || ifMatch.isBlank()) {
            throw new IllegalArgumentException("If-Match header is required");
        }
        String cleaned = ifMatch.replace("\"", "").trim();
        return Long.parseLong(cleaned);
    }

    /**
     * Format a version number as an ETag header value (quoted string).
     */
    private String formatEtag(long version) {
        return "\"" + version + "\"";
    }

    /**
     * Safely parse a string into an enum value.
     * Returns null if the input is null or blank.
     */
    private <E extends Enum<E>> E parseEnum(Class<E> enumClass, String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return Enum.valueOf(enumClass, value.trim());
    }

    /**
     * Build an ExportQuery from the ExportRequest DTO.
     */
    private ExportOrdersUseCase.ExportQuery buildExportQuery(ExportRequest request) {
        List<OrderStatus> statusEnums = null;
        if (request.getFilters() != null && request.getFilters().getStatus() != null) {
            statusEnums = request.getFilters().getStatus().stream()
                    .map(OrderStatus::valueOf)
                    .collect(Collectors.toList());
        }

        String channel = null;
        if (request.getFilters() != null) {
            channel = request.getFilters().getChannel();
        }

        return new ExportOrdersUseCase.ExportQuery(
                statusEnums,
                channel,
                null,
                null,
                null,
                null,
                request.getFilters() != null ? request.getFilters().getPaymentDateFrom() : null,
                request.getFilters() != null ? request.getFilters().getPaymentDateTo() : null,
                null,
                null,
                request.getFormat()
        );
    }
}
