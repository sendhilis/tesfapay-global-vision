package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity @Table(name = "payment_transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentTransaction {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(nullable = false, unique = true, length = 30) private String reference;
    @Column(nullable = false, length = 20) private String type;  // BILL|AIRTIME|MERCHANT
    @Column(name = "user_id", nullable = false) private UUID userId;
    @Column(name = "wallet_id", length = 30) private String walletId;
    @Column(name = "biller_id") private UUID billerId;
    @Column(name = "operator_id") private UUID operatorId;
    @Column(name = "bundle_id") private UUID bundleId;
    @Column(name = "merchant_id") private UUID merchantId;
    @Column(name = "account_number", length = 100) private String accountNumber;
    @Column(name = "recipient_phone", length = 20) private String recipientPhone;
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal amount;
    @Column(nullable = false, precision = 18, scale = 2) private BigDecimal fee = BigDecimal.ZERO;
    @Column(nullable = false, length = 20) private String status = "PENDING";
    @Column(name = "loyalty_points_earned") private int loyaltyPointsEarned = 0;
    @Column(name = "balance_after", precision = 18, scale = 2) private BigDecimal balanceAfter;
    @Column(name = "idempotency_key", unique = true, length = 64) private String idempotencyKey;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition = "jsonb") private Map<String, Object> metadata;
    @Column(name = "created_at", updatable = false) private Instant createdAt = Instant.now();
    @Column(name = "completed_at") private Instant completedAt;
}
