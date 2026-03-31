package com.globalpay.repository;
import com.globalpay.model.entity.*;
import org.springframework.data.domain.*;
import org.springframework.data.jpa.repository.*;
import org.springframework.stereotype.Repository;
import java.util.*;
@Repository
public interface AgentFloatHistoryRepository extends JpaRepository<AgentFloatHistory, UUID> {
    List<AgentFloatHistory> findByAgentIdOrderByCreatedAtDesc(UUID agentId);
}
