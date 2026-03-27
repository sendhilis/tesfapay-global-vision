package com.globalpay.model.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity @Table(name = "merchants")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Merchant {
    @Id @GeneratedValue(strategy = GenerationType.UUID) private UUID id;
    @Column(name = "merchant_id", nullable = false, unique = true, length = 20) private String merchantId;
    @Column(nullable = false) private String name;
    @Column(nullable = false, length = 50) private String category;
    @Column(length = 10) private String icon;
    private String address;
    @Column(precision = 10, scale = 7) private BigDecimal latitude;
    @Column(precision = 10, scale = 7) private BigDecimal longitude;
    @Column(name = "qr_payload", length = 255) private String qrPayload;
    @Column(nullable = false, length = 20) private String status = "ACTIVE";
    @Column(name = "created_at", updatable = false) private Instant createdAt = Instant.now();
}
