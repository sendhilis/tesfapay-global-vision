package com.globalpay.transfer.entity;

import com.globalpay.common.enums.TransactionStatus;
import com.globalpay.common.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Transaction entity — central ledger. EVERY financial movement is recorded here.
 * Maps to: DATABASE_SCHEMA.md §4 (transactions table)
 * Front-end: TransactionHistory.tsx, AdminTransactions.tsx
 *
 * This is the SINGLE SOURCE OF TRUTH for all financial activity.
 */
@Entity
@Table(name = "transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String reference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private TransactionType type;

    @Column(name = "sender_user_id")
    private UUID senderUserId;

    @Column(name = "recipient_user_id")
    private UUID recipientUserId;

    @Column(name = "sender_wallet_id", length = 30)
    private String senderWalletId;

    @Column(name = "recipient_wallet_id", length = 30)
    private String recipientWalletId;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal fee = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "ETB";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private TransactionStatus status = TransactionStatus.PENDING;

    @Column(name = "counterparty_name", length = 200)
    private String counterpartyName;

    @Column(length = 500)
    private String note;

    @Column(name = "loyalty_points_earned")
    @Builder.Default
    private Integer loyaltyPointsEarned = 0;

    @Column(name = "balance_after", precision = 18, scale = 2)
    private BigDecimal balanceAfter;

    @Column(nullable = false)
    @Builder.Default
    private Boolean flagged = false;

    @Column(name = "flagged_reason", length = 500)
    private String flaggedReason;

    @Column(name = "agent_id")
    private UUID agentId;

    @Column(name = "merchant_id")
    private UUID merchantId;

    @Column(name = "biller_id")
    private UUID billerId;

    @Column(name = "reversal_of")
    private UUID reversalOf;

    @Column(name = "idempotency_key", unique = true, length = 64)
    private String idempotencyKey;

    @Column(columnDefinition = "jsonb")
    private String metadata;  // Use @Type(JsonType.class) with Hibernate Types

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;
}
