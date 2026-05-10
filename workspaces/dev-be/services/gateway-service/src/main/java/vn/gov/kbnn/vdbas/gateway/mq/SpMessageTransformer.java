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
            Map<String, Object> spMessage = Map.ofEntries(
                    Map.entry("correlationId", eventPayload.getOrDefault("correlationId", "")),
                    Map.entry("requestId", eventPayload.getOrDefault("requestNumber", "")),
                    Map.entry("channel", "SP"),
                    Map.entry("toBankCode", eventPayload.getOrDefault("receiverBankCode", "")),
                    Map.entry("toBankName", eventPayload.getOrDefault("receiverBankName", "")),
                    Map.entry("fromAccount", eventPayload.getOrDefault("senderAccount", "")),
                    Map.entry("toAccount", eventPayload.getOrDefault("receiverAccount", "")),
                    Map.entry("amount", eventPayload.getOrDefault("amount", 0)),
                    Map.entry("currency", eventPayload.getOrDefault("currency", "VND")),
                    Map.entry("originalDocNo", eventPayload.getOrDefault("originalDocNo", "")),
                    Map.entry("originalDocDate", eventPayload.getOrDefault("originalDocDate", "")),
                    Map.entry("narrative", eventPayload.getOrDefault("paymentContent", "")),
                    Map.entry("signedJson", eventPayload.getOrDefault("signedJson", "")),
                    Map.entry("signature", eventPayload.getOrDefault("signature", ""))
            );
            return objectMapper.writeValueAsString(spMessage);
        } catch (Exception e) {
            log.error("Failed to transform SP message", e);
            throw new RuntimeException("SP message transform failed", e);
        }
    }
}
