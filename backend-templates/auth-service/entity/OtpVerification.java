package com.globalpay.auth.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * OTP verification entity.
 * Maps to: DATABASE_SCHEMA.md §4 (otp_verifications table)
 */
@Entity
@Table(name = "otp_verifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OtpVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 10)
    private String code;  // hashed OTP

    @Column(nullable = false, length = 30)
    private String purpose;  // REGISTRATION | CASH_IN | CASH_OUT | PIN_RESET

    @Builder.Default
    private Short attempts = 0;

    @Column(name = "max_attempts")
    @Builder.Default
    private Short maxAttempts = 3;

    @Builder.Default
    private Boolean verified = false;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
