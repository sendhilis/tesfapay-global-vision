package com.globalpay.model.entity;

import com.globalpay.model.enums.TransactionStatus;
import com.globalpay.model.enums.TransactionType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String reference;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "txn_type")
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

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal fee = BigDecimal.ZERO;

    @Column(name = "total_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal totalAmount;

    @Column(nullable = false, length = 3)
    private String currency = "ETB";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, columnDefinition = "txn_status")
    private TransactionStatus status = TransactionStatus.PENDING;

    @Column(name = "counterparty_name", length = 200)
    private String counterpartyName;

    @Column(length = 500)
    private String note;

    @Column(name = "loyalty_points_earned", nullable = false)
    private Integer loyaltyPointsEarned = 0;

    @Column(name = "balance_after", precision = 18, scale = 2)
    private BigDecimal balanceAfter;

    @Column(nullable = false)
    private boolean flagged = false;

    @Column(name = "flagged_reason", length = 500)
    private String flaggedReason;

    @Column(name = "agent_id")
    private UUID agentId;

    @Column(name = "merchant_id")
    private UUID merchantId;

    @Column(name = "biller_id")
    private UUID billerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reversal_of")
    private Transaction reversalOf;

    @Column(name = "idempotency_key", unique = true, length = 64)
    private String idempotencyKey;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> metadata;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;
}
