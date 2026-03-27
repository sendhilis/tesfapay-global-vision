package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "loyalty_accounts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LoyaltyAccount {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "user_id", nullable = false, unique = true) private UUID userId;
    @Column(nullable = false) private int points = 0;
    @Column(nullable = false, length = 10) private String tier = "BRONZE";
    @Column(name = "updated_at") private Instant updatedAt = Instant.now();
    @PreUpdate public void onUpdate() { updatedAt = Instant.now(); }
}
