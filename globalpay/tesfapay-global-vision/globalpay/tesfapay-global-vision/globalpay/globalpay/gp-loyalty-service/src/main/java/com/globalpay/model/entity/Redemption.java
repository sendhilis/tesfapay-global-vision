package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "redemptions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Redemption {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "catalog_item_id", nullable = false) private UUID catalogItemId;
    @Column(name = "points_spent", nullable = false) private int pointsSpent;
    @Column(name = "reward_name", nullable = false) private String rewardName;
    @Column(name = "cashback_amount", precision = 18, scale = 2) private BigDecimal cashbackAmount;
    @Column(nullable = false, length = 20) private String status = "COMPLETED";
    @Column(name = "created_at", updatable = false) private Instant createdAt = Instant.now();
}
