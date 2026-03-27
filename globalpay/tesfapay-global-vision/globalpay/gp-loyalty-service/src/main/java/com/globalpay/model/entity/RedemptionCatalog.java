package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "redemption_catalog")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RedemptionCatalog {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable = false) private String name;
    @Column(length = 10) private String icon;
    @Column(name = "points_cost", nullable = false) private int pointsCost;
    @Column(name = "reward_type", nullable = false, length = 30) private String rewardType;
    @Column(name = "reward_value", precision = 18, scale = 2) private BigDecimal rewardValue;
    @Column(name = "min_tier", length = 10) private String minTier;
    @Column(name = "is_active") private boolean active = true;
    @Column(name = "created_at", updatable = false) private Instant createdAt = Instant.now();
}
