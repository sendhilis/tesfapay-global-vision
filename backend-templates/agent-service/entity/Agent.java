package com.globalpay.agent.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Agent entity — registered agents and super agents.
 * Maps to: DATABASE_SCHEMA.md §6 (agents table)
 * Front-end: AgentHome.tsx, AgentProfile.tsx, AdminAgents.tsx
 */
@Entity
@Table(name = "agents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Agent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(nullable = false, unique = true, length = 20)
    private String code;  // AGT-001

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String type = "AGENT";  // AGENT | SUPER_AGENT

    @Column(name = "business_name", length = 200)
    private String businessName;

    @Column(length = 100)
    private String region;

    private String address;

    @Column(precision = 10, scale = 7)
    private BigDecimal latitude;

    @Column(precision = 10, scale = 7)
    private BigDecimal longitude;

    @Column(name = "float_balance", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal floatBalance = BigDecimal.ZERO;

    @Column(name = "float_limit", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal floatLimit = new BigDecimal("50000.00");

    @Column(name = "commission_rate", nullable = false, precision = 5, scale = 4)
    @Builder.Default
    private BigDecimal commissionRate = new BigDecimal("0.0030");

    @Column(name = "min_commission", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal minCommission = new BigDecimal("2.00");

    @Column(precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal rating = BigDecimal.ZERO;

    @Column(name = "total_transactions")
    @Builder.Default
    private Integer totalTransactions = 0;

    @Column(name = "monthly_volume", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal monthlyVolume = BigDecimal.ZERO;

    @Column(name = "monthly_commission", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal monthlyCommission = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";

    @Column(name = "super_agent_id")
    private UUID superAgentId;

    @Column(name = "is_open", nullable = false)
    @Builder.Default
    private Boolean isOpen = true;

    @Column(name = "registered_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant registeredAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
