package com.globalpay.repository;
import com.globalpay.model.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
@Repository
public interface AgentCommissionRepository extends JpaRepository<AgentCommission, UUID> {
    Page<AgentCommission> findByAgentIdOrderByCreatedAtDesc(UUID agentId, Pageable pageable);
    @Query("SELECT COALESCE(SUM(c.commissionAmount),0) FROM AgentCommission c WHERE c.agentId = :id AND c.createdAt >= :since")
    BigDecimal sumSince(UUID id, Instant since);
}
