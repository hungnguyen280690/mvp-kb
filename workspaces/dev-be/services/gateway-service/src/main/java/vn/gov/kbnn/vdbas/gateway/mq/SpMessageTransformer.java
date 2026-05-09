package vn.gov.kbnn.vdbas.gateway.mq;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Transform LTT event sang SP message format (NHTM song phuong).
 * Dua tren AsyncAPI GatewaySpPayload schema.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SpMessageTransformer {

    private final ObjectMapper objectMapper;

    public String transform(Map<String, Object> eventPayload) {
        try {
            Map<String, Object> spMessage = Map.of(
                    "correlationId", eventPayload.getOrDefault("correlationId", ""),
                    "requestId", eventPayload.getOrDefault("requestNumber", ""),
                    "channel", "SP",
                    "toBankCode", eventPayload.getOrDefault("receiverBankCode", ""),
                    "toBankName", eventPayload.getOrDefault("receiverBankName", ""),
                    "fromAccount", eventPayload.getOrDefault("senderAccount", ""),
                    "toAccount", eventPayload.getOrDefault("receiverAccount", ""),
                    "amount", eventPayload.getOrDefault("amount", 0),
                    "currency", eventPayload.getOrDefault("currency", "VND"),
                    "originalDocNo", eventPayload.getOrDefault("originalDocNo", ""),
                    "originalDocDate", eventPayload.getOrDefault("originalDocDate", ""),
                    "narrative", eventPayload.getOrDefault("paymentContent", ""),
                    "signedJson", eventPayload.getOrDefault("signedJson", ""),
                    "signature", eventPayload.getOrDefault("signature", "")
            );
            return objectMapper.writeValueAsString(spMessage);
        } catch (Exception e) {
            log.error("Failed to transform SP message", e);
            throw new RuntimeException("SP message transform failed", e);
        }
    }
}
