package com.globalpay.savings.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Savings goal entity.
 * Maps to: DATABASE_SCHEMA.md §7 (savings_goals table)
 * Front-end: SavingsGoals.tsx
 */
@Entity
@Table(name = "savings_goals")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavingsGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 10)
    private String icon;

    @Column(name = "target_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal targetAmount;

    @Column(name = "saved_amount", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal savedAmount = BigDecimal.ZERO;

    private LocalDate deadline;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "ACTIVE";  // ACTIVE | COMPLETED | CANCELLED

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
}
