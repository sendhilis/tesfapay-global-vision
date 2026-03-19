package com.globalpay.transfer.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Money request entity — P2P money request tracking.
 * Maps to: DATABASE_SCHEMA.md §4 (money_requests table)
 * Front-end: RequestMoney.tsx
 * API: POST /transfers/request, GET /transfers/requests, PUT /transfers/requests/{id}
 */
@Entity
@Table(name = "money_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MoneyRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 30)
    private String reference;

    @Column(name = "requester_id", nullable = false)
    private UUID requesterId;

    @Column(name = "target_user_id", nullable = false)
    private UUID targetUserId;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(length = 500)
    private String note;

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PENDING";  // PENDING | ACCEPTED | DECLINED | EXPIRED

    @Column(name = "transaction_id")
    private UUID transactionId;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "responded_at")
    private Instant respondedAt;
}
