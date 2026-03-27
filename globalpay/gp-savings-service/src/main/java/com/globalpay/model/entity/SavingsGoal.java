package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity @Table(name = "savings_goals")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SavingsGoal {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(nullable = false, length = 100) private String name;
    @Column(length = 10) private String icon;
    @Column(name = "target_amount", nullable = false, precision = 18, scale = 2) private BigDecimal targetAmount;
    @Column(name = "saved_amount", nullable = false, precision = 18, scale = 2) private BigDecimal savedAmount = BigDecimal.ZERO;
    private LocalDate deadline;
    @Column(nullable = false, length = 20) private String status = "ACTIVE";
    @Column(name = "created_at", updatable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at") private Instant updatedAt = Instant.now();
    @PreUpdate public void onUpdate() { updatedAt = Instant.now(); }
    public int getPercentComplete() {
        if (targetAmount.compareTo(BigDecimal.ZERO) == 0) return 0;
        return savedAmount.multiply(BigDecimal.valueOf(100)).divide(targetAmount, 0, java.math.RoundingMode.HALF_UP).intValue();
    }
}
