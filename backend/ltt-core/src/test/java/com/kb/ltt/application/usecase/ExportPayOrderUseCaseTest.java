package com.kb.ltt.application.usecase;

import com.kb.ltt.application.dto.PayOrderFilter;
import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.infrastructure.BaseIntegrationTest;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Integration tests for ExportPayOrderUseCase.
 */
@DisplayName("ExportPayOrderUseCase — integration")
class ExportPayOrderUseCaseTest extends BaseIntegrationTest {

    @Autowired
    ExportPayOrderUseCase exportUseCase;

    @Autowired
    PayOrderRepository payOrderRepository;

    private static final UserContext MAKER = new UserContext(
            "user-maker-01", List.of("PAY_OUT_MAKER"), "HN001", "127.0.0.1");

    @BeforeEach
    void setUp() {
        // Save one draft order to export
        payOrderRepository.save(PayOrderTestHelper.buildDraftEntity("HN001", "user-maker-01"));
    }

    @Test
    @DisplayName("export CSV with 1 record → bytes not empty, starts with BOM")
    void export_csv_returnsNonEmptyBytes() {
        PayOrderFilter filter = PayOrderFilter.builder()
                .kbnnId("HN001")
                .build();

        byte[] result = exportUseCase.export(
                new ExportPayOrderUseCase.ExportRequest("CSV", filter),
                MAKER);

        assertThat(result).isNotEmpty();
        // CSV should contain the header
        String content = new String(result, java.nio.charset.StandardCharsets.UTF_8);
        assertThat(content).contains("Mã CT");
    }

    @Test
    @DisplayName("export EXCEL with 1 record → bytes not empty (valid XLSX)")
    void export_excel_returnsNonEmptyBytes() {
        PayOrderFilter filter = PayOrderFilter.builder()
                .kbnnId("HN001")
                .build();

        byte[] result = exportUseCase.export(
                new ExportPayOrderUseCase.ExportRequest("EXCEL", filter),
                MAKER);

        assertThat(result).isNotEmpty();
        // XLSX starts with PK (ZIP magic bytes)
        assertThat(result[0]).isEqualTo((byte) 'P');
        assertThat(result[1]).isEqualTo((byte) 'K');
    }

    @Test
    @DisplayName("export PDF → returns placeholder bytes")
    void export_pdf_returnsPlaceholder() {
        PayOrderFilter filter = PayOrderFilter.builder().build();

        byte[] result = exportUseCase.export(
                new ExportPayOrderUseCase.ExportRequest("PDF", filter),
                MAKER);

        assertThat(result).isNotEmpty();
        String content = new String(result, java.nio.charset.StandardCharsets.UTF_8);
        assertThat(content).contains("PDF export not fully implemented");
    }
}
