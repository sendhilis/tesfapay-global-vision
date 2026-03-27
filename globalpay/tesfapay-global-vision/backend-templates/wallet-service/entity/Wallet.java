package com.globalpay.wallet.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Wallet entity — holds user's main, savings, and loan balances.
 * Maps to: DATABASE_SCHEMA.md §3 (wallets table)
 * Front-end: WalletHome.tsx (balance card)
 * API: GET /wallet/balance, GET /wallet/summary
 */
@Entity
@Table(name = "wallets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "main_balance", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal mainBalance = BigDecimal.ZERO;

    @Column(name = "savings_balance", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal savingsBalance = BigDecimal.ZERO;

    @Column(name = "loan_balance", nullable = false, precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal loanBalance = BigDecimal.ZERO;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "ETB";

    @Column(name = "is_locked", nullable = false)
    @Builder.Default
    private Boolean isLocked = false;

    @Column(name = "locked_reason")
    private String lockedReason;

    @Column(name = "last_activity")
    private Instant lastActivity;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
        this.lastActivity = Instant.now();
    }
}
