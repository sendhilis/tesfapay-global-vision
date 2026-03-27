package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "otp_codes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OtpCode {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(name = "code_hash", nullable = false)
    private String codeHash;

    /** REGISTRATION | LOGIN | CASH_IN | CASH_OUT | PIN_RESET */
    @Column(nullable = false, length = 30)
    private String purpose;

    @Column(nullable = false)
    private Short attempts = 0;

    @Column(name = "max_attempts", nullable = false)
    private Short maxAttempts = 3;

    @Column(nullable = false)
    private boolean verified = false;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public boolean isExpired() {
        return expiresAt.isBefore(Instant.now());
    }

    public boolean isMaxAttemptsReached() {
        return attempts >= maxAttempts;
    }
}
