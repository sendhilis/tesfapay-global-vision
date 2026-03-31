package com.globalpay.repository;
import com.globalpay.model.entity.LoyaltyHistory;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import java.util.*;
public interface LoyaltyHistoryRepository extends JpaRepository<LoyaltyHistory, UUID> { Page<LoyaltyHistory> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable); }
