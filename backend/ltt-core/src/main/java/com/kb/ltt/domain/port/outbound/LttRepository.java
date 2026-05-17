package com.kb.ltt.domain.port.outbound;

import com.kb.ltt.domain.model.LttDetail;
import com.kb.ltt.domain.model.LttFilterRequest;
import com.kb.ltt.domain.model.LttHeader;
import com.kb.ltt.domain.model.LttReceiver;
import com.kb.ltt.domain.model.LttSender;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * Outbound port for LTT persistence operations.
 * This interface is defined by the domain layer and implemented by the infrastructure layer.
 *
 * Follows Hexagonal Architecture: domain defines the port, infrastructure provides the adapter.
 *
 * // FT-001: LTT repository port
 */
public interface LttRepository {

    // --- LttHeader operations ---

    LttHeader saveHeader(LttHeader header);

    Optional<LttHeader> findHeaderById(Long id);

    /**
     * Find header by idempotency key for duplicate detection (Rule 2.3).
     *
     * @param idempotencyKey the X-Request-ID value
     * @return existing header if found
     */
    Optional<LttHeader> findHeaderByIdempotencyKey(String idempotencyKey);

    /**
     * Search LTT headers with dynamic filtering and pagination.
     *
     * @param filter   search criteria
     * @param pageable pagination and sorting
     * @return paginated results
     */
    Page<LttHeader> searchHeaders(LttFilterRequest filter, Pageable pageable);

    // --- LttDetail operations ---

    List<LttDetail> findDetailsByLttId(Long lttId);

    LttDetail saveDetail(LttDetail detail);

    List<LttDetail> saveAllDetails(List<LttDetail> details);

    void deleteDetailsByLttId(Long lttId);

    // --- LttSender operations ---

    Optional<LttSender> findSenderByLttId(Long lttId);

    LttSender saveSender(LttSender sender);

    // --- LttReceiver operations ---

    Optional<LttReceiver> findReceiverByLttId(Long lttId);

    LttReceiver saveReceiver(LttReceiver receiver);
}
