package com.globalpay.repository;

import com.globalpay.model.entity.MoneyRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MoneyRequestRepository extends JpaRepository<MoneyRequest, UUID> {

    Optional<MoneyRequest> findByReference(String reference);

    Page<MoneyRequest> findByRequesterIdAndStatusOrderByCreatedAtDesc(UUID requesterId, String status, Pageable pageable);

    Page<MoneyRequest> findByTargetUserIdAndStatusOrderByCreatedAtDesc(UUID targetUserId, String status, Pageable pageable);

    @Modifying
    @Query("UPDATE MoneyRequest m SET m.status = 'EXPIRED' WHERE m.status = 'PENDING' AND m.expiresAt < :now")
    int expireOldRequests(Instant now);
}
