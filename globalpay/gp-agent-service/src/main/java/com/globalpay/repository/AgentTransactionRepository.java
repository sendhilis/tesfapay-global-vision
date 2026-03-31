package com.globalpay.repository;
import com.globalpay.model.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.*;
@Repository
public interface AgentTransactionRepository extends JpaRepository<AgentTransaction, UUID> {
    Optional<AgentTransaction> findByReference(String ref);
    Page<AgentTransaction> findByAgentIdOrderByCreatedAtDesc(UUID agentId, Pageable pageable);
}
