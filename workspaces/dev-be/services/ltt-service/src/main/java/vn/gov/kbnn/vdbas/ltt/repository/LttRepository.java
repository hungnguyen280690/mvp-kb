package vn.gov.kbnn.vdbas.ltt.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.gov.kbnn.vdbas.ltt.domain.entity.Ltt;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface LttRepository extends JpaRepository<Ltt, Long> {

    Optional<Ltt> findByIdAndIsDeletedFalse(Long id);

    Optional<Ltt> findByIdempotencyKey(String idempotencyKey);

    Optional<Ltt> findByCorrelationId(String correlationId);

    /**
     * Tim kiem LTT theo cac tieu chi (BIZ-001).
     * Chi tra ve LTT chua xoa.
     */
    @Query("SELECT l FROM Ltt l WHERE l.isDeleted = false " +
            "AND (:channel IS NULL OR l.channel = :channel) " +
            "AND (:orderType IS NULL OR l.orderType = :orderType) " +
            "AND (:status IS NULL OR l.state = :status) " +
            "AND (:unitCode IS NULL OR l.unitCode = :unitCode) " +
            "AND (:paymentDateFrom IS NULL OR l.paymentDate >= :paymentDateFrom) " +
            "AND (:paymentDateTo IS NULL OR l.paymentDate <= :paymentDateTo) " +
            "AND (:requestNumber IS NULL OR l.soYctt LIKE %:requestNumber%) " +
            "AND (:senderBankCode IS NULL OR l.senderBankCode = :senderBankCode) " +
            "AND (:receiverBankCode IS NULL OR l.receiverBankCode = :receiverBankCode) " +
            "AND (:amountFrom IS NULL OR l.amount >= :amountFrom) " +
            "AND (:amountTo IS NULL OR l.amount <= :amountTo)")
    Page<Ltt> search(
            @Param("channel") String channel,
            @Param("orderType") String orderType,
            @Param("status") String status,
            @Param("unitCode") String unitCode,
            @Param("paymentDateFrom") LocalDate paymentDateFrom,
            @Param("paymentDateTo") LocalDate paymentDateTo,
            @Param("requestNumber") String requestNumber,
            @Param("senderBankCode") String senderBankCode,
            @Param("receiverBankCode") String receiverBankCode,
            @Param("amountFrom") java.math.BigDecimal amountFrom,
            @Param("amountTo") java.math.BigDecimal amountTo,
            Pageable pageable);

    /**
     * Kiem tra trung so YCTT trong cung ngay, cung don vi (VAL-010).
     */
    boolean existsBySoYcttAndUnitCodeAndWorkingDateAndIsDeletedFalse(
            String soYctt, String unitCode, LocalDate workingDate);

    /**
     * Kiem tra duplicate LTT trong N phut gan nhat (BIZ-DUPLICATE).
     */
    @Query("SELECT COUNT(l) FROM Ltt l WHERE l.isDeleted = false " +
            "AND l.unitCode = :unitCode " +
            "AND l.receiverBankCode = :receiverBankCode " +
            "AND l.amount = :amount " +
            "AND l.origDocNo = :origDocNo " +
            "AND l.createdAt >= :since")
    long countDuplicateCandidates(
            @Param("unitCode") String unitCode,
            @Param("receiverBankCode") String receiverBankCode,
            @Param("amount") java.math.BigDecimal amount,
            @Param("origDocNo") String origDocNo,
            @Param("since") OffsetDateTime since);

    /**
     * Tim LTT theo trang thai de xu ly batch (hang doi).
     */
    List<Ltt> findByStateInAndIsDeletedFalse(List<String> states);
}
