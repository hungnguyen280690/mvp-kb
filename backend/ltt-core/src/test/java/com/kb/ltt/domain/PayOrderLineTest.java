package com.kb.ltt.domain;

import com.kb.ltt.domain.model.PayOrderLine;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Basic construction and value tests for PayOrderLine.
 */
class PayOrderLineTest {

    @Test
    @DisplayName("Builder creates PayOrderLine with all fields set")
    void builder_all_fields() {
        String id = UUID.randomUUID().toString();
        String orderId = UUID.randomUUID().toString();

        PayOrderLine line = PayOrderLine.builder()
                .id(id)
                .orderId(orderId)
                .lineNum(1)
                .lineAmount(BigDecimal.valueOf(500_000))
                .lineDescription("Chi phí văn phòng")
                .ccidSegment1("SEG1")
                .ccidSegment2("SEG2")
                .ccidSegment3("SEG3")
                .ccidSegment4("SEG4")
                .ccidSegment5("SEG5")
                .ccidSegment6("SEG6")
                .ccidSegment7("SEG7")
                .ccidSegment8("SEG8")
                .ccidSegment9("SEG9")
                .ccidSegment10("SEG10")
                .ccidSegment11("SEG11")
                .ccidSegment12("SEG12")
                .build();

        assertThat(line.getId()).isEqualTo(id);
        assertThat(line.getOrderId()).isEqualTo(orderId);
        assertThat(line.getLineNum()).isEqualTo(1);
        assertThat(line.getLineAmount()).isEqualByComparingTo(BigDecimal.valueOf(500_000));
        assertThat(line.getLineDescription()).isEqualTo("Chi phí văn phòng");
        assertThat(line.getCcidSegment1()).isEqualTo("SEG1");
        assertThat(line.getCcidSegment12()).isEqualTo("SEG12");
    }

    @Test
    @DisplayName("Builder creates PayOrderLine with only mandatory fields")
    void builder_minimal() {
        PayOrderLine line = PayOrderLine.builder()
                .id(UUID.randomUUID().toString())
                .orderId(UUID.randomUUID().toString())
                .lineNum(1)
                .lineAmount(BigDecimal.TEN)
                .build();

        assertThat(line.getLineNum()).isEqualTo(1);
        assertThat(line.getLineAmount()).isEqualByComparingTo(BigDecimal.TEN);
        assertThat(line.getCcidSegment1()).isNull();
    }

    @Test
    @DisplayName("toBuilder produces an independent copy")
    void toBuilder_produces_copy() {
        PayOrderLine original = PayOrderLine.builder()
                .id("id-1")
                .orderId("order-1")
                .lineNum(1)
                .lineAmount(BigDecimal.valueOf(100))
                .lineDescription("original")
                .build();

        PayOrderLine copy = original.toBuilder()
                .lineDescription("updated")
                .build();

        assertThat(original.getLineDescription()).isEqualTo("original");
        assertThat(copy.getLineDescription()).isEqualTo("updated");
        assertThat(copy.getLineNum()).isEqualTo(1);
    }

    @Test
    @DisplayName("All 12 COA segments are independently readable")
    void all_12_segments_readable() {
        PayOrderLine line = PayOrderLine.builder()
                .id("id-1")
                .orderId("order-1")
                .lineNum(1)
                .lineAmount(BigDecimal.ONE)
                .ccidSegment1("A").ccidSegment2("B").ccidSegment3("C")
                .ccidSegment4("D").ccidSegment5("E").ccidSegment6("F")
                .ccidSegment7("G").ccidSegment8("H").ccidSegment9("I")
                .ccidSegment10("J").ccidSegment11("K").ccidSegment12("L")
                .build();

        assertThat(line.getCcidSegment1()).isEqualTo("A");
        assertThat(line.getCcidSegment2()).isEqualTo("B");
        assertThat(line.getCcidSegment3()).isEqualTo("C");
        assertThat(line.getCcidSegment4()).isEqualTo("D");
        assertThat(line.getCcidSegment5()).isEqualTo("E");
        assertThat(line.getCcidSegment6()).isEqualTo("F");
        assertThat(line.getCcidSegment7()).isEqualTo("G");
        assertThat(line.getCcidSegment8()).isEqualTo("H");
        assertThat(line.getCcidSegment9()).isEqualTo("I");
        assertThat(line.getCcidSegment10()).isEqualTo("J");
        assertThat(line.getCcidSegment11()).isEqualTo("K");
        assertThat(line.getCcidSegment12()).isEqualTo("L");
    }
}
