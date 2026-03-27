package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "agent_float_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AgentFloatRequest {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "agent_id", nullable = false) private UUID agentId;
    @Column(name = "super_agent_id", nullable = false) private UUID superAgentId;
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal amount;
    @Column(length = 500) private String note;
    @Column(nullable = false, length = 20) private String status = "PENDING";
    @Column(name = "responded_at") private Instant respondedAt;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt = Instant.now();
}
