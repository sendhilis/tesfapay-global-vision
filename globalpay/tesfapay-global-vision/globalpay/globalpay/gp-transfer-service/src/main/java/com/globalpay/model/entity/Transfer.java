package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "transfers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Transfer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String reference;

    @Column(name = "sender_user_id", nullable = false)
    private UUID senderUserId;

    @Column(name = "sender_wallet_id", nullable = false, length = 30)
    private String senderWalletId;

    @Column(name = "recipient_user_id")
    private UUID recipientUserId;

    @Column(name = "recipient_wallet_id", length = 30)
    private String recipientWalletId;

    @Column(name = "recipient_phone", nullable = false, length = 20)
    private String recipientPhone;

    @Column(name = "recipient_name", length = 200)
    private String recipientName;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal fee;

    @Column(name = "total_deducted", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalDeducted;

    @Column(length = 500)
    private String note;

    /** PENDING | COMPLETED | FAILED */
    @Column(nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "wallet_txn_id")
    private UUID walletTxnId;

    @Column(name = "loyalty_points_earned", nullable = false)
    private int loyaltyPointsEarned = 0;

    @Column(name = "balance_after", precision = 18, scale = 2)
    private BigDecimal balanceAfter;

    @Column(name = "idempotency_key", unique = true, length = 64)
    private String idempotencyKey;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;
}
