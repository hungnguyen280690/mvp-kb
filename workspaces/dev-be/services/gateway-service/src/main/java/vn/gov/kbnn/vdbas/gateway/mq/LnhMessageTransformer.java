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
            Map<String, Object> lnhMessage = Map.of(
                    "correlationId", eventPayload.getOrDefault("correlationId", ""),
                    "requestId", eventPayload.getOrDefault("requestNumber", ""),
                    "channel", "LNH",
                    "orderType", eventPayload.getOrDefault("orderType", ""),
                    "fromBank", eventPayload.getOrDefault("senderBankCode", ""),
                    "toBank", eventPayload.getOrDefault("receiverBankCode", ""),
                    "fromAccount", eventPayload.getOrDefault("senderAccount", ""),
                    "toAccount", eventPayload.getOrDefault("receiverAccount", ""),
                    "amount", eventPayload.getOrDefault("amount", 0),
                    "currency", eventPayload.getOrDefault("currency", "VND"),
                    "valueDate", eventPayload.getOrDefault("paymentDate", ""),
                    "remark", eventPayload.getOrDefault("paymentContent", ""),
                    "signedXml", eventPayload.getOrDefault("signedXml", ""),
                    "signature", eventPayload.getOrDefault("signature", ""),
                    "signerCert", eventPayload.getOrDefault("signerCert", "")
            );
            return objectMapper.writeValueAsString(lnhMessage);
        } catch (Exception e) {
            log.error("Failed to transform LNH message", e);
            throw new RuntimeException("LNH message transform failed", e);
        }
    }
}
