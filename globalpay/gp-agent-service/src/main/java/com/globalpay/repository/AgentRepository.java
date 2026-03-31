package com.globalpay.repository;
import com.globalpay.model.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.*;
@Repository
public interface AgentRepository extends JpaRepository<Agent, UUID> {
    Optional<Agent> findByCode(String code);
    Optional<Agent> findByUserId(UUID userId);
    boolean existsByCode(String code);
    @Modifying
    @Query("UPDATE Agent a SET a.floatBalance = a.floatBalance - :amount WHERE a.id = :id AND a.floatBalance >= :amount")
    int debitFloat(UUID id, BigDecimal amount);
    @Modifying
    @Query("UPDATE Agent a SET a.floatBalance = a.floatBalance + :amount WHERE a.id = :id")
    int creditFloat(UUID id, BigDecimal amount);
}
