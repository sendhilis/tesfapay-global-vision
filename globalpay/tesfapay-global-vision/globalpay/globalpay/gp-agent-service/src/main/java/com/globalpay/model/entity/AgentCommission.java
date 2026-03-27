package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "agent_commissions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AgentCommission {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "agent_id", nullable = false) private UUID agentId;
    @Column(name = "transaction_ref", nullable = false, length = 30) private String transactionRef;
    @Column(nullable = false, length = 20) private String type;
    @Column(name = "transaction_amount", nullable = false, precision = 18, scale = 2) private BigDecimal transactionAmount;
    @Column(name = "commission_amount", nullable = false, precision = 18, scale = 2) private BigDecimal commissionAmount;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
