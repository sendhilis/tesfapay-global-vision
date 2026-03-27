package com.globalpay.model.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name="agent_float_history") @Getter Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AgentFloatHistory {
    @Id @GeneratedValue(strategy=GenerationType.UUID) private UUID id;
    @Column(name="agent_id") private UUID agentId;
    @Column private String type;
    @Column(precision=18,scale=2) private BigDecimal amount;
    @Column(name="balance_after",precision=18,scale=2) private BigDecimal balanceAfter;
    @Column private String source;
    @Column(name="created_at",updatable=false) private Instant createdAt=Instant.now();
}
