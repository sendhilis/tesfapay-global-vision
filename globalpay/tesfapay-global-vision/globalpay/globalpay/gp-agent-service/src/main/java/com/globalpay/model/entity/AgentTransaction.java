package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "agent_transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AgentTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String reference;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "agent_id", nullable = false)
    private Agent agent;

    /** CASH_IN | CASH_OUT */
    @Column(nullable = false, length = 20)
    private String type;

    @Column(name = "customer_user_id", nullable = false)
    private UUID customerUserId;

    @Column(name = "customer_phone", nullable = false, length = 20)
    private String customerPhone;

    @Column(name = "customer_name", length = 200)
    private String customerName;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal fee;

    @Column(name = "net_amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal netAmount;

    @Column(name = "otp_code_hash")
    private String otpCodeHash;

    /** PENDING_AGENT | COMPLETED | FAILED | EXPIRED */
    @Column(nullable = false, length = 20)
    private String status = "PENDING_AGENT";

    @Column(name = "wallet_txn_id")
    private UUID walletTxnId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "completed_at")
    private Instant completedAt;
}
