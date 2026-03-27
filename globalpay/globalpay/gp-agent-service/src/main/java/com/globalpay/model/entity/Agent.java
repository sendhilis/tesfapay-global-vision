package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "agents")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Agent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(nullable = false, unique = true, length = 20)
    private String code;

    /** AGENT | SUPER_AGENT | MERCHANT */
    @Column(nullable = false, columnDefinition = "agent_type", length = 20)
    private String type = "AGENT";

    @Column(name = "business_name", length = 200)
    private String businessName;

    @Column(length = 100)
    private String region;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "float_balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal floatBalance = BigDecimal.ZERO;

    @Column(name = "float_limit", nullable = false, precision = 18, scale = 2)
    private BigDecimal floatLimit = new BigDecimal("50000.00");

    @Column(name = "commission_rate", nullable = false, precision = 5, scale = 4)
    private BigDecimal commissionRate = new BigDecimal("0.0030");

    @Column(name = "min_commission", nullable = false, precision = 18, scale = 2)
    private BigDecimal minCommission = new BigDecimal("2.00");

    @Column(precision = 3, scale = 2)
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "total_transactions", nullable = false)
    private int totalTransactions = 0;

    @Column(name = "monthly_volume", nullable = false, precision = 18, scale = 2)
    private BigDecimal monthlyVolume = BigDecimal.ZERO;

    @Column(name = "monthly_commission", nullable = false, precision = 18, scale = 2)
    private BigDecimal monthlyCommission = BigDecimal.ZERO;

    /** ACTIVE | SUSPENDED | INACTIVE */
    @Column(nullable = false, columnDefinition = "agent_status", length = 20)
    private String status = "ACTIVE";

    @Column(name = "super_agent_id")
    private UUID superAgentId;

    @Column(name = "is_open", nullable = false)
    private boolean open = true;

    @Column(name = "registered_at", nullable = false, updatable = false)
    private Instant registeredAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void onUpdate() { this.updatedAt = Instant.now(); }
}
