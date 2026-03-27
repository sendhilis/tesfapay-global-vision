package com.globalpay.repository;
import com.globalpay.model.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;
@Repository interface AgentRepository extends JpaRepository<Agent,UUID> {
    Optional<Agent> findByUserId(UUID userId);
    @Modifying @Query("UPDATE Agent a SET a.floatBalance=a.floatBalance-:amount WHERE a.id=:id AND a.floatBalance>=:amount") int debitFloat(UUID id,BigDecimal amount);
    @Modifying @Query("UPDATE Agent a SET a.floatBalance=a.floatBalance+:amount WHERE a.id=:id") int creditFloat(UUID id,BigDecimal amount);
    List<Agent> findByStatusOrderByCreatedAtDesc(String s);
}
@Repository interface AgentTransactionRepository extends JpaRepository<AgentTransaction,UUID> {
    Page<AgentTransaction> findByAgentIdOrderByCreatedAtDesc(UUID id,Pageable p);
}
@Repository interface AgentCommissionRepository extends JpaRepository<AgentCommission,UUID> {
    Page<AgentCommission> findByAgentIdOrderByCreatedAtDesc(UUID id,Pageable p);
    @Query("SELECT COALESCE(SUM(c.commissionAmount),0) FROM AgentCommission c WHERE c.agentId=:id AND c.createdAt>=:since") BigDecimal sumSince(UUID id,Instant since);
    @Query("SELECT COALESCE(COUNT(c),0) FROM AgentCommission c WHERE c.agentId=:id AND c.createdAt>=:since") long countSince(UUID id,Instant since);
}
@Repository interface AgentFloatHistoryRepository extends JpaRepository<AgentFloatHistory,UUID> {
    List<AgentFloatHistory> findByAgentIdOrderByCreatedAtDesc(UUID id,Pageable p);
}
@Repository interface AgentFloatRequestRepository extends JpaRepository<AgentFloatRequest,UUID> {}
@Repository interface AgentCustomerRepository extends JpaRepository<AgentCustomer,UUID> {
    Optional<AgentCustomer> findByAgentIdAndCustomerUserId(UUID a,UUID c);
    Page<AgentCustomer> findByAgentIdOrderByLastTransactionAtDesc(UUID id,Pageable p);
}
