package com.globalpay.repository;

import com.globalpay.model.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.*;

@Repository
interface AgentRepository extends JpaRepository<Agent, UUID> {
    Optional<Agent> findByCode(String code);
    Optional<Agent> findByUserId(UUID userId);
    boolean existsByCode(String code);

    @Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Agent a WHERE a.id = :id")
    Optional<Agent> findByIdForUpdate(UUID id);

    @Modifying
    @Query("UPDATE Agent a SET a.floatBalance = a.floatBalance - :amount WHERE a.id = :id AND a.floatBalance >= :amount")
    int debitFloat(UUID id, BigDecimal amount);

    @Modifying
    @Query("UPDATE Agent a SET a.floatBalance = a.floatBalance + :amount WHERE a.id = :id")
    int creditFloat(UUID id, BigDecimal amount);

    @Query("SELECT a FROM Agent a WHERE a.status = 'ACTIVE' AND " +
           "6371 * acos(cos(radians(:lat)) * cos(radians(a.latitude)) * cos(radians(a.longitude) - radians(:lng)) + " +
           "sin(radians(:lat)) * sin(radians(a.latitude))) < :radiusKm ORDER BY " +
           "6371 * acos(cos(radians(:lat)) * cos(radians(a.latitude)) * cos(radians(a.longitude) - radians(:lng)) + " +
           "sin(radians(:lat)) * sin(radians(a.latitude)))")
    List<Agent> findNearby(double lat, double lng, double radiusKm, Pageable pageable);
}

@Repository
interface AgentTransactionRepository extends JpaRepository<AgentTransaction, UUID> {
    Optional<AgentTransaction> findByReference(String reference);
    Page<AgentTransaction> findByAgentIdOrderByCreatedAtDesc(UUID agentId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(a.commissionAmount),0) FROM AgentCommission a " +
           "WHERE a.agentId = :agentId AND a.createdAt >= :since")
    BigDecimal sumCommissionSince(UUID agentId, Instant since);
}

@Repository
interface AgentCommissionRepository extends JpaRepository<AgentCommission, UUID> {
    Page<AgentCommission> findByAgentIdOrderByCreatedAtDesc(UUID agentId, Pageable pageable);

    @Query("SELECT COALESCE(SUM(c.commissionAmount),0) FROM AgentCommission c WHERE c.agentId = :id AND c.createdAt >= :since")
    BigDecimal sumSince(UUID id, Instant since);

    @Query("SELECT COALESCE(COUNT(c),0) FROM AgentCommission c WHERE c.agentId = :id AND c.createdAt >= :since")
    long countSince(UUID id, Instant since);
}

@Repository
interface AgentFloatHistoryRepository extends JpaRepository<AgentFloatHistory, UUID> {
    List<AgentFloatHistory> findByAgentIdOrderByCreatedAtDesc(UUID agentId, Pageable pageable);
}

@Repository
interface AgentFloatRequestRepository extends JpaRepository<AgentFloatRequest, UUID> {
    List<AgentFloatRequest> findByAgentIdOrderByCreatedAtDesc(UUID agentId);
}

@Repository
interface AgentCustomerRepository extends JpaRepository<AgentCustomer, UUID> {
    Optional<AgentCustomer> findByAgentIdAndCustomerUserId(UUID agentId, UUID customerId);
    Page<AgentCustomer> findByAgentIdOrderByLastTransactionAtDesc(UUID agentId, Pageable pageable);
}
