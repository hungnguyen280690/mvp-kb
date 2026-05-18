package com.kb.ltt.domain.repository;

import com.kb.ltt.domain.model.PaymentOrder;
import com.kb.ltt.domain.model.enums.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {

    Optional<PaymentOrder> findByUuid(String uuid);

    Optional<PaymentOrder> findByIdAndIsDeletedFalse(Long id);

    @Query("SELECT po FROM PaymentOrder po " +
            "WHERE po.isDeleted = false " +
            "AND (:statuses IS NULL OR po.status IN :statuses) " +
            "AND (:sender IS NULL OR po.sender = :sender) " +
            "AND (:channel IS NULL OR po.channel = :channel) " +
            "AND (:fromDate IS NULL OR po.createdDate >= :fromDate) " +
            "AND (:toDate IS NULL OR po.createdDate <= :toDate)")
    Page<PaymentOrder> findByFilters(
            @Param("statuses") List<OrderStatus> statuses,
            @Param("sender") String sender,
            @Param("channel") String channel,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable);

    boolean existsByRefNoAndIsDeletedFalse(String refNo);
}
