package com.kb.ltt.infrastructure.web;

import com.kb.ltt.application.dto.*;
import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.application.usecase.*;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

/**
 * REST controller for PAY.OUT.MANUAL - 20 endpoints covering the full lifecycle
 * of a manual payment order (lệnh thanh toán đi thủ công).
 */
@RestController
@RequestMapping("/api/pay-out-manual")
@RequiredArgsConstructor
@Slf4j
public class PayOutManualController {

    private final CreatePayOrderUseCase createUseCase;
    private final GetPayOrderUseCase getUseCase;
    private final UpdatePayOrderUseCase updateUseCase;
    private final DeletePayOrderUseCase deleteUseCase;
    private final ListPayOrderUseCase listUseCase;
    private final SubmitPayOrderUseCase submitUseCase;
    private final CheckApprovePayOrderUseCase checkApproveUseCase;
    private final ApprovePayOrderUseCase approveUseCase;
    private final ReturnPayOrderUseCase returnUseCase;
    private final RejectPayOrderUseCase rejectUseCase;
    private final CopyPayOrderUseCase copyUseCase;
    private final ExportPayOrderUseCase exportUseCase;
    private final AttachmentUseCase attachmentUseCase;
    private final AuditLogQueryUseCase auditLogQueryUseCase;
    private final ApprovalStatusUseCase approvalStatusUseCase;
    private final ValidateCcidUseCase validateCcidUseCase;
    private final LookupUseCase lookupUseCase;

    // ── 1. Create ─────────────────────────────────────────────────────────

