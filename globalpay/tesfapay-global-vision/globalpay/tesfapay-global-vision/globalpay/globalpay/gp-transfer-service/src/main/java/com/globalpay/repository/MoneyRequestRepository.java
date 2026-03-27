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
    Page<MoneyRequest> findByRequesterIdAndStatusOrderByCreatedAtDesc(UUID id, String status, Pageable p);
    Page<MoneyRequest> findByTargetUserIdAndStatusOrderByCreatedAtDesc(UUID id, String status, Pageable p);

    @Modifying
    @Query("UPDATE MoneyRequest m SET m.status='EXPIRED' WHERE m.status='PENDING' AND m.expiresAt < :now")
    int expireOldRequests(Instant now);
}
