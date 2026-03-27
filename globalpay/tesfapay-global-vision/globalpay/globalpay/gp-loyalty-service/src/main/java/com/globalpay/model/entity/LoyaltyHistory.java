package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "loyalty_history")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoyaltyHistory {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "transaction_id") private UUID transactionId;
    @Column(nullable = false, length = 200) private String label;
    @Column(nullable = false) private int points;
    @Column(name = "created_at", updatable = false) private Instant createdAt = Instant.now();
}
