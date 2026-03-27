package com.globalpay.repository;

import com.globalpay.model.entity.Transfer;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransferRepository extends JpaRepository<Transfer, UUID> {
    Optional<Transfer> findByReference(String reference);
    Optional<Transfer> findByIdempotencyKey(String key);
    Page<Transfer> findBySenderUserIdOrderByCreatedAtDesc(UUID senderId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(t.totalDeducted),0) FROM Transfer t " +
           "WHERE t.senderUserId = :userId AND t.status = 'COMPLETED' AND t.createdAt >= :since")
    BigDecimal sumSentSince(UUID userId, Instant since);
}
