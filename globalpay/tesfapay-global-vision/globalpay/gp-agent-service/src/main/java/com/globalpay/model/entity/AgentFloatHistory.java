package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "agent_float_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AgentFloatHistory {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "agent_id", nullable = false) private UUID agentId;
    @Column(nullable = false, columnDefinition = "float_entry_type", length = 20) private String type;
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal amount;
    @Column(name = "balance_after", nullable = false, precision = 18, scale = 2) private BigDecimal balanceAfter;
    @Column(length = 100) private String source;
    @Column(length = 500) private String reason;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
