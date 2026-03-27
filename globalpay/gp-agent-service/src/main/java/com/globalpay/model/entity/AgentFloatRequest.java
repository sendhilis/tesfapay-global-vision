package com.globalpay.model.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="agent_float_requests") @Getter @Setter @NoArgsConstructor @AllArgsConstructor BBuilder
public class AgentFloatRequest {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(name="agent_id") private UUID agentId;
    @Column(name="super_agent_id") private UUID superAgentId;
    @Column(precision=18,scale=2) private BigDecimal amount;
    @Column private String note;
    @Column private String status="PENDING";
    @Column(name="created_at",updatable=false) private Instant createdAt=Instant.now();
}
