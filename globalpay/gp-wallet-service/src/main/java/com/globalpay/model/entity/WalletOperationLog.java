package com.globalpay.model.entity;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;
/**
 * Immutable audit log of every wallet operation.
 * Used for: reconciliation, dispute resolution, regulatory reporting,
 * and detecting double-credits or ghost transactions.
 */
@Entity @Table(name = "wallet_operation_logs", indexes = {
    @Index(name = "idx_wol_idempotency", columnList = "idempotency_key", unique = true),
    @Index(name = "idx_wol_wallet", columnList = "wallet_id"),
    @Index(name = "idx_wol_ref", columnList = "reference")
})
@Getter @NoArgsConstructor @AllArgsConstructor @Builder
public class WalletOperationLog {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "wallet_id", nullable = false) private UUID walletId;
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(nullable = false, length = 10) private String direction; // DEBIT | CREDIT
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal amount;
    @Column(name = "balance_before", precision = 18, scale = 2) private BigDecimal balanceBefore;
    @Column(name = "balance_after", precision = 18, scale = 2) private BigDecimal balanceAfter;
    @Column(nullable = false, length = 30) private String type;
    @Column(nullable = false, unique = true, length = 40) private String reference;
    @Column(name = "idempotency_key", unique = true, length = 100) private String idempotencyKey;
    @Column(name = "counterparty_name", length = 200) private String counterpartyName;
    @Column(length = 500) private String note;
    @Column(nullable = false, length = 20) private String status;
    @Column(name = "failure_reason", length = 500) private String failureReason;
    @Column(name = "reversal_of") private UUID reversalOf;
    @Column(name = "reversed_by") private UUID reversedBy;
    @Column(name = "channel", length = 30) private String channel; // USSD|APP|AGENT|API|SYSTEM
    @Column(name = "created_at", updatable = false, nullable = false) private Instant createdAt = Instant.now();
}