    @PostMapping
    public ResponseEntity<PayOrderResponse> create(
            @RequestBody PayOrderRequest request,
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            HttpServletRequest httpRequest) {

        UserContext user = currentUser(httpRequest);
        PayOrderResponse response = createUseCase.create(request, user, idempotencyKey, user.ipAddress());

        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.ETAG, "\"" + response.getVersion() + "\"")
                .header(HttpHeaders.LOCATION, "/api/pay-out-manual/" + response.getId())
                .body(response);
    }

    // ── 2. Get by ID ──────────────────────────────────────────────────────

    @GetMapping("/{id}")
    public ResponseEntity<PayOrderResponse> getById(@PathVariable String id) {
        PayOrderResponse response = getUseCase.getById(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.ETAG, "\"" + response.getVersion() + "\"")
                .body(response);
    }

    // ── 3. Update ─────────────────────────────────────────────────────────

    @PutMapping("/{id}")
    public ResponseEntity<PayOrderResponse> update(
            @PathVariable String id,
            @RequestBody PayOrderRequest request,
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            @RequestHeader(value = "If-Match", required = false) String ifMatch,
            HttpServletRequest httpRequest) {

        Long version = parseETag(ifMatch);
        UserContext user = currentUser(httpRequest);
        PayOrderResponse response = updateUseCase.update(id, request, user, version, idempotencyKey, user.ipAddress());

        return ResponseEntity.ok()
                .header(HttpHeaders.ETAG, "\"" + response.getVersion() + "\"")
                .body(response);
    }

    // ── 4. Delete (soft) ──────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> delete(
            @PathVariable String id,
            @RequestBody DeletePayOrderUseCase.DeleteRequest request,
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            @RequestHeader(value = "If-Match", required = false) String ifMatch,
            HttpServletRequest httpRequest) {

        Long version = parseETag(ifMatch);
        UserContext user = currentUser(httpRequest);
        Map<String, Object> result = deleteUseCase.delete(id, request, user, version, user.ipAddress());
        return ResponseEntity.ok(result);
    }

    // ── 5. Submit ─────────────────────────────────────────────────────────

    @PostMapping("/{id}/submit")
    public ResponseEntity<Map<String, Object>> submit(
            @PathVariable String id,
            @RequestBody(required = false) SubmitPayOrderUseCase.SubmitRequest request,
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            @RequestHeader(value = "If-Match", required = false) String ifMatch,
            HttpServletRequest httpRequest) {

        Long version = parseETag(ifMatch);
        UserContext user = currentUser(httpRequest);
        Map<String, Object> result = submitUseCase.submit(id, request, user, version, user.ipAddress());
        return ResponseEntity.ok(result);
    }

    // ── 6. Check-Approve ──────────────────────────────────────────────────

    @PostMapping("/{id}/check-approve")
    public ResponseEntity<Map<String, Object>> checkApprove(
            @PathVariable String id,
            @RequestBody(required = false) CheckApprovePayOrderUseCase.CheckApproveRequest request,
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            @RequestHeader(value = "If-Match", required = false) String ifMatch,
            HttpServletRequest httpRequest) {

        Long version = parseETag(ifMatch);
        UserContext user = currentUser(httpRequest);
        Map<String, Object> result = checkApproveUseCase.checkApprove(id, request, user, version, user.ipAddress());
        return ResponseEntity.ok(result);
    }

    // ── 7. Approve ────────────────────────────────────────────────────────

    @PostMapping("/{id}/approve")
    public ResponseEntity<Map<String, Object>> approve(
            @PathVariable String id,
            @RequestBody(required = false) ApprovePayOrderUseCase.ApproveRequest request,
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            @RequestHeader(value = "If-Match", required = false) String ifMatch,
            HttpServletRequest httpRequest) {

        Long version = parseETag(ifMatch);
        UserContext user = currentUser(httpRequest);
        Map<String, Object> result = approveUseCase.approve(id, request, user, version, user.ipAddress());
        return ResponseEntity.ok(result);
    }

    // ── 8. Return ─────────────────────────────────────────────────────────

    @PostMapping("/{id}/return")
    public ResponseEntity<Map<String, Object>> returnToMaker(
            @PathVariable String id,
            @RequestBody(required = false) ReturnPayOrderUseCase.ReturnRequest request,
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            @RequestHeader(value = "If-Match", required = false) String ifMatch,
            HttpServletRequest httpRequest) {

        Long version = parseETag(ifMatch);
        UserContext user = currentUser(httpRequest);
        Map<String, Object> result = returnUseCase.returnToMaker(id, request, user, version, user.ipAddress());
        return ResponseEntity.ok(result);
    }

    // ── 9. Reject ─────────────────────────────────────────────────────────

    @PostMapping("/{id}/reject")
    public ResponseEntity<Map<String, Object>> reject(
            @PathVariable String id,
            @RequestBody(required = false) RejectPayOrderUseCase.RejectRequest request,
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            @RequestHeader(value = "If-Match", required = false) String ifMatch,
            HttpServletRequest httpRequest) {

        Long version = parseETag(ifMatch);
        UserContext user = currentUser(httpRequest);
        Map<String, Object> result = rejectUseCase.reject(id, request, user, version, user.ipAddress());
        return ResponseEntity.ok(result);
    }

    // ── 10. Copy ──────────────────────────────────────────────────────────

    @PostMapping("/{id}/copy")
    public ResponseEntity<PayOrderResponse> copy(
            @PathVariable String id,
            @RequestBody(required = false) Map<String, String> body,
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            HttpServletRequest httpRequest) {

        LocalDate paymentDate = null;
        if (body != null && body.containsKey("paymentDate")) {
            try {
                paymentDate = LocalDate.parse(body.get("paymentDate"));
            } catch (Exception e) {
                log.warn("Invalid paymentDate in copy request: {}", body.get("paymentDate"));
            }
        }

        UserContext user = currentUser(httpRequest);
        PayOrderResponse response = copyUseCase.copy(id, paymentDate, user, idempotencyKey, user.ipAddress());

        return ResponseEntity.status(HttpStatus.CREATED)
                .header(HttpHeaders.ETAG, "\"" + response.getVersion() + "\"")
                .header(HttpHeaders.LOCATION, "/api/pay-out-manual/" + response.getId())
                .body(response);
    }

    // ── 11. List ──────────────────────────────────────────────────────────

    @GetMapping
    public ResponseEntity<PagedResponse<PayOrderSummary>> list(
            @RequestParam(required = false) List<String> status,
            @RequestParam(required = false) List<String> channel,
            @RequestParam(required = false) String refNo,
            @RequestParam(required = false) String receiverName,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,desc") String sort,
            @RequestParam(defaultValue = "false") boolean includeDeleted,
            HttpServletRequest httpRequest) {

        UserContext user = currentUser(httpRequest);
        PayOrderFilter filter = PayOrderFilter.builder()
                .status(status)
                .channel(channel)
                .refNo(refNo)
                .receiverName(receiverName)
                .kbnnId(user.kbnnId())
                .includeDeleted(includeDeleted)
                .build();

        PagedResponse<PayOrderSummary> result = listUseCase.list(filter, page, size, sort);
        return ResponseEntity.ok(result);
    }

    // ── 12. Export ────────────────────────────────────────────────────────

    @PostMapping("/export")
    public ResponseEntity<byte[]> export(
            @RequestBody ExportPayOrderUseCase.ExportRequest request,
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            HttpServletRequest httpRequest) {

        byte[] bytes = exportUseCase.export(request, currentUser(httpRequest));

        String format = request.format() != null ? request.format().toUpperCase() : "CSV";
        String ext = switch (format) {
            case "EXCEL" -> "xlsx";
            case "PDF"   -> "pdf";
            default      -> "csv";
        };
        String contentType = switch (format) {
            case "EXCEL" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            case "CSV"   -> "text/csv;charset=UTF-8";
            default      -> "application/pdf";
        };

        String filename = "pay-out-manual-" + LocalDate.now() + "." + ext;

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(bytes);
    }

    // ── 13. Upload Attachment ─────────────────────────────────────────────

    @PostMapping(value = "/{id}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AttachmentResponse> uploadAttachment(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String description,
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            HttpServletRequest httpRequest) throws IOException {

        UserContext user = currentUser(httpRequest);
        AttachmentResponse response = attachmentUseCase.upload(
                id,
                file.getOriginalFilename(),
                file.getContentType(),
                file.getBytes(),
                description,
                user,
                idempotencyKey);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // ── 14. List Attachments ──────────────────────────────────────────────

    @GetMapping("/{id}/attachments")
    public List<AttachmentResponse> listAttachments(@PathVariable String id) {
        return attachmentUseCase.list(id);
    }

    // ── 15. Download Attachment ───────────────────────────────────────────

    @GetMapping("/{id}/attachments/{attachId}")
    public ResponseEntity<byte[]> downloadAttachment(
            @PathVariable String id,
            @PathVariable String attachId) {

        AttachmentUseCase.AttachmentDownload dl = attachmentUseCase.download(id, attachId);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + dl.fileName() + "\"")
                .contentType(MediaType.parseMediaType(dl.contentType()))
                .body(dl.bytes());
    }

    // ── 16. Delete Attachment ─────────────────────────────────────────────

    @DeleteMapping("/{id}/attachments/{attachId}")
    public Map<String, Object> deleteAttachment(
            @PathVariable String id,
            @PathVariable String attachId,
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            HttpServletRequest httpRequest) {

        UserContext user = currentUser(httpRequest);
        return attachmentUseCase.delete(attachId, id, user, idempotencyKey);
    }

    // ── 17. Audit Log ─────────────────────────────────────────────────────

    @GetMapping("/{id}/audit-log")
    public PagedResponse<AuditLogEntry> getAuditLog(
            @PathVariable String id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return auditLogQueryUseCase.getAuditLog(id, page, size);
    }

    // ── 18. Approval Status ───────────────────────────────────────────────

    @GetMapping("/{id}/approval-status")
    public ApprovalStatusResponse getApprovalStatus(@PathVariable String id) {
        return approvalStatusUseCase.getApprovalStatus(id);
    }

    // ── 19. Validate CCID (no idempotency key required) ──────────────────

    @PostMapping("/{id}/validate-ccid")
    public ValidateCcidUseCase.CcidValidateResponse validateCcid(
            @PathVariable String id,
            @RequestBody ValidateCcidUseCase.CcidValidateRequest request) {

        return validateCcidUseCase.validate(request);
    }

    // ── 20. Lookup ────────────────────────────────────────────────────────

    @GetMapping("/lookup/{type}")
    public LookupUseCase.LookupResult lookup(
            @PathVariable String type,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        return lookupUseCase.lookup(type, q, page, size);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    /**
     * Extracts UserContext from the SecurityContext populated by JwtAuthFilter.
     * <p>
     * JwtAuthFilter stores:
     * <ul>
     *   <li>principal = userId (String)</li>
     *   <li>credentials = null (authorities carry the roles)</li>
     *   <li>details = Map&lt;String, Object&gt; with key "kbnnId"</li>
     * </ul>
     */
    private UserContext currentUser(HttpServletRequest request) {
        var auth = SecurityContextHolder.getContext().getAuthentication();

        String userId = auth != null ? (String) auth.getPrincipal() : "anonymous";

        List<String> roles = List.of();
        if (auth != null && auth.getAuthorities() != null) {
            roles = auth.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .map(r -> r.startsWith("ROLE_") ? r.substring(5) : r)
                    .toList();
        }

        String kbnnId = "";
        if (auth != null && auth.getDetails() instanceof Map<?, ?> detailsMap) {
            Object kbnn = detailsMap.get("kbnnId");
            if (kbnn instanceof String s) kbnnId = s;
        }

        String ip = request.getRemoteAddr();
        return new UserContext(userId, roles, kbnnId, ip);
    }

    private Long parseETag(String ifMatch) {
        if (ifMatch == null || ifMatch.isBlank()) return null;
        try {
            return Long.parseLong(ifMatch.replace("\"", "").trim());
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
