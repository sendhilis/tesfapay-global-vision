package com.globalpay.auth.entity;

import com.globalpay.common.enums.UserStatus;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * User entity — maps to DATABASE_SCHEMA.md §2 (users table).
 *
 * Front-end: LoginPage.tsx, Onboarding.tsx, UserProfile.tsx
 * API: POST /auth/register, POST /auth/login, GET /users/me
 */
@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 20)
    private String phone;

    @Column(name = "first_name", nullable = false, length = 100)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 100)
    private String lastName;

    @Column(name = "pin_hash", nullable = false)
    private String pinHash;

    @Column(name = "wallet_id", nullable = false, unique = true, length = 30)
    private String walletId;

    @Column(name = "kyc_level", nullable = false)
    @Builder.Default
    private Short kycLevel = 1;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "biometric_token")
    private String biometricToken;

    @Column(name = "daily_limit", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal dailyLimit = new BigDecimal("25000.00");

    @Column(name = "monthly_limit", precision = 18, scale = 2)
    @Builder.Default
    private BigDecimal monthlyLimit = new BigDecimal("100000.00");

    @Column(name = "notifications_enabled")
    @Builder.Default
    private Boolean notificationsEnabled = true;

    @Column(name = "failed_pin_attempts")
    @Builder.Default
    private Short failedPinAttempts = 0;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
