package com.kb.bff.interfaces.rest;

import com.kb.bff.security.JwtAuthToken;
import com.kb.bff.security.PermissionCodes;
import com.kb.bff.security.RbacChecker;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * BFF Controller for FT-001 PAY.OUT.MANUAL.
 * <p>
 * Exposes all 20 public endpoints from openapi.yaml under /api/pay-out-manual.
 * Each endpoint:
 * <ol>
 *   <li>Checks RBAC permissions via {@link RbacChecker}</li>
 *   <li>Proxies the request to ltt-service internal API via {@link WebClient}</li>
 *   <li>Injects user context headers (X-User-Id, X-User-Roles, X-Kbnn-Id) from JWT</li>
 *   <li>Passes through the response body and status from ltt-service</li>
 * </ol>
 */
@Slf4j
@RestController
@RequestMapping("/api/pay-out-manual")
@RequiredArgsConstructor
public class PayOutManualController {

    private final WebClient lttWebClient;
    private final RbacChecker rbacChecker;

    private static final String INTERNAL_BASE = "/internal/pay-out-manual";

    // =========================================================================
    // 1. POST /api/pay-out-manual — Create
    // =========================================================================

    @PostMapping(
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> create(
            @Valid @RequestBody String requestBody,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.CREATE);

        return proxyWithBody(HttpMethod.POST, INTERNAL_BASE, requestBody,
                idempotencyKey, null, requestId);
    }

    // =========================================================================
    // 2. GET /api/pay-out-manual/{id} — GetById
    // =========================================================================

    @GetMapping(
            value = "/{id}",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> getById(
            @PathVariable String id,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.READ);

        return proxyNoBody(HttpMethod.GET, INTERNAL_BASE + "/" + id, null, requestId);
    }

    // =========================================================================
    // 3. PUT /api/pay-out-manual/{id} — Update
    // =========================================================================

    @PutMapping(
            value = "/{id}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> update(
            @PathVariable String id,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody String requestBody,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.UPDATE);

