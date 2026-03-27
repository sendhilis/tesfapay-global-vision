package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "wallets")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Wallet {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(name = "wallet_id", nullable = false, unique = true, length = 30)
    private String walletId;

    @Column(name = "main_balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal mainBalance = BigDecimal.ZERO;

    @Column(name = "savings_balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal savingsBalance = BigDecimal.ZERO;

    @Column(name = "loan_balance", nullable = false, precision = 18, scale = 2)
    private BigDecimal loanBalance = BigDecimal.ZERO;

    @Column(nullable = false, length = 3)
    private String currency = "ETB";

    @Column(name = "is_locked", nullable = false)
    private boolean locked = false;

    @Column(name = "locked_reason")
    private String lockedReason;

    @Column(name = "last_activity")
    private Instant lastActivity;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
        this.lastActivity = Instant.now();
    }
}
