package com.kb.ltt.application.usecase;

import com.kb.ltt.application.dto.AttachmentResponse;
import com.kb.ltt.application.model.UserContext;
import com.kb.ltt.domain.exception.BusinessException;
import com.kb.ltt.infrastructure.BaseIntegrationTest;
import com.kb.ltt.infrastructure.persistence.entity.PayOrderEntity;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderAttachmentRepository;
import com.kb.ltt.infrastructure.persistence.repository.PayOrderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.util.ReflectionTestUtils;

import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Integration tests for AttachmentUseCase.
 */
@DisplayName("AttachmentUseCase — integration")
class AttachmentUseCaseTest extends BaseIntegrationTest {

    @TempDir
    Path tempDir;

    @Autowired
    AttachmentUseCase attachmentUseCase;

    @Autowired
    PayOrderRepository payOrderRepository;

    @Autowired
    PayOrderAttachmentRepository attachmentRepository;

    private static final UserContext MAKER = new UserContext(
            "user-maker-01", List.of("PAY_OUT_MAKER"), "HN001", "127.0.0.1");

    private PayOrderEntity savedOrder;

    @BeforeEach
    void setUp() {
        // Override storage path to tempDir for test isolation
        ReflectionTestUtils.setField(attachmentUseCase, "storagePath", tempDir.toString());

        savedOrder = PayOrderTestHelper.buildDraftEntity("HN001", "user-maker-01");
        savedOrder = payOrderRepository.save(savedOrder);
    }

    @Test
    @DisplayName("upload → AttachmentResponse returned with correct fields")
    void upload_happyPath_returnsResponse() {
        byte[] bytes = "PDF content here".getBytes();

        AttachmentResponse resp = attachmentUseCase.upload(
                savedOrder.getId(), "test.pdf", "application/pdf",
                bytes, "Test attachment", MAKER, UUID.randomUUID().toString());

        assertThat(resp).isNotNull();
        assertThat(resp.getId()).isNotNull();
        assertThat(resp.getOrderId()).isEqualTo(savedOrder.getId());
        assertThat(resp.getFileName()).isEqualTo("test.pdf");
        assertThat(resp.getFileSizeBytes()).isEqualTo(bytes.length);
        assertThat(resp.getSha256()).isNotBlank();
        assertThat(resp.getUploadedBy()).isEqualTo("user-maker-01");
        assertThat(resp.getIsDeleted()).isFalse();
    }

    @Test
    @DisplayName("upload then list → list includes uploaded attachment")
    void upload_thenList_includesAttachment() {
        byte[] bytes = "PDF content".getBytes();
        attachmentUseCase.upload(
                savedOrder.getId(), "doc.pdf", "application/pdf",
                bytes, "desc", MAKER, UUID.randomUUID().toString());

        List<AttachmentResponse> list = attachmentUseCase.list(savedOrder.getId());

        assertThat(list).hasSize(1);
        assertThat(list.get(0).getFileName()).isEqualTo("doc.pdf");
    }

    @Test
    @DisplayName("upload then delete → isDeleted=true")
    void upload_thenDelete_marksDeleted() {
        byte[] bytes = "content".getBytes();
        AttachmentResponse uploaded = attachmentUseCase.upload(
                savedOrder.getId(), "file.pdf", "application/pdf",
                bytes, "desc", MAKER, UUID.randomUUID().toString());

        Map<String, Object> result = attachmentUseCase.delete(
                uploaded.getId(), savedOrder.getId(), MAKER, UUID.randomUUID().toString());

        assertThat(result.get("id")).isEqualTo(uploaded.getId());

        // List should now be empty (deleted entries excluded)
        List<AttachmentResponse> list = attachmentUseCase.list(savedOrder.getId());
        assertThat(list).isEmpty();
    }

    @Test
    @DisplayName("upload > 10MB → BusinessException")
    void upload_oversizedFile_throwsBusinessException() {
        byte[] bigBytes = new byte[11 * 1024 * 1024]; // 11MB

        assertThatThrownBy(() -> attachmentUseCase.upload(
                savedOrder.getId(), "big.pdf", "application/pdf",
                bigBytes, "too big", MAKER, UUID.randomUUID().toString()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("10MB");
    }

    @Test
    @DisplayName("upload with invalid content type → BusinessException")
    void upload_invalidContentType_throwsBusinessException() {
        byte[] bytes = "exe content".getBytes();

        assertThatThrownBy(() -> attachmentUseCase.upload(
                savedOrder.getId(), "malware.exe", "application/x-msdownload",
                bytes, "bad file", MAKER, UUID.randomUUID().toString()))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("không được hỗ trợ");
    }
}
