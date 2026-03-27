package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "user_profiles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserProfile {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "user_id", nullable = false, unique = true) private UUID userId;
    @Column(nullable = false, unique = true, length = 20) private String phone;
    @Column(name = "first_name", nullable = false, length = 100) private String firstName;
    @Column(name = "last_name", nullable = false, length = 100) private String lastName;
    @Column(name = "wallet_id", nullable = false, unique = true, length = 30) private String walletId;
    @Column(name = "kyc_level", nullable = false) private Short kycLevel = 1;
    @Column(nullable = false, length = 20) private String status = "ACTIVE";
    @Column(name = "loyalty_tier", length = 10) private String loyaltyTier = "BRONZE";
    @Column(name = "loyalty_points") private int loyaltyPoints = 0;
    @Column(name = "avatar_url") private String avatarUrl;
    @Column(name = "notifications_enabled") private boolean notificationsEnabled = true;
    @Column(name = "daily_limit", precision = 18, scale = 2) private BigDecimal dailyLimit = new BigDecimal("25000.00");
    @Column(name = "monthly_limit", precision = 18, scale = 2) private BigDecimal monthlyLimit = new BigDecimal("100000.00");
    @Column(name = "total_transactions") private int totalTransactions = 0;
    @Column(name = "monthly_volume", precision = 18, scale = 2) private BigDecimal monthlyVolume = BigDecimal.ZERO;
    @Column(name = "created_at", updatable = false) private Instant createdAt = Instant.now();
    @Column(name = "updated_at") private Instant updatedAt = Instant.now();
    @PreUpdate public void onUpdate() { updatedAt = Instant.now(); }
    public String getFullName() { return firstName + " " + lastName; }
}
