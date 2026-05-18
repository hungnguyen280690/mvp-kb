package com.kb.ltt.api.controller;

import com.kb.ltt.api.dto.*;
import com.kb.ltt.domain.model.enums.OrderStatus;
import com.kb.ltt.domain.service.PaymentOrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/v1/payment-orders")
@RequiredArgsConstructor
public class PaymentOrderController {

    private final PaymentOrderService service;

    @GetMapping
    public ResponseEntity<PageResponse<PaymentOrderListResponse>> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) List<OrderStatus> status,
            @RequestParam(required = false) String sender,
            @RequestParam(required = false) String channel,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime fromDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime toDate) {
        return ResponseEntity.ok(service.list(status, sender, channel, fromDate, toDate, page, size));
    }

    @PostMapping
    public ResponseEntity<PaymentOrderResponse> create(
            @Valid @RequestBody CreatePaymentOrderRequest request,
            @RequestHeader(value = "X-User", defaultValue = "system") String currentUser) {
        PaymentOrderResponse response = service.create(request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PaymentOrderResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PaymentOrderResponse> update(
            @PathVariable Long id,
            @RequestHeader("If-Match") Integer ifMatch,
            @Valid @RequestBody UpdatePaymentOrderRequest request,
            @RequestHeader(value = "X-User", defaultValue = "system") String currentUser) {
        return ResponseEntity.ok(service.update(id, ifMatch, request, currentUser));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @RequestHeader("If-Match") Integer ifMatch,
            @RequestBody DeleteRequest deleteRequest,
            @RequestHeader(value = "X-User", defaultValue = "system") String currentUser) {
        service.delete(id, ifMatch, deleteRequest.getReason(), currentUser);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/submit")
    public ResponseEntity<PaymentOrderResponse> submit(
            @PathVariable Long id,
            @RequestHeader("If-Match") Integer ifMatch,
            @RequestHeader(value = "X-User", defaultValue = "system") String currentUser) {
        return ResponseEntity.ok(service.submit(id, ifMatch, currentUser));
    }

    @PostMapping("/{id}/approval/check")
    public ResponseEntity<PaymentOrderResponse> check(
            @PathVariable Long id,
            @RequestHeader("If-Match") Integer ifMatch,
            @RequestBody ApprovalRequest request,
            @RequestHeader(value = "X-User", defaultValue = "system") String currentUser) {
        return ResponseEntity.ok(service.check(id, ifMatch, request, currentUser));
    }

    @PostMapping("/{id}/approval/approve")
    public ResponseEntity<PaymentOrderResponse> approve(
            @PathVariable Long id,
            @RequestHeader("If-Match") Integer ifMatch,
            @RequestBody ApprovalRequest request,
            @RequestHeader(value = "X-User", defaultValue = "system") String currentUser) {
        return ResponseEntity.ok(service.approve(id, ifMatch, request, currentUser));
    }

    @PostMapping("/{id}/approval/reject")
    public ResponseEntity<PaymentOrderResponse> reject(
            @PathVariable Long id,
            @RequestHeader("If-Match") Integer ifMatch,
            @RequestBody ApprovalRequest request,
            @RequestHeader(value = "X-User", defaultValue = "system") String currentUser) {
        return ResponseEntity.ok(service.reject(id, ifMatch, request, currentUser));
    }

    @PostMapping("/{id}/approval/return")
    public ResponseEntity<PaymentOrderResponse> returnToMaker(
            @PathVariable Long id,
            @RequestHeader("If-Match") Integer ifMatch,
            @RequestBody ApprovalRequest request,
            @RequestHeader(value = "X-User", defaultValue = "system") String currentUser) {
        return ResponseEntity.ok(service.returnToMaker(id, ifMatch, request, currentUser));
    }
}
