package vn.gov.kbnn.vdbas.gateway.mq;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Transform LTT event sang LKB message format (Lien kho bac).
 * Dua tren AsyncAPI GatewayLkbPayload schema.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LkbMessageTransformer {

    private final ObjectMapper objectMapper;

    public String transform(Map<String, Object> eventPayload) {
        try {
            Map<String, Object> lkbMessage = Map.of(
                    "correlationId", eventPayload.getOrDefault("correlationId", ""),
                    "requestId", eventPayload.getOrDefault("requestNumber", ""),
                    "channel", "LKB",
                    "fromTreasury", eventPayload.getOrDefault("senderBankCode", ""),
                    "toTreasury", eventPayload.getOrDefault("receiverBankCode", ""),
                    "account", eventPayload.getOrDefault("senderAccount", ""),
                    "amount", eventPayload.getOrDefault("amount", 0),
                    "narrative", eventPayload.getOrDefault("paymentContent", ""),
                    "signedJson", eventPayload.getOrDefault("signedJson", "")
            );
            return objectMapper.writeValueAsString(lkbMessage);
        } catch (Exception e) {
            log.error("Failed to transform LKB message", e);
            throw new RuntimeException("LKB message transform failed", e);
        }
    }
}
