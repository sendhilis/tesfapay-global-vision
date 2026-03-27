package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "agent_customers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AgentCustomer {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "agent_id", nullable = false) private UUID agentId;
    @Column(name = "customer_user_id", nullable = false) private UUID customerUserId;
    @Column(name = "customer_phone", nullable = false, length = 20) private String customerPhone;
    @Column(name = "customer_name", length = 200) private String customerName;
    @Column(name = "kyc_level", nullable = false) private Short kycLevel = 1;
    @Column(name = "last_transaction_at") private Instant lastTransactionAt;
    @Column(name = "total_transactions", nullable = false) private int totalTransactions = 0;
    @Column(name = "registered_by_agent", nullable = false) private boolean registeredByAgent = false;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
