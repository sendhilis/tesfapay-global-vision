package com.globalpay.model.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
@Entity @Table(name = "agents") @Getter @Setter @NoArgsConstructor @AllArgsConstructor BBuilder
public class Agent {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(unique = true) private String code;
    @Column private String type = "AGENT";
    @Column(name = "float_balance") private BigDecimal floatBalance = BigDecimal.ZERO;
    @Column(name = "commission_rate") private BigDecimal commissionRate = new BigDecimal("0.0030");
    @Column private String status = "ACTIVE";
    @Column(name = "created_at", updatable = false) private Instant createdAt = Instant.now();
}