        return proxyWithBody(HttpMethod.PUT, INTERNAL_BASE + "/" + id, requestBody,
                idempotencyKey, ifMatch, requestId);
    }

    // =========================================================================
    // 4. DELETE /api/pay-out-manual/{id} — Delete
    // =========================================================================

    @DeleteMapping(
            value = "/{id}",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> delete(
            @PathVariable String id,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody String requestBody,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.DELETE);

        return proxyWithBody(HttpMethod.DELETE, INTERNAL_BASE + "/" + id, requestBody,
                idempotencyKey, ifMatch, requestId);
    }

    // =========================================================================
    // 5. POST /api/pay-out-manual/{id}/submit — Submit
    // =========================================================================

    @PostMapping(
            value = "/{id}/submit",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> submit(
            @PathVariable String id,
            @RequestHeader("If-Match") String ifMatch,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.SUBMIT);

        return proxyNoBody(HttpMethod.POST, INTERNAL_BASE + "/" + id + "/submit",
                ifMatch, requestId, idempotencyKey);
    }

    // =========================================================================
    // 6. POST /api/pay-out-manual/{id}/check-approve — Checker approve
    // =========================================================================

    @PostMapping(
            value = "/{id}/check-approve",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> checkApprove(
            @PathVariable String id,
            @RequestHeader("If-Match") String ifMatch,
            @RequestBody(required = false) String requestBody,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.CHECK);

        if (requestBody != null && !requestBody.isBlank()) {
            return proxyWithBody(HttpMethod.POST, INTERNAL_BASE + "/" + id + "/check-approve",
                    requestBody, idempotencyKey, ifMatch, requestId);
        }
        return proxyNoBody(HttpMethod.POST, INTERNAL_BASE + "/" + id + "/check-approve",
                ifMatch, requestId, idempotencyKey);
    }

    // =========================================================================
    // 7. POST /api/pay-out-manual/{id}/approve — Approver approve
    // =========================================================================

    @PostMapping(
            value = "/{id}/approve",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> approve(
            @PathVariable String id,
            @RequestHeader("If-Match") String ifMatch,
            @RequestBody(required = false) String requestBody,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.APPROVE);

        if (requestBody != null && !requestBody.isBlank()) {
            return proxyWithBody(HttpMethod.POST, INTERNAL_BASE + "/" + id + "/approve",
                    requestBody, idempotencyKey, ifMatch, requestId);
        }
        return proxyNoBody(HttpMethod.POST, INTERNAL_BASE + "/" + id + "/approve",
                ifMatch, requestId, idempotencyKey);
    }

    // =========================================================================
    // 8. POST /api/pay-out-manual/{id}/return — Return to Maker
    // =========================================================================

    @PostMapping(
            value = "/{id}/return",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> returnOrder(
            @PathVariable String id,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody String requestBody,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.RETURN);

        return proxyWithBody(HttpMethod.POST, INTERNAL_BASE + "/" + id + "/return",
                requestBody, idempotencyKey, ifMatch, requestId);
    }

    // =========================================================================
    // 9. POST /api/pay-out-manual/{id}/reject — Reject
    // =========================================================================

    @PostMapping(
            value = "/{id}/reject",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> reject(
            @PathVariable String id,
            @RequestHeader("If-Match") String ifMatch,
            @Valid @RequestBody String requestBody,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.REJECT);

        return proxyWithBody(HttpMethod.POST, INTERNAL_BASE + "/" + id + "/reject",
                requestBody, idempotencyKey, ifMatch, requestId);
    }

    // =========================================================================
    // 10. POST /api/pay-out-manual/{id}/copy — Copy/Clone
    // =========================================================================

    @PostMapping(
            value = "/{id}/copy",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> copy(
            @PathVariable String id,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.CREATE);

        return proxyNoBody(HttpMethod.POST, INTERNAL_BASE + "/" + id + "/copy",
                null, requestId, idempotencyKey);
    }

    // =========================================================================
    // 11. GET /api/pay-out-manual — List
    // =========================================================================

    @GetMapping(
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> list(
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestParam(value = "sort", required = false) List<String> sort,
            @RequestParam(value = "STATUS", required = false) List<String> statuses,
            @RequestParam(value = "CHANNEL", required = false) String channel,
            @RequestParam(value = "PAYMENT_DATE_FROM", required = false) LocalDate paymentDateFrom,
            @RequestParam(value = "PAYMENT_DATE_TO", required = false) LocalDate paymentDateTo,
            @RequestParam(value = "AMOUNT_FROM", required = false) Double amountFrom,
            @RequestParam(value = "AMOUNT_TO", required = false) Double amountTo,
            @RequestParam(value = "REF_NO", required = false) String refNo,
            @RequestParam(value = "CREATED_BY", required = false) String createdBy,
            @RequestParam(value = "KBNN_ID", required = false) String kbnnId,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.READ);

        StringBuilder queryParams = new StringBuilder("?page=").append(page)
                .append("&size=").append(size);

        if (sort != null) {
            for (String s : sort) {
                queryParams.append("&sort=").append(s);
            }
        }
        if (statuses != null) {
            for (String status : statuses) {
                queryParams.append("&status=").append(status);
            }
        }
        if (channel != null) queryParams.append("&channel=").append(channel);
        if (paymentDateFrom != null) queryParams.append("&paymentDateFrom=").append(paymentDateFrom);
        if (paymentDateTo != null) queryParams.append("&paymentDateTo=").append(paymentDateTo);
        if (amountFrom != null) queryParams.append("&amountFrom=").append(amountFrom);
        if (amountTo != null) queryParams.append("&amountTo=").append(amountTo);
        if (refNo != null) queryParams.append("&refNo=").append(refNo);
        if (createdBy != null) queryParams.append("&createdBy=").append(createdBy);
        if (kbnnId != null) queryParams.append("&kbnnId=").append(kbnnId);

        return proxyNoBody(HttpMethod.GET, INTERNAL_BASE + queryParams, null, requestId);
    }

    // =========================================================================
    // 12. POST /api/pay-out-manual/export — Export
    // =========================================================================

    @PostMapping(
            value = "/export",
            consumes = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<byte[]> export(
            @Valid @RequestBody byte[] requestBody,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.EXPORT);

        WebClient.RequestHeadersSpec<?> spec = lttWebClient.post()
                .uri(INTERNAL_BASE + "/export")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestBody);

        spec = addUserContextHeaders(spec, idempotencyKey, null, requestId);

        byte[] response = spec.retrieve()
                .bodyToMono(byte[].class)
                .block();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(response);
    }

    // =========================================================================
    // 13. POST /api/pay-out-manual/{id}/attachments — Upload
    // =========================================================================

    @PostMapping(
            value = "/{id}/attachments",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> uploadAttachment(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file,
            @RequestParam("docType") String docType,
            @RequestParam(value = "note", required = false) String note,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.UPDATE);

        org.springframework.core.io.ByteArrayResource fileResource;
        try {
            fileResource = new org.springframework.core.io.ByteArrayResource(file.getBytes()) {
                @Override
                public String getFilename() {
                    return file.getOriginalFilename();
                }
            };
        } catch (Exception e) {
            throw new RuntimeException("Failed to read uploaded file", e);
        }

        org.springframework.http.client.MultipartBodyBuilder bodyBuilder =
                new org.springframework.http.client.MultipartBodyBuilder();
        bodyBuilder.part("file", fileResource)
                .contentType(MediaType.parseMediaType(
                        file.getContentType() != null ? file.getContentType() : MediaType.APPLICATION_OCTET_STREAM_VALUE));
        bodyBuilder.part("docType", docType);
        if (note != null) {
            bodyBuilder.part("note", note);
        }

        WebClient.RequestHeadersSpec<?> spec = lttWebClient.post()
                .uri(INTERNAL_BASE + "/" + id + "/attachments")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(bodyBuilder.build()));

        spec = addUserContextHeaders(spec, idempotencyKey, null, requestId);

        String response = spec.retrieve()
                .bodyToMono(String.class)
                .block();

        return ResponseEntity.status(201).body(response);
    }

    // =========================================================================
    // 14. GET /api/pay-out-manual/{id}/attachments — List attachments
    // =========================================================================

    @GetMapping(
            value = "/{id}/attachments",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> listAttachments(
            @PathVariable String id,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.READ);

        return proxyNoBody(HttpMethod.GET, INTERNAL_BASE + "/" + id + "/attachments",
                null, requestId);
    }

    // =========================================================================
    // 15. GET /api/pay-out-manual/{id}/attachments/{attachId} — Download
    // =========================================================================

    @GetMapping(
            value = "/{id}/attachments/{attachId}",
            produces = MediaType.APPLICATION_OCTET_STREAM_VALUE
    )
    public ResponseEntity<byte[]> downloadAttachment(
            @PathVariable String id,
            @PathVariable String attachId,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.READ);

        JwtAuthToken jwtAuth = getJwtAuth();

        byte[] body = lttWebClient.get()
                .uri(INTERNAL_BASE + "/" + id + "/attachments/" + attachId)
                .header("X-User-Id", jwtAuth.getUserId())
                .header("X-User-Roles", String.join(",", jwtAuth.getRoles()))
                .header("X-Kbnn-Id", Optional.ofNullable(jwtAuth.getKbnnId()).orElse(""))
                .retrieve()
                .bodyToMono(byte[].class)
                .block();

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(body);
    }

    // =========================================================================
    // 16. DELETE /api/pay-out-manual/{id}/attachments/{attachId} — Delete attachment
    // =========================================================================

    @DeleteMapping(
            value = "/{id}/attachments/{attachId}",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> deleteAttachment(
            @PathVariable String id,
            @PathVariable String attachId,
            @RequestHeader(value = "X-Idempotency-Key", required = false) String idempotencyKey,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.DELETE);

        return proxyNoBody(HttpMethod.DELETE,
                INTERNAL_BASE + "/" + id + "/attachments/" + attachId,
                null, requestId, idempotencyKey);
    }

    // =========================================================================
    // 17. GET /api/pay-out-manual/{id}/audit-log — Audit log
    // =========================================================================

    @GetMapping(
            value = "/{id}/audit-log",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> getAuditLog(
            @PathVariable String id,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.READ);

        return proxyNoBody(HttpMethod.GET,
                INTERNAL_BASE + "/" + id + "/audit-log?page=" + page + "&size=" + size,
                null, requestId);
    }

    // =========================================================================
    // 18. GET /api/pay-out-manual/{id}/approval-status — Approval status
    // =========================================================================

    @GetMapping(
            value = "/{id}/approval-status",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> getApprovalStatus(
            @PathVariable String id,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.READ);

        return proxyNoBody(HttpMethod.GET, INTERNAL_BASE + "/" + id + "/approval-status",
                null, requestId);
    }

    // =========================================================================
    // 19. POST /api/pay-out-manual/{id}/validate-ccid — Validate CCID
    // =========================================================================

    @PostMapping(
            value = "/{id}/validate-ccid",
            consumes = MediaType.APPLICATION_JSON_VALUE,
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> validateCcid(
            @PathVariable String id,
            @Valid @RequestBody String requestBody,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.CREATE);

        return proxyWithBody(HttpMethod.POST, INTERNAL_BASE + "/" + id + "/validate-ccid",
                requestBody, null, null, requestId);
    }

    // =========================================================================
    // 20. GET /api/pay-out-manual/lookup/{type} — Lookup
    // =========================================================================

    @GetMapping(
            value = "/lookup/{type}",
            produces = MediaType.APPLICATION_JSON_VALUE
    )
    public ResponseEntity<String> lookup(
            @PathVariable String type,
            @RequestParam(value = "q", required = false) String query,
            @RequestParam(value = "parentCode", required = false) String parentCode,
            @RequestParam(value = "page", defaultValue = "0") int page,
            @RequestParam(value = "size", defaultValue = "20") int size,
            @RequestHeader(value = "X-Request-Id", required = false) String requestId,
            HttpServletRequest httpRequest
    ) {
        rbacChecker.checkPermission(PermissionCodes.READ);

        StringBuilder queryParams = new StringBuilder("?page=").append(page)
                .append("&size=").append(size);
        if (query != null) queryParams.append("&q=").append(query);
        if (parentCode != null) queryParams.append("&parentCode=").append(parentCode);

        return proxyNoBody(HttpMethod.GET,
                INTERNAL_BASE + "/lookup/" + type + queryParams,
                null, requestId);
    }

    // =========================================================================
    // Proxy helper methods
    // =========================================================================

    /**
     * Proxy a request with a JSON body to ltt-service.
     */
    private ResponseEntity<String> proxyWithBody(
            HttpMethod method,
            String path,
            String body,
            String idempotencyKey,
            String ifMatch,
            String requestId
    ) {
        JwtAuthToken jwtAuth = getJwtAuth();

        WebClient.RequestBodySpec requestSpec = lttWebClient.method(method)
                .uri(path)
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON);

        requestSpec = applyCommonHeaders(requestSpec, jwtAuth, idempotencyKey, ifMatch, requestId);

        String response = requestSpec
                .bodyValue(body)
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return ResponseEntity.ok(response);
    }

    /**
     * Proxy a request without a body to ltt-service.
     */
    private ResponseEntity<String> proxyNoBody(
            HttpMethod method,
            String path,
            String ifMatch,
            String requestId
    ) {
        return proxyNoBody(method, path, ifMatch, requestId, null);
    }

    /**
     * Proxy a request without a body to ltt-service (with optional idempotency key).
     */
    private ResponseEntity<String> proxyNoBody(
            HttpMethod method,
            String path,
            String ifMatch,
            String requestId,
            String idempotencyKey
    ) {
        JwtAuthToken jwtAuth = getJwtAuth();

        WebClient.RequestBodySpec requestSpec = lttWebClient.method(method)
                .uri(path)
                .accept(MediaType.APPLICATION_JSON);

        requestSpec = applyCommonHeaders(requestSpec, jwtAuth, idempotencyKey, ifMatch, requestId);

        String response = requestSpec
                .retrieve()
                .bodyToMono(String.class)
                .block();

        return ResponseEntity.ok(response);
    }

    /**
     * Apply common headers (user context, idempotency, ETag, request ID) to a request spec.
     */
    private WebClient.RequestBodySpec applyCommonHeaders(
            WebClient.RequestBodySpec spec,
            JwtAuthToken jwtAuth,
            String idempotencyKey,
            String ifMatch,
            String requestId
    ) {
        spec.header("X-User-Id", jwtAuth.getUserId());
        spec.header("X-User-Roles", String.join(",", jwtAuth.getRoles()));
        spec.header("X-Kbnn-Id", Optional.ofNullable(jwtAuth.getKbnnId()).orElse(""));

        if (idempotencyKey != null) {
            spec.header("X-Idempotency-Key", idempotencyKey);
        }
        if (ifMatch != null) {
            spec.header("If-Match", ifMatch);
        }
        if (requestId != null) {
            spec.header("X-Request-Id", requestId);
        }

        return spec;
    }

    /**
     * Add user context headers to a RequestHeadersSpec (used for multipart and binary requests).
     */
    private WebClient.RequestHeadersSpec<?> addUserContextHeaders(
            WebClient.RequestHeadersSpec<?> spec,
            String idempotencyKey,
            String ifMatch,
            String requestId
    ) {
        JwtAuthToken jwtAuth = getJwtAuth();

        spec.header("X-User-Id", jwtAuth.getUserId());
        spec.header("X-User-Roles", String.join(",", jwtAuth.getRoles()));
        spec.header("X-Kbnn-Id", Optional.ofNullable(jwtAuth.getKbnnId()).orElse(""));

        if (idempotencyKey != null) {
            spec.header("X-Idempotency-Key", idempotencyKey);
        }
        if (ifMatch != null) {
            spec.header("If-Match", ifMatch);
        }
        if (requestId != null) {
            spec.header("X-Request-Id", requestId);
        }

        return spec;
    }

    /**
     * Extract the JwtAuthToken from the current SecurityContext.
     */
    private JwtAuthToken getJwtAuth() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof JwtAuthToken jwtAuth) {
            return jwtAuth;
        }
        throw new IllegalStateException("No JWT authentication found in security context");
    }
}
