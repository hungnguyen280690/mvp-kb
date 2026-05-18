package com.kb.ltt.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "approval_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_order_id", nullable = false)
    private PaymentOrder paymentOrder;

    @Column(name = "version", nullable = false)
    private Integer version;

    @Column(name = "actor", nullable = false, length = 40)
    private String actor;

    @Column(name = "actor_role", nullable = false, length = 30)
    private String actorRole;

    @Column(name = "actor_display_name", length = 100)
    private String actorDisplayName;

    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @Column(name = "status_from", length = 30)
    private String statusFrom;

    @Column(name = "status_to", length = 30)
    private String statusTo;

    @Column(name = "note", length = 500)
    private String note;

    @Column(name = "auth_method", length = 20)
    private String authMethod;

    @Column(name = "otp_code", length = 6)
    private String otpCode;

    @Column(name = "cert_serial", length = 100)
    private String certSerial;

    @Column(name = "client_ip", length = 45)
    private String clientIp;

    @Column(name = "host_name", length = 100)
    private String hostName;

    @Column(name = "channel", length = 20)
    @Builder.Default
    private String channel = "WEB";

    @Column(name = "action_date", nullable = false)
    private LocalDateTime actionDate;

    @Column(name = "checklist_json", columnDefinition = "CLOB")
    private String checklistJson;

    @PrePersist
    protected void onCreate() {
        if (actionDate == null) {
            actionDate = LocalDateTime.now();
        }
    }
}
