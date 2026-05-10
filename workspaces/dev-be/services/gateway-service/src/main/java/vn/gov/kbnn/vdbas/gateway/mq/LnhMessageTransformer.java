package vn.gov.kbnn.vdbas.gateway.mq;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Transform LTT event sang LNH message format (NHNN/CITAD).
 * Dua tren AsyncAPI GatewayLnhPayload schema.
 * Format: JSON voi signature XML.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LnhMessageTransformer {

    private final ObjectMapper objectMapper;

    /**
     * Transform internal event payload sang LNH gateway message.
     *
     * @param eventPayload payload tu outbox event
     * @return LNH-formatted message ready to send
     */
    public String transform(Map<String, Object> eventPayload) {
        try {
            Map<String, Object> lnhMessage = Map.ofEntries(
                    Map.entry("correlationId", eventPayload.getOrDefault("correlationId", "")),
                    Map.entry("requestId", eventPayload.getOrDefault("requestNumber", "")),
                    Map.entry("channel", "LNH"),
                    Map.entry("orderType", eventPayload.getOrDefault("orderType", "")),
                    Map.entry("fromBank", eventPayload.getOrDefault("senderBankCode", "")),
                    Map.entry("toBank", eventPayload.getOrDefault("receiverBankCode", "")),
                    Map.entry("fromAccount", eventPayload.getOrDefault("senderAccount", "")),
                    Map.entry("toAccount", eventPayload.getOrDefault("receiverAccount", "")),
                    Map.entry("amount", eventPayload.getOrDefault("amount", 0)),
                    Map.entry("currency", eventPayload.getOrDefault("currency", "VND")),
                    Map.entry("valueDate", eventPayload.getOrDefault("paymentDate", "")),
                    Map.entry("remark", eventPayload.getOrDefault("paymentContent", "")),
                    Map.entry("signedXml", eventPayload.getOrDefault("signedXml", "")),
                    Map.entry("signature", eventPayload.getOrDefault("signature", "")),
                    Map.entry("signerCert", eventPayload.getOrDefault("signerCert", ""))
            );
            return objectMapper.writeValueAsString(lnhMessage);
        } catch (Exception e) {
            log.error("Failed to transform LNH message", e);
            throw new RuntimeException("LNH message transform failed", e);
        }
    }
}
