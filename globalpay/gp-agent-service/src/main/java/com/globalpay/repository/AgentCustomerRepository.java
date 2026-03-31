package com.globalpay.repository;
import com.globalpay.model.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import java.util.*;
public interface AgentCustomerRepository extends JpaRepository<AgentCustomer, UUID> {
    Optional<AgentCustomer> findByAgentIdAndCustomerUserId(UUID agentId, UUID customerId);
    Page<AgentCustomer> findByAgentIdOrderByLastTransactionAtDesc(UUID agentId, Pageable pageable);
}
