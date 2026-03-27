package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

@Entity
@Table(name = "users")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
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
    private Short kycLevel = 1;

    @Column(nullable = false, length = 20)
    private String status = "PENDING_KYC";

    @Column(name = "daily_limit", precision = 18, scale = 2)
    private BigDecimal dailyLimit = new BigDecimal("25000.00");

    @Column(name = "monthly_limit", precision = 18, scale = 2)
    private BigDecimal monthlyLimit = new BigDecimal("100000.00");

    @Column(name = "failed_pin_attempts", nullable = false)
    private Short failedPinAttempts = 0;

    @Column(name = "locked_until")
    private Instant lockedUntil;

    @Column(name = "biometric_token")
    private String biometricToken;

    @Column(name = "last_login_at")
    private Instant lastLoginAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Builder.Default
    private Set<UserRole> roles = new HashSet<>();

    @PreUpdate
    public void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public boolean isLocked() {
        return lockedUntil != null && lockedUntil.isAfter(Instant.now());
    }

    public boolean isActive() {
        return "ACTIVE".equals(status);
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
